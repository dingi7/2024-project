package util

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"path/filepath"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
)

// DockerClient provides methods for interacting with Docker containers
type DockerClient struct {
	client *client.Client
	pool   chan struct{}
}

// NewDockerClient creates a new Docker client with connection pooling
func NewDockerClient(maxContainers int) (*DockerClient, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker client: %w", err)
	}

	// Create a semaphore to limit concurrent container executions
	pool := make(chan struct{}, maxContainers)
	for i := 0; i < maxContainers; i++ {
		pool <- struct{}{}
	}

	return &DockerClient{
		client: cli,
		pool:   pool,
	}, nil
}

// Close closes the Docker client
func (d *DockerClient) Close() error {
	return d.client.Close()
}

// StatsResult contains the resource usage statistics
type StatsResult struct {
	CPUPercent    float64 `json:"cpu_percent"`
	MemoryUsage   uint64  `json:"memory_usage"`
	MemoryPercent float64 `json:"memory_percent"`
	Duration      int64   `json:"duration_ms"`
}

// ExecuteContainer runs code in a Docker container with resource monitoring
func (d *DockerClient) ExecuteContainer(ctx context.Context, image, codeFile, inputString string, timeoutMs int, memoryLimitMB int) (string, *StatsResult, error) {
	// Acquire a token from the pool
	select {
	case <-d.pool:
		// Got a token, proceed
		defer func() {
			// Return the token when done
			d.pool <- struct{}{}
		}()
	case <-ctx.Done():
		// Context cancelled before we could acquire a token
		return "", nil, ctx.Err()
	}

	// Prepare absolute path for volume mount
	absPath, err := filepath.Abs(codeFile)
	if err != nil {
		return "", nil, fmt.Errorf("failed to get absolute path: %w", err)
	}

	// Create a container configuration depending on the file type
	extension := filepath.Ext(codeFile)
	filename := filepath.Base(codeFile)
	containerPath := "/app/" + filename

	// Create a container configuration
	config := &container.Config{
		Image: image,
		Cmd:   getContainerCommand(extension, containerPath, inputString),
		Tty:   false,
	}

	// Host configuration with resource limits
	hostConfig := &container.HostConfig{
		Resources: container.Resources{
			Memory:     int64(memoryLimitMB) * 1024 * 1024, // Convert MB to bytes
			MemorySwap: -1,                                 // Disable swap
			CPUPeriod:  100000,
			CPUQuota:   100000, // Limit to 1 CPU
		},
		Mounts: []mount.Mount{
			{
				Type:   mount.TypeBind,
				Source: absPath,
				Target: containerPath,
			},
		},
		NetworkMode: "none", // Disable network
	}

	// Create the container
	resp, err := d.client.ContainerCreate(ctx, config, hostConfig, nil, nil, "")
	if err != nil {
		return "", nil, fmt.Errorf("failed to create container: %w", err)
	}

	containerID := resp.ID
	defer cleanupContainer(d.client, containerID)

	// Start timer for execution duration
	startTime := time.Now()

	// Start the container
	if err := d.client.ContainerStart(ctx, containerID, container.StartOptions{}); err != nil {
		return "", nil, fmt.Errorf("failed to start container: %w", err)
	}

	// Create a context with timeout
	execCtx, cancel := context.WithTimeout(ctx, time.Duration(timeoutMs)*time.Millisecond)
	defer cancel()

	// Wait for the container to exit
	statusCh, errCh := d.client.ContainerWait(execCtx, containerID, container.WaitConditionNotRunning)
	result := StatsResult{
		// Initialize with default values
		CPUPercent:    0.0,
		MemoryUsage:   0,
		MemoryPercent: 0.0,
	}

	// Start stats collection in background
	statsCh := make(chan *types.StatsJSON, 5) // Buffer it to avoid blocking
	doneCh := make(chan struct{})
	go func() {
		defer close(doneCh)
		collectStats(execCtx, d.client, containerID, statsCh)
	}()

	// Variables to keep track of max usage
	var maxMemoryUsage uint64
	var maxCPUPercent float64

	// Monitor stats while waiting for container to exit
	statsProcessor := func() {
		ticker := time.NewTicker(50 * time.Millisecond)
		defer ticker.Stop()

		for {
			select {
			case <-doneCh:
				return // Stats collection ended
			case stats, ok := <-statsCh:
				if !ok {
					return // Channel closed
				}
				if stats == nil {
					continue // Skip nil stats
				}

				// In some docker environments, usage stats might be unavailable
				if stats.CPUStats.CPUUsage.TotalUsage == 0 ||
					stats.PreCPUStats.CPUUsage.TotalUsage == 0 {
					// Skip invalid stats
					continue
				}

				cpuPercent := calculateCPUPercentUnix(stats)
				if cpuPercent > maxCPUPercent {
					maxCPUPercent = cpuPercent
				}

				// Check that we have non-zero memory stats
				if stats.MemoryStats.Usage > 0 && stats.MemoryStats.Usage > maxMemoryUsage {
					maxMemoryUsage = stats.MemoryStats.Usage
				}
			case <-ticker.C:
				// Just a tick to check if we should exit
			case <-execCtx.Done():
				return // Context done
			}
		}
	}

	// Start stats processing in background
	go statsProcessor()

	// Process container exit or timeout
	select {
	case err := <-errCh:
		// Container wait failed
		cancel() // Cancel stats collection
		return "", &result, fmt.Errorf("container wait failed: %w", err)

	case <-execCtx.Done():
		// Timeout occurred
		result.Duration = int64(timeoutMs)
		result.CPUPercent = maxCPUPercent
		result.MemoryUsage = maxMemoryUsage
		result.MemoryPercent = float64(maxMemoryUsage) / float64(memoryLimitMB*1024*1024) * 100.0
		return "", &result, fmt.Errorf("execution timed out after %d ms", timeoutMs)

	case status := <-statusCh:
		// Container exited
		duration := time.Since(startTime).Milliseconds()
		result.Duration = duration

		// Read container logs
		out, err := getContainerLogs(ctx, d.client, containerID)
		if err != nil {
			result.CPUPercent = maxCPUPercent
			result.MemoryUsage = maxMemoryUsage
			result.MemoryPercent = float64(maxMemoryUsage) / float64(memoryLimitMB*1024*1024) * 100.0
			return "", &result, fmt.Errorf("failed to get container logs: %w", err)
		}

		// Make sure we use the stats that were collected
		result.CPUPercent = maxCPUPercent
		result.MemoryUsage = maxMemoryUsage
		result.MemoryPercent = float64(maxMemoryUsage) / float64(memoryLimitMB*1024*1024) * 100.0

		// Check exit code
		if status.StatusCode != 0 {
			return out, &result, fmt.Errorf("container exited with non-zero status: %d", status.StatusCode)
		}

		return out, &result, nil
	}
}

// collectStats continuously collects stats from the container
func collectStats(ctx context.Context, cli *client.Client, containerID string, statsCh chan<- *types.StatsJSON) {
	// Use a separate context for stats to allow for cleanup
	statsCtx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Wait a short time for container to initialize
	time.Sleep(100 * time.Millisecond)

	// Try multiple times to get initial stats
	var statsJSON types.StatsJSON
	var err error
	for retries := 0; retries < 3; retries++ {
		// Check if parent context is done before each attempt
		select {
		case <-ctx.Done():
			return
		default:
			// Continue with retry
		}

		// Start stats stream with a short timeout
		statsOpts, err := cli.ContainerStats(statsCtx, containerID, false)
		if err != nil {
			log.Printf("Failed to get container stats (attempt %d): %v", retries+1, err)
			time.Sleep(200 * time.Millisecond)
			continue
		}

		err = json.NewDecoder(statsOpts.Body).Decode(&statsJSON)
		statsOpts.Body.Close()

		if err == nil {
			// Successfully decoded stats
			break
		}

		if err == io.EOF {
			log.Printf("Container not ready for stats yet (attempt %d), retrying...", retries+1)
			time.Sleep(200 * time.Millisecond)
			continue
		}

		log.Printf("Error decoding initial stats (attempt %d): %v", retries+1, err)
		time.Sleep(200 * time.Millisecond)
	}

	// If we got valid stats, send them
	if err == nil {
		select {
		case statsCh <- &statsJSON:
			// Stats sent successfully
		case <-ctx.Done():
			return
		default:
			// Don't block if channel is full
		}
	}

	// Now try to get a stream for continuous stats
	streamCtx, streamCancel := context.WithCancel(context.Background())
	defer streamCancel()

	// Setup a goroutine to cancel the stream when the parent context is done
	go func() {
		select {
		case <-ctx.Done():
			streamCancel()
		case <-streamCtx.Done():
			// Stream already done
		}
	}()

	streamOpts, err := cli.ContainerStats(streamCtx, containerID, true)
	if err != nil {
		log.Printf("Failed to get stats stream: %v", err)
		return
	}
	defer streamOpts.Body.Close()

	decoder := json.NewDecoder(streamOpts.Body)
	for {
		var stats types.StatsJSON
		if err := decoder.Decode(&stats); err != nil {
			// We don't want to log this error if the context was canceled
			if err != io.EOF && ctx.Err() == nil && streamCtx.Err() == nil {
				log.Printf("Error decoding stats: %v", err)
			}
			return
		}

		select {
		case statsCh <- &stats:
			// Successfully sent stats
		case <-ctx.Done():
			// Parent context canceled
			return
		case <-streamCtx.Done():
			// Stream context canceled
			return
		default:
			// Channel full, skip this update
		}

		// Avoid too frequent updates
		time.Sleep(50 * time.Millisecond)
	}
}

// calculateCPUPercentUnix calculates the CPU usage percentage
func calculateCPUPercentUnix(stats *types.StatsJSON) float64 {
	// Defend against division by zero or invalid stats
	if stats.CPUStats.CPUUsage.TotalUsage <= 0 ||
		stats.PreCPUStats.CPUUsage.TotalUsage <= 0 ||
		stats.CPUStats.SystemUsage <= 0 ||
		stats.PreCPUStats.SystemUsage <= 0 ||
		len(stats.CPUStats.CPUUsage.PercpuUsage) == 0 {
		return 0.0
	}

	// This calculation is based on Docker's own calculation for CPU percentage
	cpuDelta := float64(stats.CPUStats.CPUUsage.TotalUsage) - float64(stats.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(stats.CPUStats.SystemUsage) - float64(stats.PreCPUStats.SystemUsage)

	if systemDelta <= 0.0 || cpuDelta <= 0.0 {
		return 0.0
	}

	cpuCount := float64(len(stats.CPUStats.CPUUsage.PercpuUsage))
	if cpuCount == 0 {
		cpuCount = 1.0
	}

	cpuPercent := (cpuDelta / systemDelta) * cpuCount * 100.0

	// Cap at 100% per CPU
	maxPercent := cpuCount * 100.0
	if cpuPercent > maxPercent {
		cpuPercent = maxPercent
	}

	return cpuPercent
}

// getContainerLogs retrieves logs from the container
func getContainerLogs(ctx context.Context, cli *client.Client, containerID string) (string, error) {
	// Use a short timeout for log retrieval
	logCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	options := container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
	}

	logs, err := cli.ContainerLogs(logCtx, containerID, options)
	if err != nil {
		return "", err
	}
	defer logs.Close()

	// Docker multiplexes stdout and stderr in the same stream with headers
	// We need to demultiplex them
	var stdout, stderr bytes.Buffer
	_, err = stdcopy.StdCopy(&stdout, &stderr, logs)
	if err != nil {
		return "", err
	}

	// Combine stdout and stderr
	if stderr.Len() > 0 {
		return stderr.String(), nil
	}
	return stdout.String(), nil
}

// cleanupContainer removes a container
func cleanupContainer(cli *client.Client, containerID string) {
	// Remove the container with force
	removeOptions := container.RemoveOptions{
		RemoveVolumes: true,
		Force:         true,
	}

	// Create a new background context for cleanup
	cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := cli.ContainerRemove(cleanupCtx, containerID, removeOptions); err != nil {
		log.Printf("Failed to remove container %s: %v", containerID, err)
	}
}

// getContainerCommand returns the appropriate command for the given file extension
func getContainerCommand(extension, containerPath, inputString string) []string {
	switch extension {
	case ".py":
		return []string{"python3", containerPath, inputString}
	case ".js":
		// Properly escape the input string for JavaScript
		escapedInput := strings.ReplaceAll(inputString, "'", "\\'")
		escapedInput = strings.ReplaceAll(escapedInput, "\"", "\\\"")

		// Use a more reliable way to pass input to Node.js
		return []string{"/bin/sh", "-c", fmt.Sprintf("node %s '%s' 2>&1", containerPath, escapedInput)}
	case ".java":
		dir := filepath.Dir(containerPath)
		return []string{"/bin/sh", "-c", fmt.Sprintf("javac %s && cd %s && java Main %s", containerPath, dir, inputString)}
	case ".cpp":
		dir := filepath.Dir(containerPath)
		executable := filepath.Join(dir, "a.out")
		return []string{"/bin/sh", "-c", fmt.Sprintf("g++ %s -o %s && %s %s", containerPath, executable, executable, inputString)}
	case ".cs":
		dir := filepath.Dir(containerPath)
		return []string{"/bin/sh", "-c", fmt.Sprintf("cd %s && dotnet run --project . -- %s", dir, inputString)}
	default:
		return []string{"/bin/sh", "-c", fmt.Sprintf("cat %s", containerPath)}
	}
}
