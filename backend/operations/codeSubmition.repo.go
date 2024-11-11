package operations

import (
	"backend/util"
	"bytes"
	"fmt"
	"math/rand"
	"os/exec"
	"regexp"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func RunRepoTestCases(repository string, testFile []byte, githubToken string) (int, []byte, int, bool, error) {
	var tempDir string
	tempDir, err := util.CloneRepository(repository, githubToken)
	if err != nil {
		return 0, nil, 0, false, err
	}
	defer util.CleanupTempDir(tempDir)


	output, successCount, failCount, err := runTestScript(testFile, tempDir)
	totalTestCases := successCount + failCount
	passedPercentage := float64(successCount) / float64(totalTestCases) * 100
	passedAll := successCount == totalTestCases && failCount == 0 && totalTestCases != 0
	fmt.Println("Success count: ", successCount)
	fmt.Println("Fail count: ", failCount)
	if err != nil {
		if !strings.Contains(err.Error(), "exit status 1") {
			return fiber.StatusInternalServerError, nil, 0, false, err
		}
	}

	return fiber.StatusOK, []byte(output), int(passedPercentage), passedAll, nil
}

func runTestScript(testFile []byte, tempDir string) (string, int, int, error) {
	// Get the Docker commands for setup and testing
	testFileName := "contestifyJestTest" + strconv.Itoa(rand.Intn(1000000)) + ".test.js"
	util.AddTestFileToDir(tempDir, testFileName, testFile)
	commands := util.GetDockerRepoCommand("JavaScript", tempDir, testFileName)
	var finalOutput bytes.Buffer
	var err error

	for _, cmdArgs := range commands {
		// Execute each Docker command in sequence
		cmd := exec.Command("docker", cmdArgs...)
		fmt.Println("Running command: ", cmd.Args)

		var out bytes.Buffer
		cmd.Stdout = &out
		cmd.Stderr = &out

		err = cmd.Run()
		output := out.String()
		fmt.Println("Output: ", output)
		finalOutput.WriteString(output) // Append each command's output to final output

		if err != nil {
			// Log the error but continue with the next command
			fmt.Println("Error running command:", err)
		}
	}

	// Parse the final output for test results
	output := finalOutput.String()
	successCount, failCount := parseTestResults(output)

	// Return results even if there was an error, to get success/fail counts
	return output, successCount, failCount, err
}

// Helper function to parse Jest output for test results
func parseTestResults(output string) (int, int) {
	var successCount, failCount int

	// Regular expression to match the line with the test results summary
	summaryRegex := regexp.MustCompile(`Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed`)

	// Find the match for passed and failed tests
	if matches := summaryRegex.FindStringSubmatch(output); matches != nil {
		failCount, _ = strconv.Atoi(matches[1])    // Number of failed tests
		successCount, _ = strconv.Atoi(matches[2]) // Number of passed tests
	}

	return successCount, failCount
}
