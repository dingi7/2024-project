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
        main(sys.argv[1:])
    else:
        print("Function 'main' not found")
`

	// Replace the placeholder with the original code
	modifiedCode := fmt.Sprintf(template, code)

	return modifiedCode
}
