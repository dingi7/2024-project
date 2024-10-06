package util

import "fmt"

func ModifyJSCode(code string) string {
	// The JavaScript code to inject
	template := `
	%s
	if (typeof main === "function") {
    const args = process.argv.slice(2); // Get command-line arguments
    main(...args);
	}else{
		console.log("Function 'main' not found");
	}
`

	// Replace the placeholder with the original code
	modifiedCode := fmt.Sprintf(template, code)

	return modifiedCode
}

func ModifyPythonCode(code string) string {
	// The Python code to inject
	template := `
%s
if __name__ == "__main__":
    import sys
    if 'main' in globals():
        main(''.join(sys.argv[1:]))
    else:
        print("Function 'main' not found")
`

	// Replace the placeholder with the original code
	modifiedCode := fmt.Sprintf(template, code)

	return modifiedCode
}

func GetFileExtension(language string, code string) (string, string) {
	extension := ""
	modifiedCode := code
	switch language {
	case "Python":
		extension = "py"
		modifiedCode = ModifyPythonCode(code)
	case "JavaScript":
		extension = "js"
		modifiedCode = ModifyJSCode(code)
	case "Java":
		extension = "java"
	case "C++":
		extension = "cpp"
	case "C#":
		extension = "cs"
	}
	return extension, modifiedCode
}

func GetDockerImage(language string) string {
	switch language {
	case "Python":
		return "python:3.8"
	case "JavaScript":
		return "node:14"
	case "Java":
		return "openjdk:11"
	case "C++":
		return "gcc:latest"
	case "C#":
		return "mcr.microsoft.com/dotnet/sdk:6.0"
	default:
		return ""
	}
}

func GetDockerCommand(language, codeFile, inputString string) []string {
	cmdArgs := []string{}
	switch language {
	case "JavaScript":
		cmdArgs = []string{"run", "--rm", "--network", "none", "-v", codeFile + ":/app/code.js", "node:14", "bash", "-c", fmt.Sprintf("node /app/code.js '%s'", inputString)}
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
