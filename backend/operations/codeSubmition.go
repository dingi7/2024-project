package operations

import (
	"backend/util"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"

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

func executeCode(solution Solution) (string, error) {
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
	input := "Hello, World!" // Example inputs, adjust as necessary

	cmdArgs := []string{"run", "--rm", "-v", codeFile + ":/app/code." + extension, "python:3.8", "bash", "-c", "echo '" + input + "' | python /app/code.py"}
	switch solution.Language {
	case "JavaScript":
		// cmdArgs = []string{"run", "--rm", "-v", codeFile + ":/app/code.js", "node:14", "bash", "-c", "echo '" + input + "' | node /app/code.js"}
		cmdArgs = []string{"run", "--rm", "-v", codeFile + ":/app/code.js", "node:14", "node", "/app/code.js", input}
	case "Java":
		cmdArgs = []string{"run", "--rm", "-v", codeFile + ":/app/code.java", "openjdk:11", "bash", "-c", "javac /app/code.java && echo '" + input + "' | java -cp /app/ code"}
	case "C++":
		cmdArgs = []string{"run", "--rm", "-v", codeFile + ":/app/code.cpp", "gcc:latest", "bash", "-c", "g++ /app/code.cpp -o /app/a.out && echo '" + input + "' | /app/a.out"}
	case "C#":
		cmdArgs = []string{"run", "--rm", "-v", codeFile + ":/app/code.cs", "mcr.microsoft.com/dotnet/sdk:latest", "bash", "-c", "echo '" + input + "' | dotnet run /app/code.cs"}
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

func RunTestCases(language string, code string) (int, string, error) {
	solution := Solution{
		Language: language,
		Code:     code,
	}

	output, err := executeCode(solution)
	if err != nil {
		log.Printf("Error executing code: %v", err)
		return fiber.StatusInternalServerError, "", err
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
		return fiber.StatusInternalServerError, "", err
	}

	if passed {
		return fiber.StatusOK, string(jsonResult), nil
	} else {
		return fiber.StatusBadRequest, string(jsonResult), nil
	}
}
