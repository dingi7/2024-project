package operations

import (
	"backend/util"
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)


func RunRepoTestCases(repository string, testFile string, githubToken string) (int, []byte, int, bool, error) {
	var tempDir string
	tempDir, err := util.CloneRepository(repository, githubToken)
	if err != nil {
		return 0, nil, 0, false, err
	}
	defer util.CleanupTempDir(tempDir)

	testScript, err := util.ReadConfigFileFromRepo(tempDir)
	if err != nil {
		return 0, nil, 0, false, err
	}

	output, err := runTestScript(testScript, testFile, tempDir)
	if err != nil {
		return 0, nil, 0, false, err
	}

	fmt.Println("Output: ", output)

	return 0, nil, 0, false, nil
}


func runTestScript(testScript string, testFile string, tempDir string) (string, error) {
	// add the test file to the temp dir
	err := os.WriteFile(filepath.Join(tempDir, testFile), []byte(testScript), 0644)
	if err != nil {
		return "Error", err
	}

	// execute the test script with the new test file and evaluate the output 

	// jest

	cmdArgs := util.GetDockerRepoCommand("JavaScript", testFile)

	cmd := exec.Command("docker", cmdArgs...)
	fmt.Println("Running command: ", cmd.Args)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	err = cmd.Run()
	if err != nil {
		return "Error", err
	}

	return out.String(), nil

}
