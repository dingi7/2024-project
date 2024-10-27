package util

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/go-git/go-git/v5"
)

func CloneRepository(repoURL string) (string, error) {
	// Create a temporary directory
	tempDir, err := CreateTempDir()
	if err != nil {
		return "", fmt.Errorf("failed to create temp directory: %v", err)
	}

	// Clone the repository
	_, err = git.PlainClone(tempDir, false, &git.CloneOptions{
		URL:      repoURL,
		Progress: os.Stdout,
	})
	if err != nil {
		// Clean up the temporary directory if cloning fails
		os.RemoveAll(tempDir)
		return "", fmt.Errorf("failed to clone repository: %v", err)
	}

	return tempDir, nil
}

func ReadConfigFileFromRepo(repoPath string) (string, error) {
	mainFiles := []string{"go.mod", "package.json"}

	for _, file := range mainFiles {
		content, err := os.ReadFile(filepath.Join(repoPath, file))
		if err == nil {
			return string(content), nil
		}
	}

	return "", fmt.Errorf("no config file found in the repository")
}
