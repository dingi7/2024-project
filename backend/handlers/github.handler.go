package handlers

import (
	"backend/services"
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
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}
	
	repo, err := h.GitHubService.CreateRepositoryFromTemplate(c.Context(), githubToken, body.TemplateCloneURL, body.NewRepoName)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create repository",
			"details": err.Error(),
		})
	}
	
	return c.JSON(repo)
}
