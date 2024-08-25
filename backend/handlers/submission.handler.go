package handlers

import (
	"backend/models"
	"backend/operations"
	"backend/services"
	"context"
	"encoding/json"
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

	// Get contest ID from params
	contestID := c.Params("contestId")

	// Fetch test cases for the contest
	testCases, err := h.SubmissionService.GetContestTestCases(ctx, contestID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error fetching test cases"})
	}

	statusCode, output, score, passed, err := operations.RunTestCases(submission.Language, submission.Code, testCases)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error running test cases"})
	}

	var result []map[string]interface{}
	if err := json.Unmarshal(output, &result); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error parsing test results"})
	}

	submission.ContestID = contestID
	submission.OwnerID = c.Locals("userID").(string)
	submission.Status = passed
	submission.Score = float64(score)
	submission.CreatedAt = time.Now().Format(time.RFC3339)

	record, err := h.SubmissionService.CreateSubmission(ctx, submission)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error saving submission"})
	}

	return c.Status(statusCode).JSON(record)

}

func (h *SubmissionHandler) GetSubmissions(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	contestID := c.Params("contestId")

	submissions, err := h.SubmissionService.GetSubmissionsByContestIDAndOwnerID(c.Context(), contestID, userID)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error fetching submissions"})
	}

	return c.Status(fiber.StatusOK).JSON(submissions)
}
