package operations

import (
	"backend/models"
	"bytes"
	"context"
	"errors"
	"fmt"
	"log"
	"os/exec"
	"strings"
	"time"
)

// ExecutionResult contains the result of code execution
type ExecutionResult struct {
	Output   string
	Duration time.Duration
	MemUsage int64
	Error    error
	TimedOut bool
}

// executeCode runs a solution's code with the given input and resource constraints
func executeCode(solution models.Solution, inputString string, codeFile string, timeLimit int, memoryLimit int) ExecutionResult {
	cmdArgs := GetDockerCommand(solution.Language, codeFile, inputString, memoryLimit)
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeLimit)*time.Millisecond)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", cmdArgs...)
	log.Printf("Running command: %v\n", cmd.Args)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	startTime := time.Now()
	err := cmd.Run()
	duration := time.Since(startTime)

	result := ExecutionResult{
		Duration: duration,
		MemUsage: int64(memoryLimit), // Placeholder - would be better to get actual memory usage
		TimedOut: false,
	}

	// Check for timeout error
	if ctx.Err() == context.DeadlineExceeded {
		result.Error = errors.New("execution timed out")
		result.TimedOut = true
		// Clean up container if needed
		containerID := extractContainerID(cmd.Args)
		if containerID != "" {
			killContainer(containerID)
		}
		return result
	}

	if err != nil {
		errorOutput := stderr.String()
		if errorOutput == "" {
			errorOutput = stdout.String()
		}
		result.Error = fmt.Errorf("execution error: %v\nOutput: %s", err, errorOutput)
		return result
	}

	output := strings.TrimSpace(stdout.String())
	// Handle language-specific output formatting
	result.Output = formatOutputByLanguage(output, solution.Language)
	return result
}

// formatOutputByLanguage handles language-specific output formatting
func formatOutputByLanguage(output string, language string) string {
	output = strings.TrimSpace(output)

	switch language {
	case "Python":
		// Only trim if the output appears to be a Python string representation
		if (strings.HasPrefix(output, "[") && strings.HasSuffix(output, "]")) ||
			(strings.HasPrefix(output, "'") && strings.HasSuffix(output, "'")) ||
			(strings.HasPrefix(output, "\"") && strings.HasSuffix(output, "\"")) {
			return strings.Trim(output, "[]'\"")
		}
	case "JavaScript":
		// Clean up any potential undefined/null outputs that Node might add
		if output == "undefined" || output == "null" {
			return ""
		}

		// If it looks like a JavaScript object/array literal
		if (strings.HasPrefix(output, "{") && strings.HasSuffix(output, "}")) ||
			(strings.HasPrefix(output, "[") && strings.HasSuffix(output, "]")) {
			// Keep as is, it's a valid JSON-like output
			return output
		}

		// Remove any trailing "undefined" that Node.js might append
		output = strings.TrimSuffix(output, "undefined")
		return strings.TrimSpace(output)
	}

	return output
}

// extractContainerID extracts the container ID from Docker command arguments
func extractContainerID(args []string) string {
	for i, arg := range args {
		if arg == "run" && i+1 < len(args) {
			return args[i+1]
		}
	}
	return ""
}

// killContainer forcefully stops a Docker container
func killContainer(containerID string) {
	killCmd := exec.Command("docker", "kill", containerID)
	killCmd.Run() // Ignore errors, just try to clean up
}

// RunCodeTestCases tests code against multiple test cases and returns results
func RunCodeTestCases(language string, code string, testCases []models.TestCase, isAIEnabled bool) (int, []byte, int, bool, int, int, error) {
	// Use the new implementation with Docker client
	statusCode, jsonResult, scorePercentage, passedAll, passedTestCases, totalTestCases, _, err :=
		RunCodeTestCasesWithStats(language, code, testCases, isAIEnabled)

	return statusCode, jsonResult, scorePercentage, passedAll, passedTestCases, totalTestCases, err
}

// applyDefaultIfInvalid returns a default value if the given value is invalid
func applyDefaultIfInvalid(value, defaultValue, maxValue int) int {
	if value <= 0 || value > maxValue {
		return defaultValue
	}
	return value
}

// calculateScore calculates the percentage score based on passed tests
func calculateScore(totalTestCases, passedTestCases int) int {
	if totalTestCases == 0 {
		return 100 // Perfect score if no tests
	}
	return int((float64(passedTestCases) / float64(totalTestCases)) * 100)
}

// cleanupTempFile safely removes a temporary file
func cleanupTempFile(filePath string) {
	if err := exec.Command("rm", filePath).Run(); err != nil {
		log.Printf("Warning: Failed to clean up temp file %s: %v", filePath, err)
	}
}
