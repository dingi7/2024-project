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

	for _, testCase := range testCases {
		output, err := executeCode(solution, strings.TrimSpace(testCase.Input))
		if err != nil {
			log.Printf("Error executing code for test case: %v", err)
			return fiber.StatusInternalServerError, nil, 0, false, err
		}

		fmt.Printf("Output for test case: %s\n", output)

		trimmedExpected := strings.TrimSpace(testCase.Output)
		trimmedOutput := strings.TrimSpace(output)
		fmt.Println("trimmedOutput: ", trimmedOutput)
		fmt.Println("trimmedExpected: ", trimmedExpected)

		passed := trimmedOutput == trimmedExpected
		fmt.Println("passed: ", passed)

		result := map[string]interface{}{
			"passed":   passed,
			"expected": trimmedExpected,
			"got":      trimmedOutput,
		}

		allResults = append(allResults, result)
	}

	score := 0

	for _, result := range allResults {
		if result["passed"].(bool) {
			score++
		}
	}
	scorePercentage := float64(score) / float64(len(allResults)) * 100
	passed := score == len(allResults)

	jsonResult, err := json.Marshal(allResults)
	if err != nil {
		log.Printf("Error marshaling results to JSON: %v", err)
		return fiber.StatusInternalServerError, nil, 0, false, err
	}
	fmt.Println(jsonResult)
	return fiber.StatusOK, jsonResult, int(scorePercentage), passed, nil
}
