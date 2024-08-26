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

func executeCode(solution Solution, inputs []string) (string, error) {
	extension := ""
	modifiedCode := solution.Code
	switch solution.Language {
	case "Python":
		extension = "py"
		modifiedCode = util.ModifyPythonCode(solution.Code)
	case "JavaScript":
		extension = "js"
		modifiedCode = util.ModifyJSCode(solution.Code)
	case "Java":
		extension = "java"
	case "C++":
		extension = "cpp"
	case "C#":
		extension = "cs"
	}

	codeFile, err := createTempFile(modifiedCode, extension)
	if err != nil {
		return "", err
	}
	defer exec.Command("rm", codeFile).Run() // Cleanup temp file

	// Docker command to run the code inside a container
	var inputArgs []string
	for _, input := range inputs {
		inputArgs = append(inputArgs, fmt.Sprintf("'%s'", input))
	}
	inputString := strings.Join(inputArgs, " ")

	cmdArgs := []string{"run", "--rm", "-v", codeFile + ":/app/code." + extension, "python:3.8", "bash", "-c", fmt.Sprintf("python /app/code.py %s", inputString)}
	switch solution.Language {
	case "JavaScript":
		cmdArgs = []string{"run", "--rm", "-v", codeFile + ":/app/code.js", "node:14", "bash", "-c", fmt.Sprintf("node /app/code.js %s", inputString)}
	case "Java":
		cmdArgs = []string{"run", "--rm", "-v", codeFile + ":/app/code.java", "openjdk:11", "bash", "-c", fmt.Sprintf("javac /app/code.java && java -cp /app/ code %s", inputString)}
	case "C++":
		cmdArgs = []string{"run", "--rm", "-v", codeFile + ":/app/code.cpp", "gcc:latest", "bash", "-c", fmt.Sprintf("g++ /app/code.cpp -o /app/a.out && ./app/a.out %s", inputString)}
	case "C#":
		cmdArgs = []string{
			"run", "--rm",
			"-v", codeFile + ":/code/Program.cs",
			"mcr.microsoft.com/dotnet/sdk:6.0",
			"bash", "-c",
			fmt.Sprintf(
				"mkdir /app && cd /app && dotnet new console -n MyProject && mv /code/Program.cs /app/MyProject/Program.cs && dotnet run --project /app/MyProject %s",
				inputString,
			),
		}
	case "Python":
		cmdArgs = []string{"run", "--rm", "-v", codeFile + ":/app/code.py", "python:3.8", "bash", "-c", fmt.Sprintf("python /app/code.py %s", inputString)}
	}

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
	solution := Solution{
		Language: language,
		Code:     code,
	}

	var allResults []map[string]interface{}

	for _, testCase := range testCases {
		inputs := strings.Split(testCase.Input, ",")
		for i, input := range inputs {
			inputs[i] = strings.TrimSpace(input)
		}
		output, err := executeCode(solution, inputs)
		if err != nil {
			log.Printf("Error executing code for test case: %v", err)
			return fiber.StatusInternalServerError, nil, 0, false, err
		}

		fmt.Printf("Output for test case: %s\n", output)

		trimmedExpected := strings.TrimSpace(testCase.Output)
		trimmedOutput := strings.TrimSpace(output)

		passed := trimmedOutput == trimmedExpected

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

	return fiber.StatusOK, jsonResult, int(scorePercentage), passed, nil
}