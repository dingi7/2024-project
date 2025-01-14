package operations

import (
	"backend/models"
	"backend/util"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

func executeCode(solution models.Solution, inputString string, codeFile string, timeLimit int, memoryLimit int) (string, time.Duration, error) {
	cmdArgs := GetDockerCommand(solution.Language, codeFile, inputString, memoryLimit)
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeLimit)*time.Millisecond)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", cmdArgs...)
	fmt.Printf("Running command: %v\n", cmd.Args)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	startTime := time.Now()
	err := cmd.Run()
	duration := time.Since(startTime)
	if err != nil {
		return "", duration, fmt.Errorf("failed to execute code: %v\nOutput: %s", err, out.String())
	}

	output := strings.TrimSpace(out.String())
	if solution.Language == "Python" {
		output = strings.Trim(output, "[]'\"")
	}
	return output, duration, nil
}

func RunCodeTestCases(language string, code string, testCases []models.TestCase) (int, []byte, int, bool, error) {
	// entryPoint, err := util.IdentifyCodeEntryPoint(code)
	entryPoint := "main"
	// if err != nil {
	// 	fmt.Println("Error identifying code entry point:", err)
	// } else {
	// 	fmt.Println("Identified code entry point:", entryPoint)
	// }
	extension, modifiedCode := GetFileExtension(language, code, entryPoint)
	codeFile, err := util.CreateTempFile(modifiedCode, extension)
	if err != nil {
		return 0, nil, 0, false, err
	}
	defer exec.Command("rm", codeFile).Run() // Cleanup temp file

	// Handle case with no test cases
	if len(testCases) == 0 {
		return fiber.StatusOK, []byte("[]"), 100, true, nil
	}

	solution := models.Solution{
		Language: language,
		Code:     code,
	}

	// var allResults []map[string]interface{}
	var allResults = []models.TestCaseResult{}
	totalTestCases := len(testCases)
	passedTestCases := 0

	for idx, testCase := range testCases {
		input := strings.TrimSpace(testCase.Input)
		expectedOutput := strings.TrimSpace(testCase.Output)
		timeLimit := testCase.TimeLimit
		memoryLimit := testCase.MemoryLimit
		if memoryLimit <= 0 || memoryLimit > util.MAX_MEMORY_LIMIT {
			memoryLimit = util.DEFAULT_MEMORY_LIMIT
		}
		if timeLimit <= 0 || timeLimit > util.MAX_TIME_LIMIT {
			timeLimit = util.DEFAULT_TIME_LIMIT
		}

		output, testDuration, err := executeCode(solution, input, codeFile, timeLimit, memoryLimit)
		if err != nil {
			log.Printf("Error executing code for test case #%d: %v", idx+1, err)
			if testCase.Public {
				allResults = append(allResults, models.TestCaseResult{
					TestCase:       testCase,
					Passed:         false,
					SolutionOutput: &output,
					MemoryUsage:    memoryLimit,
					Time:           int(testDuration.Milliseconds()),
				})
			}
			continue
		}

		passed := output == expectedOutput && testDuration.Milliseconds() <= int64(timeLimit)
		if passed {
			passedTestCases++
		}

		testCaseResult := models.TestCaseResult{ // fix this
			TestCase:       testCase,
			Passed:         passed,
			SolutionOutput: &output,
			MemoryUsage:    memoryLimit,
			Time:           int(testDuration.Milliseconds()),
		}
		log.Printf("Test Case #%d Result: %+v", idx+1, testCaseResult)
		allResults = append(allResults, testCaseResult)
	}

	// Calculate the score as a percentage of passed test cases out of total test cases
	scorePercentage, passedAll := parseResult(totalTestCases, passedTestCases)

	jsonResult, err := json.Marshal(allResults)
	if err != nil {
		log.Printf("Error marshaling results to JSON: %v", err)
		return fiber.StatusInternalServerError, nil, 0, false, err
	}

	fmt.Println(string(jsonResult)) // Print the JSON result as a string for readability

	return fiber.StatusOK, jsonResult, int(scorePercentage), passedAll, nil
}

func parseResult(totalTestCases int, passedTestCases int) (int, bool) {
	scorePercentage := float64(passedTestCases) / float64(totalTestCases) * 100
	if scorePercentage < 0 {
		scorePercentage = 0
	}
	return int(scorePercentage), passedTestCases == totalTestCases
}
