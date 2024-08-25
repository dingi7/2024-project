package handlers

import (
	"backend/models"
	"backend/operations"
	"backend/services"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

type SubmissionHandler struct {
	SubmissionService *services.SubmissionService
}

func NewSubmissionHandler(client *mongo.Client) *SubmissionHandler {
	submissionService := services.NewSubmissionService(client)
	return &SubmissionHandler{
		SubmissionService: submissionService,
	}
}

func (h *SubmissionHandler) CreateSubmission(c *fiber.Ctx) error {
	submission := new(models.Submission)
	if err := c.BodyParser(submission); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid payload"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	statusCode, output, err := operations.RunTestCases(submission.Language, submission.Code)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error running test cases"})
	}

	var result map[string]interface{}
	if err := json.Unmarshal(output, &result); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error parsing test results"})
	}

	submission.ContestID = c.Params("contestId")
	submission.OwnerID = c.Locals("userID").(string)
	submission.Status = fmt.Sprintf("%v", result["passed"])
	submission.CreatedAt = time.Now().Format(time.RFC3339)

	if err := h.SubmissionService.CreateSubmission(ctx, submission); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error saving submission"})
	}

	return c.Status(statusCode).JSON(result)
}

func (h *SubmissionHandler) GetSubmissions(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	contestID := c.Params("contestId")

	submissions, err := h.SubmissionService.GetSubmissionsByContestIDAndOwnerID(c.Context(), userID, contestID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error fetching submissions"})
	}

	return c.Status(fiber.StatusOK).JSON(submissions)
}