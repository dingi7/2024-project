package util

import (
	"fmt"
	"net/url"
	"strings"
)

func ConvertGitHubURLToZip(gitURL string) (string, error) {
	fmt.Println("Converting GitHub URL to zip:", gitURL)
	parsedURL, err := url.Parse(gitURL)
	if err != nil {
		return "", fmt.Errorf("invalid URL: %v", err)
	}

	// Handle both github.com and api.github.com URLs
	var owner, repo string
	if strings.Contains(parsedURL.Host, "api.github.com") {
		// API URL format: https://api.github.com/repos/<owner>/<repo>
		pathParts := strings.Split(parsedURL.Path, "/")
		if len(pathParts) < 3 || pathParts[1] != "repos" {
			return "", fmt.Errorf("invalid GitHub API URL format")
		}
		owner = pathParts[2]
		repo = pathParts[3]
		// If repo is empty (e.g., /repos/<owner>), try to extract it from the query parameters
		if repo == "" {
			queryParams := parsedURL.Query()
			if repoName, ok := queryParams["repo"]; ok && len(repoName) > 0 {
				repo = repoName[0]
			}
		}
		// If repo is still empty, return an error
		if repo == "" {
			return "", fmt.Errorf("unable to determine repository name from GitHub API URL")
		}
	} else if strings.Contains(parsedURL.Host, "github.com") {
		// Regular GitHub URL format: https://github.com/<owner>/<repo>
		pathParts := strings.Split(parsedURL.Path, "/")
		if len(pathParts) < 3 {
			return "", fmt.Errorf("URL should be in the format https://github.com/<owner>/<repo>")
		}
		owner = pathParts[1]
		repo = pathParts[2]
	} else {
		return "", fmt.Errorf("invalid GitHub URL")
	}

	// Construct the zip download URL
	zipURL := fmt.Sprintf("https://github.com/%s/%s/archive/refs/heads/master.zip", owner, repo)
	return zipURL, nil
}
