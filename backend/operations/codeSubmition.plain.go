package operations

import (
	"backend/models"
	"backend/util"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func executeCode(solution models.Solution, inputString string, codeFile string) (string, error) {
	cmdArgs := util.GetDockerCommand(solution.Language, codeFile, inputString)

	cmd := exec.Command("docker", cmdArgs...)
	fmt.Printf("Running command: %v\n", cmd.Args)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("failed to execute code: %v\nOutput: %s", err, out.String())
	}

	output := strings.TrimSpace(out.String())
	if solution.Language == "Python" {
		output = strings.Trim(output, "[]'\"")
	}
	return output, nil
}

func RunCodeTestCases(language string, code string, testCases []models.TestCase) (int, []byte, int, bool, error) {
	// entryPoint, err := util.IdentifyCodeEntryPoint(code)
	entryPoint := "main"
	// if err != nil {
	// 	fmt.Println("Error identifying code entry point:", err)
	// } else {
	// 	fmt.Println("Identified code entry point:", entryPoint)
	// }
	extension, modifiedCode := util.GetFileExtension(language, code, entryPoint)
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

	var allResults []map[string]interface{}
	totalTestCases := len(testCases)
	passedTestCases := 0

	for idx, testCase := range testCases {
		input := strings.TrimSpace(testCase.Input)
		expectedOutput := strings.TrimSpace(testCase.Output)

		output, err := executeCode(solution, input, codeFile)
		if err != nil {
			log.Printf("Error executing code for test case #%d: %v", idx+1, err)

			allResults = append(allResults, map[string]interface{}{
				"test_case": idx + 1,
				"passed":    false,
				"expected":  expectedOutput,
				"got":       "Error: " + err.Error(),
				"error":     err.Error(),
			})
			continue
		}

		passed := output == expectedOutput
		if passed {
			passedTestCases++
		}

		allResults = append(allResults, map[string]interface{}{
			"test_case": idx + 1,
			"passed":    passed,
			"expected":  expectedOutput,
			"got":       output,
		})
	}

	// Calculate the score as a percentage of passed test cases out of total test cases
	var scorePercentage float64
	if totalTestCases == 0 {
		scorePercentage = 0
	} else {
		scorePercentage = float64(passedTestCases) / float64(totalTestCases) * 100
		if scorePercentage < 0 {
			scorePercentage = 0
		}
	}
	passedAll := passedTestCases == totalTestCases

	jsonResult, err := json.Marshal(allResults)
	if err != nil {
		log.Printf("Error marshaling results to JSON: %v", err)
		return fiber.StatusInternalServerError, nil, 0, false, err
	}

	fmt.Println(string(jsonResult)) // Print the JSON result as a string for readability

	return fiber.StatusOK, jsonResult, int(scorePercentage), passedAll, nil
}
