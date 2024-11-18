package handlers

import (
	"backend/services"
	"backend/util"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

type GitHubHandler struct {
	GitHubService *services.GitHubService
}

func NewGitHubHandler() *GitHubHandler {
	githubService := services.NewGitHubService()
	return &GitHubHandler{
		GitHubService: githubService,
	}
}

func (h *GitHubHandler) CreateRepositoryFromTemplate(c *fiber.Ctx) error {
	githubToken := c.Locals("githubToken").(string)
	fmt.Println("GitHub token:", githubToken)
	
	// Parse request body
	var body struct {
		TemplateCloneURL string `json:"templateCloneURL"`
		NewRepoName      string `json:"newRepoName"`
	}
	
	if err := c.BodyParser(&body); err != nil {
		return util.HandleError(c, "Invalid request body")
	}
	
	repo, err := h.GitHubService.CreateRepositoryFromTemplate(c.Context(), githubToken, body.TemplateCloneURL, body.NewRepoName)
	if err != nil {
		return util.HandleError(c, "Failed to create repository", fiber.Map{"details": err.Error()})
	}
	
	return c.JSON(repo)
}
