package operations

import (
	"backend/models"
	"backend/util"
	"bytes"

	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type Solution struct {
	Language string
	Code     string
	Input    string
}

func createTempFile(content string, extension string) (string, error) {
	tmpfile, err := os.CreateTemp("", "*."+extension)
	if err != nil {
		return "", err
	}
	if _, err := tmpfile.Write([]byte(content)); err != nil {
		return "", err
	}
	if err := tmpfile.Close(); err != nil {
		return "", err
	}
	return tmpfile.Name(), nil
}

func executeCode(solution Solution, inputString string) (string, error) {
	extension, modifiedCode := util.GetFileExtension(solution.Language, solution.Code)

	codeFile, err := createTempFile(modifiedCode, extension)
	if err != nil {
		return "", err
	}
	defer exec.Command("rm", codeFile).Run() // Cleanup temp file

	cmdArgs := util.GetDockerCommand(solution.Language, codeFile, inputString)

	cmd := exec.Command("docker", cmdArgs...)
	fmt.Printf("Running command: %v\n", cmd.Args)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	err = cmd.Run()
	if err != nil {
		fmt.Printf("Output: %s\n", out.String())
		return "", fmt.Errorf("failed to execute code: %v", err)
	}

	switch solution.Language {
	case "Python":
		output := out.String()
		output = strings.Trim(output, "[]'\"\n ")
		return output, nil
	default:
		return out.String(), nil
	}

}

func RunTestCases(language string, code string, testCases []models.TestCase) (int, []byte, int, bool, error) {
    
    // Handle case with no test cases
    if len(testCases) == 0 {
        return fiber.StatusOK, []byte("[]"), 100, true, nil
    }

    solution := Solution{
        Language: language,
        Code:     code,
    }

    var allResults []map[string]interface{}
    totalTestCases := len(testCases)
    passedTestCases := 0

    for idx, testCase := range testCases {
        input := strings.TrimSpace(testCase.Input)
        expectedOutput := strings.TrimSpace(testCase.Output)

        output, err := executeCode(solution, input)
        if err != nil {
            log.Printf("Error executing code for test case #%d: %v", idx+1, err)
            
            // Record the error in the test case result
            result := map[string]interface{}{
                "test_case": idx + 1,
                "passed":    false,
                "expected":  expectedOutput,
                "got":       "Error: " + err.Error(),
                "error":     err.Error(),
            }

            allResults = append(allResults, result)
            continue // Proceed to the next test case
        }

        trimmedOutput := strings.TrimSpace(output)
        passed := trimmedOutput == expectedOutput

        if passed {
            passedTestCases++
        }

        result := map[string]interface{}{
            "test_case": idx + 1,
            "passed":    passed,
            "expected":  expectedOutput,
            "got":       trimmedOutput,
        }

        allResults = append(allResults, result)
    }

    // Calculate the score as a percentage of passed test cases out of total test cases
    scorePercentage := float64(passedTestCases) / float64(totalTestCases) * 100
    passedAll := passedTestCases == totalTestCases

    jsonResult, err := json.Marshal(allResults)
    if err != nil {
        log.Printf("Error marshaling results to JSON: %v", err)
        return fiber.StatusInternalServerError, nil, 0, false, err
    }

    fmt.Println(string(jsonResult)) // Print the JSON result as a string for readability

    return fiber.StatusOK, jsonResult, int(scorePercentage), passedAll, nil
}

