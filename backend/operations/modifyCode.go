package operations

import (
	"fmt"
	"os"
	"path/filepath"
)

func modifyJSCode(code string, entryPoint string) string {
	// The JavaScript code to inject
	template := `
	%s
	if (typeof %s === "function") {
    const args = process.argv.slice(2); // Get command-line arguments
    %s(...args);
	}else{
		console.log("Function '%s' not found");
	}
`
	// Replace the placeholder with the original code
	modifiedCode := fmt.Sprintf(template, code, entryPoint, entryPoint, entryPoint)

	return modifiedCode
}

func modifyPythonCode(code string, entryPoint string) string {
	// The Python code to inject
	template := `
%s
if __name__ == "__main__":
    import sys
    if '%s' in globals() and callable(globals()['%s']):
        args = sys.argv[1:]  # Get command-line arguments
        %s(*args)
    else:
        print("Function '%s' not found or is not callable")
`
	// Replace the placeholder with the original code and entry point
	modifiedCode := fmt.Sprintf(template, code, entryPoint, entryPoint, entryPoint, entryPoint)

	return modifiedCode
}

func GetFileExtension(language string, code string, entryPoint string) (string, string) {
	extension := ""
	modifiedCode := code
	switch language {
	case "Python":
		extension = "py"
		modifiedCode = modifyPythonCode(code, entryPoint)
	case "JavaScript":
		extension = "js"
		modifiedCode = modifyJSCode(code, entryPoint)
	case "Java":
		extension = "java"
	case "C++":
		extension = "cpp"
	case "C#":
		extension = "cs"
	}
	return extension, modifiedCode
}

func GetDockerCommand(language, codeFile, inputString string, memoryLimit int) []string {
	cmdArgs := []string{}
	switch language {
	case "JavaScript":
		cmdArgs = []string{
			"run", "--rm", fmt.Sprintf("--memory=%dm", memoryLimit),
			// "--memory-swap=-1",
			// "--cpus=1",
			"--network", "none", "-v", codeFile + ":/app/code.js", "node:14", "bash", "-c", fmt.Sprintf("node /app/code.js '%s'", inputString),
		}
	case "Java":
		cmdArgs = []string{"run", "--rm", "--network", "none", "-v", codeFile + ":/app/code.java", "openjdk:11", "bash", "-c", fmt.Sprintf("javac /app/code.java && java -cp /app/ code %s", inputString)}
	case "C++":
		cmdArgs = []string{"run", "--rm", "--network", "none", "-v", codeFile + ":/app/code.cpp", "gcc:latest", "bash", "-c", fmt.Sprintf("g++ /app/code.cpp -o /app/a.out && ./app/a.out %s", inputString)}
	case "C#":
		cmdArgs = []string{
			"run", "--rm", "--network", "none",
			"-v", codeFile + ":/code/Program.cs",
			"mcr.microsoft.com/dotnet/sdk:6.0",
			"bash", "-c",
			fmt.Sprintf(
				"mkdir /app && cd /app && dotnet new console -n MyProject && mv /code/Program.cs /app/MyProject/Program.cs && dotnet run --project /app/MyProject %s",
				inputString,
			),
		}
	case "Python":
		cmdArgs = []string{
			"run",
			"--rm",
			"--network",
			"none",
			"-v",
			codeFile + ":/app/code.py",
			"python:3.8",
			"bash",
			"-c",
			fmt.Sprintf("python3 /app/code.py %s", inputString),
		}
	}
	return cmdArgs
}

func AddTestFileToDir(dir string, testFileName string, testFile []byte) error {
	// Write the test file to the specified directory
	testFilePath := filepath.Join(dir, testFileName)
	return os.WriteFile(testFilePath, testFile, 0644)
}

func GetDockerRepoCommand(language, dir, testFileName string) [][]string {
	cmdArgs := [][]string{}

	switch language {
	case "JavaScript":
		// First command: Run npm install with network access
		cmdArgs = append(cmdArgs, []string{
			"run", "--rm",
			"-v", dir + ":/app", "-w", "/app",
			"node:14",
			"bash", "-c",
			"npm install",
		})

		// Second command: Run npm test with network disabled
		cmdArgs = append(cmdArgs, []string{
			"run", "--rm", "--network", "none",
			"-v", dir + ":/app", "-w", "/app",
			"node:14",
			"bash", "-c",
			"npx jest " + testFileName, // Directly run Jest on the specific test file
		})
	}

	return cmdArgs
}
