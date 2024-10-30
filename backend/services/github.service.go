package services

import (
	"backend/util"
	"context"
)

type GitHubService struct {}

func NewGitHubService() *GitHubService {
	return &GitHubService{}
}

func (s *GitHubService) CreateRepositoryFromTemplate(ctx context.Context, githubAccessToken, templateCloneURL, newRepoName string) (string, error) {

	userRepoURL, err := util.CreateGitHubRepo(newRepoName, githubAccessToken)
	if err != nil {
		return "", err
	}
	templateRepoPath, err := util.CloneRepository(templateCloneURL, githubAccessToken)
	if err != nil {
		return "", err
	}

	err = util.PushToUserRepo(templateRepoPath, userRepoURL, githubAccessToken)
	if err != nil {
		return "", err
	}
	return userRepoURL, nil
}
