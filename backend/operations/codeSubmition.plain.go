package operations

import (
	"backend/models"
	"backend/util"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os/exec"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
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
	switch language {
	case "Python":
		// Only trim if the output appears to be a Python string representation
		if (strings.HasPrefix(output, "[") && strings.HasSuffix(output, "]")) ||
			(strings.HasPrefix(output, "'") && strings.HasSuffix(output, "'")) ||
			(strings.HasPrefix(output, "\"") && strings.HasSuffix(output, "\"")) {
			return strings.Trim(output, "[]'\"")
		}
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
	entryPoint := "main"
	if isAIEnabled {
		entryPoint, err := util.IdentifyCodeEntryPoint(code)
		if err != nil || entryPoint == "" {
			log.Printf("Warning: Could not identify entry point, using 'main': %v", err)
			entryPoint = "main"
		}
	}
	extension, modifiedCode := GetFileExtensionAndModifiedCode(language, code, entryPoint)
	codeFile, err := util.CreateTempFile(modifiedCode, extension)
	if err != nil {
		return fiber.StatusInternalServerError, nil, 0, false, 0, 0, fmt.Errorf("failed to create temp file: %w", err)
	}
	defer cleanupTempFile(codeFile)

	// Handle case with no test cases
	if len(testCases) == 0 {
		return fiber.StatusOK, []byte("[]"), 100, true, 0, 0, nil
	}

	solution := models.Solution{
		Language: language,
		Code:     code,
	}

	var allResults []models.TestCaseResult
	totalTestCases := len(testCases)
	passedTestCases := 0

	for idx, testCase := range testCases {
		// Apply default limits if invalid values provided
		timeLimit := applyDefaultIfInvalid(testCase.TimeLimit, util.DEFAULT_TIME_LIMIT, util.MAX_TIME_LIMIT)
		memoryLimit := applyDefaultIfInvalid(testCase.MemoryLimit, util.DEFAULT_MEMORY_LIMIT, util.MAX_MEMORY_LIMIT)

		input := strings.TrimSpace(testCase.Input)
		expectedOutput := strings.TrimSpace(testCase.Output)

		execResult := executeCode(solution, input, codeFile, timeLimit, memoryLimit)

		// Determine if the test passed based on expected output and time requirements
		var passed bool
		if execResult.Error == nil {
			passed = execResult.Output == expectedOutput &&
				!execResult.TimedOut &&
				int(execResult.Duration.Milliseconds()) <= timeLimit

			if passed {
				passedTestCases++
			}
		}

		// Create test case result
		testCaseResult := models.TestCaseResult{
			TestCaseID:     testCase.ID,
			Passed:         passed,
			SolutionOutput: &execResult.Output,
			MemoryUsage:    int(execResult.MemUsage),
			Time:           int(execResult.Duration.Milliseconds()),
		}

		log.Printf("Test Case #%d Result: passed=%v, time=%dms, error=%v",
			idx+1, testCaseResult.Passed, testCaseResult.Time, execResult.Error)

		// Only include the test case in results if it's public or if we want to show all results
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
		return fiber.StatusInternalServerError, nil, 0, false, 0, 0, err
	}

	return fiber.StatusOK, jsonResult, scorePercentage, passedAll, passedTestCases, totalTestCases, nil
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
