package util

import (
	"bytes"
	// "context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/go-git/go-git/plumbing/transport"
	git "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	githttp "github.com/go-git/go-git/v5/plumbing/transport/http"
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

func PushToUserRepo(templateRepoPath, newRepoURL, githubAccessToken string) error {
	// Open the existing local repository
	repo, err := git.PlainOpen(templateRepoPath)
	if err != nil {
		return fmt.Errorf("failed to open template repository: %v", err)
	}

	// Check if the remote already exists
	_, err = repo.Remote("new-origin")
	if err == git.ErrRemoteNotFound {
		// Create a new remote named "new-origin"
		_, err = repo.CreateRemote(&config.RemoteConfig{
			Name: "new-origin",
			URLs: []string{newRepoURL},
		})
		if err != nil {
			return fmt.Errorf("failed to create remote: %v", err)
		}
	} else if err != nil {
		return fmt.Errorf("failed to check remote: %v", err)
	}

	// Define authentication
	auth := &githttp.BasicAuth{
		Username: "github", // This can be anything except an empty string
		Password: githubAccessToken,
	}

	// Push to the new remote
	err = repo.Push(&git.PushOptions{
		RemoteName: "new-origin",
		Auth:       auth,
		Progress:   os.Stdout,
	})
	if err != nil {
		if err == transport.ErrAuthenticationRequired {
			return fmt.Errorf("authentication failed: %v", err)
		}
		return fmt.Errorf("failed to push to remote: %v", err)
	}

	return nil
}

func CreateGitHubRepo(repoName, oauthToken string) (string, error) {
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

	req.Header.Set("Authorization", "token "+oauthToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		if resp.StatusCode == http.StatusUnprocessableEntity {
			return "", fmt.Errorf("failed to create repo: %s, response: %s", resp.Status, "Repository name already exists")
		}
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to create repo: %s, response: %s", resp.Status, string(body))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %v", err)
	}

	if cloneURL, ok := result["clone_url"].(string); ok {
		return cloneURL, nil
	}
	return "", fmt.Errorf("failed to retrieve clone URL from response")
}
