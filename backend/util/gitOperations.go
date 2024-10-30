package util

import (
	"bytes"
	"encoding/json"
	"fmt"
	githttp "github.com/go-git/go-git/v5/plumbing/transport/http" // Added alias
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
)

type RepoCreationResponse struct {
	CloneURL string `json:"clone_url"`
}

func CloneRepository(repoURL string, githubAccessToken string) (string, error) {
	// Create a temporary directory
	tempDir, err := CreateTempDir()
	if err != nil {
		return "", fmt.Errorf("failed to create temp directory: %v", err)
	}

	// Clone the repository
	_, err = git.PlainClone(tempDir, false, &git.CloneOptions{
		URL:      repoURL,
		Progress: os.Stdout,
		Auth: &githttp.BasicAuth{
			Username: "githubAccessToken",
			Password: githubAccessToken,
		},
	})

	if err != nil {
		// Clean up the temporary directory if cloning fails
		os.RemoveAll(tempDir)
		return "", fmt.Errorf("failed to clone repository: %v", err)
	}

	return tempDir, nil
}

func PushToUserRepo(templateRepoPath string, newRepoUrl string, githubAccessToken string) error {
	// Create a new repository
	repo, err := git.PlainOpen(templateRepoPath)
	if err != nil {
		return fmt.Errorf("failed to open template repository: %v", err)
	}

	_, err = repo.CreateRemote(&config.RemoteConfig{
		Name: "new-origin",
		URLs: []string{newRepoUrl},
	})
	if err != nil {
		return fmt.Errorf("failed to create remote: %v", err)
	}

	err = repo.Push(&git.PushOptions{
		RemoteName: "new-origin",
		Auth: &githttp.BasicAuth{
			Username: "user",            // Username can be anything; GitHub uses token-based auth
			Password: githubAccessToken, // The user's OAuth token as password
		},
	})

	return err
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

func CreateGitHubRepo(repoName, githubToken string) (string, error) {
	url := "https://api.github.com/user/repos"
	data := map[string]interface{}{
		"name":    repoName,
		"private": false,
	}
	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request data: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Authorization", "token "+githubToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("failed to create repo: %s", resp.Status)
	}

	var result RepoCreationResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %v", err)
	}

	return result.CloneURL, nil
}
