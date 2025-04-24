package operations

import (
	"backend/models"
	"backend/util"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
)

var (
	// dockerClient is a singleton instance of the Docker client
	dockerClient *util.DockerClient
	clientOnce   sync.Once
	clientErr    error
)

// getDockerClient returns a singleton Docker client instance
func getDockerClient() (*util.DockerClient, error) {
	clientOnce.Do(func() {
		// Initialize with max 5 concurrent containers
		var client *util.DockerClient
		for attempts := 0; attempts < 3; attempts++ {
			var err error
			client, err = util.NewDockerClient(5)
			if err == nil {
				dockerClient = client
				clientErr = nil
				return
			}

			clientErr = err
			log.Printf("Failed to initialize Docker client (attempt %d): %v", attempts+1, err)
			time.Sleep(500 * time.Millisecond)
		}

		if clientErr != nil {
			log.Printf("All Docker client initialization attempts failed: %v", clientErr)
		}
	})

	if clientErr != nil {
		log.Printf("Using Docker client failed: %v", clientErr)
	}

	return dockerClient, clientErr
}

// ExecuteCode runs the code in a Docker container and returns the results
func ExecuteCode(ctx context.Context, solution models.Solution, inputString string, codeFile string, timeLimit int, memoryLimit int) (util.ExecutionResult, error) {
	// Get the Docker client
	dockerClient, err := getDockerClient()
	if err != nil {
		return util.ExecutionResult{
			TimedOut: false,
			Error:    err,
		}, fmt.Errorf("failed to get Docker client: %w", err)
	}

	// Get the Docker image for the language
	image, err := getDockerImageForLanguage(solution.Language)
	if err != nil {
		return util.ExecutionResult{
			TimedOut: false,
			Error:    err,
		}, fmt.Errorf("unsupported language: %w", err)
	}

	// Execute the container
	output, stats, err := dockerClient.ExecuteContainer(ctx, image, codeFile, inputString, timeLimit, memoryLimit)

	// Create execution result with default values
	result := util.ExecutionResult{
		Output:   output,
		Error:    err,
		Duration: 0,
		MemUsage: 0,
		CPUUsage: 0,
		TimedOut: false,
	}

	// If we got stats, populate them (even if there was an error)
	if stats != nil {
		result.Duration = stats.Duration
		result.MemUsage = int64(stats.MemoryUsage)
		result.CPUUsage = stats.CPUPercent
		result.TimedOut = stats.Duration >= int64(timeLimit)

		log.Printf("Container stats: CPU=%.2f%%, Memory=%d bytes (%.2f%%), Duration=%d ms",
			stats.CPUPercent, stats.MemoryUsage, stats.MemoryPercent, stats.Duration)
	}

	// Check for timeout error
	if err != nil && strings.Contains(err.Error(), "timed out") {
		result.TimedOut = true
		log.Printf("Container execution timed out after %d ms", timeLimit)
	}

	// Format the output based on the language
	if result.Error == nil {
		result.Output = formatOutputByLanguage(result.Output, solution.Language)
	}

	return result, nil
}

// getDockerImageForLanguage returns the appropriate Docker image for the language
func getDockerImageForLanguage(language string) (string, error) {
	switch language {
	case "JavaScript":
		return "node:14", nil
	case "Python":
		return "python:3.8", nil
	case "Java":
		return "openjdk:11", nil
	case "C++":
		return "gcc:latest", nil
	case "C#":
		return "mcr.microsoft.com/dotnet/sdk:6.0", nil
	default:
		return "", fmt.Errorf("unsupported language: %s", language)
	}
}

// Normalize output string for comparison to handle whitespace differences
func normalizeOutput(output string) string {
	// Trim leading/trailing whitespace
	output = strings.TrimSpace(output)

	// Replace all consecutive whitespace with a single space
	output = strings.Join(strings.Fields(output), " ")

	// Convert to lowercase if it's a short string (likely a simple value)
	if len(output) < 50 {
		output = strings.ToLower(output)
	}

	return output
}

// RunCodeTestCasesWithStats tests code against multiple test cases and returns results with resource stats
func RunCodeTestCasesWithStats(language string, code string, testCases []models.TestCase, isAIEnabled bool) (int, []byte, int, bool, int, int, []util.ExecutionResult, error) {
	// First, identify the entry point and create temp file (same as before)
	entryPoint := "main"
	if isAIEnabled {
		var err error
		entryPoint, err = util.IdentifyCodeEntryPoint(code)
		if err != nil || entryPoint == "" {
			log.Printf("Warning: Could not identify entry point, using 'main': %v", err)
			entryPoint = "main"
		}
	}

	extension, modifiedCode := GetFileExtensionAndModifiedCode(language, code, entryPoint)
	codeFile, err := util.CreateTempFile(modifiedCode, extension)
	if err != nil {
		return fiber.StatusInternalServerError, nil, 0, false, 0, 0, nil, fmt.Errorf("failed to create temp file: %w", err)
	}
	defer cleanupTempFile(codeFile)

	// Handle case with no test cases
	if len(testCases) == 0 {
		return fiber.StatusOK, []byte("[]"), 100, true, 0, 0, nil, nil
	}

	solution := models.Solution{
		Language: language,
		Code:     code,
	}

	var allResults []models.TestCaseResult
	var executionResults []util.ExecutionResult
	totalTestCases := len(testCases)
	passedTestCases := 0

	for idx, testCase := range testCases {
		// Apply default limits if invalid values provided
		timeLimit := applyDefaultIfInvalid(testCase.TimeLimit, util.DEFAULT_TIME_LIMIT, util.MAX_TIME_LIMIT)
		memoryLimit := applyDefaultIfInvalid(testCase.MemoryLimit, util.DEFAULT_MEMORY_LIMIT, util.MAX_MEMORY_LIMIT)

		input := strings.TrimSpace(testCase.Input)
		expectedOutput := strings.TrimSpace(testCase.Output)

		// Create a dedicated context for each test case
		testCtx, cancelTest := context.WithTimeout(context.Background(), 2*time.Duration(timeLimit)*time.Millisecond)

		// Execute code with the new Docker client
		execResult, err := ExecuteCode(testCtx, solution, input, codeFile, timeLimit, memoryLimit)
		cancelTest() // Cancel the context after execution

		if err != nil {
			log.Printf("Error executing code for test case #%d: %v", idx+1, err)
		}

		executionResults = append(executionResults, execResult)

		// Determine if the test passed based on expected output and time requirements
		var passed bool
		if execResult.Error == nil {
			// Normalize both outputs for comparison
			normalizedActual := normalizeOutput(execResult.Output)
			normalizedExpected := normalizeOutput(expectedOutput)

			// Debug the comparison
			log.Printf("Test Case #%d Comparison: \nExpected: '%s'\nActual:   '%s'\nNormalized Expected: '%s'\nNormalized Actual:   '%s'",
				idx+1, expectedOutput, execResult.Output, normalizedExpected, normalizedActual)

			passed = normalizedActual == normalizedExpected &&
				!execResult.TimedOut &&
				int(execResult.Duration) <= timeLimit

			if passed {
				passedTestCases++
			}
		}

		// Create test case result
		testCaseResult := models.TestCaseResult{
			TestCaseID:       testCase.ID,
			Passed:           passed,
			SolutionOutput:   &execResult.Output,
			Input:            &input,
			ExpectedOutput:   &expectedOutput,
			MemoryUsage:      int(execResult.MemUsage),
			Time:             int(execResult.Duration),
			CPUUsage:         execResult.CPUUsage,
			MemoryUsageLimit: memoryLimit,
			TimeLimit:        timeLimit,
		}

		log.Printf("Test Case #%d Result: passed=%v, time=%dms, memUsage=%d bytes, CPU=%.2f%%, error=%v",
			idx+1, testCaseResult.Passed, testCaseResult.Time, execResult.MemUsage, execResult.CPUUsage, execResult.Error)

		// Only include the test case in results if it's public
		if testCase.Public {
			allResults = append(allResults, testCaseResult)
		}
	}

	// Calculate score percentage and whether all tests passed
	scorePercentage := calculateScore(totalTestCases, passedTestCases)
	passedAll := passedTestCases == totalTestCases

	jsonResult, err := json.Marshal(allResults)
	if err != nil {
		log.Printf("Error marshaling results to JSON: %v", err)
		return fiber.StatusInternalServerError, nil, 0, false, 0, 0, nil, err
	}

	return fiber.StatusOK, jsonResult, scorePercentage, passedAll, passedTestCases, totalTestCases, executionResults, nil
}

// formatOutputByLanguage has been moved to codeSubmition.plain.go
// to avoid duplication
