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
	var passedPercentage float64
	if totalTestCases == 0 {
		passedPercentage = 0
	} else {
		passedPercentage = float64(successCount) / float64(totalTestCases) * 100
		if passedPercentage < 0 {
			passedPercentage = 0
		}
	}
	passedAll := successCount == totalTestCases && failCount == 0 && totalTestCases != 0
	fmt.Printf("Success count: %d\n", successCount)
	fmt.Printf("Fail count: %d\n", failCount)
	fmt.Printf("Total test cases: %d\n", totalTestCases)
	fmt.Printf("Passed percentage: %f\n", passedPercentage)

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
	AddTestFileToDir(tempDir, testFileName, testFile)
	commands := GetDockerRepoCommand("JavaScript", tempDir, testFileName)
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
			fmt.Printf("Error running command: %v\n", err)
		}
	}

	// Parse the final output for test results
	output := finalOutput.String()
	successCount, failCount := parseTestResults(output)
	fmt.Printf("Parsed test results - Success: %d, Fail: %d\n", successCount, failCount)

	// Return results even if there was an error, to get success/fail counts
	return output, successCount, failCount, err
}

// Helper function to parse Jest output for test results
func parseTestResults(output string) (int, int) {
	var successCount, failCount int

	// Match test summary line that shows passed and total tests
	summaryRegex := regexp.MustCompile(`Tests:\s+(?:(\d+)\s+failed,\s+)?(\d+)\s+passed(?:,\s+(\d+)\s+total)?`)

	matches := summaryRegex.FindStringSubmatch(output)
	if matches != nil {
		fmt.Printf("Found test results matches: %v\n", matches)

		// Parse failed tests if present
		if matches[1] != "" {
			failCount, _ = strconv.Atoi(matches[1])
		}

		// Parse passed tests
		if matches[2] != "" {
			successCount, _ = strconv.Atoi(matches[2])
		}

		// Verify against total if present
		if matches[3] != "" {
			total, _ := strconv.Atoi(matches[3])
			if total != successCount+failCount {
				fmt.Printf("Warning: Total tests (%d) doesn't match sum of passed (%d) and failed (%d)\n",
					total, successCount, failCount)
			}
		}
	} else {
		fmt.Printf("No test results found in output: %s\n", output)
	}

	return successCount, failCount
}
