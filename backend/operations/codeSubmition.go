package operations

import (
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
        cmdArgs = []string{"run", "--rm", "-v", codeFile + ":/app/code.cs", "mcr.microsoft.com/dotnet/sdk:latest", "bash", "-c", fmt.Sprintf("dotnet run /app/code.cs %s", inputString)}
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

	return out.String(), nil
}

func RunTestCases(language string, code string) (int, []byte, error) {
	solution := Solution{
		Language: language,
		Code:     code,
	}

	// inputs := []string{"John", "12"}

	output, err := executeCode(solution, []string{"Alice", "25", "man"})
	if err != nil {
		log.Printf("Error executing code: %v", err)
		return fiber.StatusInternalServerError, nil, err
	}

	fmt.Printf("Output: %s\n", output)

	expectedOutput := "Hello, World!"
	trimmedExpected := bytes.TrimSpace([]byte(expectedOutput))
	trimmedOutput := bytes.TrimSpace([]byte(output))

	passed := bytes.Equal(trimmedOutput, trimmedExpected)

	result := map[string]interface{}{
		"passed":   passed,
		"expected": expectedOutput,
		"got":      output,
	}

	jsonResult, err := json.Marshal(result)
	if err != nil {
		log.Printf("Error marshaling result to JSON: %v", err)
		return fiber.StatusInternalServerError, nil, err
	}

	if passed {
		return fiber.StatusOK, jsonResult, nil
	} else {
		return fiber.StatusOK, jsonResult, nil
	}
}
