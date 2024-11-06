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
	submission.CreatedAt = time.Now().Format(time.RFC3339)

	// Fetch test cases for the contest
	testCases, err := h.SubmissionService.GetContestTestCases(ctx, contestID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error fetching test cases"})
	}

	if submission.IsRepo {
		return h.handleRepoSubmission(c, submission)
	}

	return h.handleCodeSubmission(c, ctx, submission, contestID, testCases)
}

func (h *SubmissionHandler) handleRepoSubmission(c *fiber.Ctx, submission *models.Submission) error {
	statusCode, output, score, passed, err := operations.RunRepoTestCases(submission.Code, "submission.TestFile", c.Locals("githubToken").(string))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error cloning repository", "message": err.Error()})
	}

	return c.Status(statusCode).JSON(fiber.Map{"output": output, "score": score, "passed": passed})
}

func (h *SubmissionHandler) handleCodeSubmission(c *fiber.Ctx, ctx context.Context, submission *models.Submission, contestID string, testCases []models.TestCase) error {
	statusCode, output, score, passed, err := operations.RunCodeTestCases(submission.Language, submission.Code, testCases)
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

func (h *SubmissionHandler) GetSubmissionsByOwnerID(c *fiber.Ctx) error {
	contestID := c.Params("contestId")
	ownerID := c.Params("ownerId")
	submissions, err := h.SubmissionService.GetSubmissionsByContestIDAndOwnerID(c.Context(), contestID, ownerID)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error fetching submissions"})
	}

	return c.Status(fiber.StatusOK).JSON(submissions)
}

func (h *SubmissionHandler) GetSubmissionsByContestID(c *fiber.Ctx) error {
	contestID := c.Params("contestId")

	submissions, err := h.SubmissionService.GetSubmissionsByContestID(c.Context(), contestID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error fetching submissions"})
	}
	return c.Status(fiber.StatusOK).JSON(submissions)
}
