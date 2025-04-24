package operations

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func modifyJSCode(code string, entryPoint string) string {
	// The JavaScript code to inject
	template := `
%s

// Function to handle input properly
function parseInput(input) {
    try {
        // Try to parse as JSON if it looks like JSON
        if ((input.startsWith('{') && input.endsWith('}')) || 
            (input.startsWith('[') && input.endsWith(']'))) {
            return JSON.parse(input);
        }
        
        // Try to parse as number
        const num = Number(input);
        if (!isNaN(num)) {
            return num;
        }
        
        // Return as string if all else fails
        return input;
    } catch (e) {
        // Return original input if parsing fails
        return input;
    }
}

// Main execution
if (typeof %s === "function") {
    const args = process.argv.slice(2).map(parseInput); // Get and parse command-line arguments
    const result = %s(...args);
    
    // Handle the result properly
    if (result !== undefined) {
        // For objects, stringify with pretty printing
        if (typeof result === 'object' && result !== null) {
            console.log(JSON.stringify(result));
        } else {
            console.log(result);
        }
    }
} else {
    console.error("Function '%s' not found");
    process.exit(1);
}
`
	// Replace the placeholder with the original code
	modifiedCode := fmt.Sprintf(template, code, entryPoint, entryPoint, entryPoint)
	return modifiedCode
}

func modifyPythonCode(code string, entryPoint string) string {
	// The Python code to inject
	template := `
import sys

# Simple approach: if there are command line arguments, use them as input
# Otherwise, keep the standard input behavior
if len(sys.argv) > 1:
    # Save the original input function
    original_input = input
    
    # Create a list of inputs from command line arguments
    cli_inputs = sys.argv[1:]
    cli_input_index = 0
    
    # Define our custom input function
    def custom_input(prompt=''):
        global cli_input_index
        global cli_inputs
        
        # Print the prompt to simulate the normal input behavior
        if prompt:
            print(prompt, end='')
            
        # If we have inputs from command line, use them
        if cli_input_index < len(cli_inputs):
            result = cli_inputs[cli_input_index]
            cli_input_index += 1
            print(result)  # Echo the "typed" input
            return result
        
        # Fall back to standard input if we run out of args
        return original_input(prompt)
    
    # Replace the built-in input function
    input = custom_input

%s

if __name__ == "__main__":
    try:
        # If we have a callable entry point function, call it
        if '%s' in globals() and callable(globals()['%s']):
            result = %s()
            if result is not None:
                print(result)
    except Exception as e:
        print(f"Error: {e}")
`
	// Replace the placeholder with the original code and entry point
	modifiedCode := fmt.Sprintf(template, code, entryPoint, entryPoint, entryPoint)

	return modifiedCode
}

func GetFileExtensionAndModifiedCode(language string, code string, entryPoint string) (string, string) {
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
		// Escape single quotes in the input string
		escapedInput := strings.ReplaceAll(inputString, "'", "'\\''")
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
			fmt.Sprintf("python3 /app/code.py '%s'", escapedInput),
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
