package handlers

import (
	"backend/models"
	"backend/operations"
	"backend/services"
	"backend/util"
	"encoding/json"
	"fmt"

	"context"

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

	var timeout time.Duration
	if submission.IsRepo {
		timeout = 120 * time.Second // 120 seconds timeout for repository submissions
	} else {
		timeout = 60 * time.Second // 60 seconds for regular code submissions
	}

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	contestID := c.Params("contestId")
	submission.CreatedAt = time.Now().Format(time.RFC3339)

	if submission.IsRepo {
		return h.handleRepoSubmission(c, ctx, submission, contestID)
	}

	testCases, err := h.SubmissionService.GetContestTestCases(ctx, contestID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error fetching test cases"})
	}
	return h.handleCodeSubmission(c, ctx, submission, contestID, testCases)
}

func (h *SubmissionHandler) handleRepoSubmission(c *fiber.Ctx, ctx context.Context, submission *models.Submission, contestID string) error {
	testFiles, err := h.SubmissionService.GetContestTestFiles(ctx, contestID)
	if err != nil {
		return util.HandleError(c, "Error fetching test files")
	}

	statusCode, _, score, passed, err := operations.RunRepoTestCases(submission.Code, testFiles, c.Locals("githubToken").(string))
	if err != nil {
		return util.HandleError(c, "Error cloning repository", fiber.Map{"message": err.Error()})
	}

	return h.finalizeSubmission(c, ctx, submission, contestID, statusCode, score, passed)
}

func (h *SubmissionHandler) handleCodeSubmission(c *fiber.Ctx, ctx context.Context, submission *models.Submission, contestID string, testCases []models.TestCase) error {
	statusCode, results, score, passed, err := operations.RunCodeTestCases(submission.Language, submission.Code, testCases)
	if err != nil {
		return util.HandleError(c, "Error running test cases")
	}

	var testCaseResults []models.TestCaseResult
	if err := json.Unmarshal(results, &testCaseResults); err != nil {
		return util.HandleError(c, "Error parsing test case results")
	}
	submission.TestCasesResults = testCaseResults

	return h.finalizeSubmission(c, ctx, submission, contestID, statusCode, score, passed)
}

func (h *SubmissionHandler) finalizeSubmission(c *fiber.Ctx, ctx context.Context, submission *models.Submission, contestID string,
	statusCode int, score int, passed bool) error {

	// Create a new context with a 5-second timeout specifically for database operation

	fmt.Printf("Finalizing submission - ContestID: %s, UserID: %v, Score: %d, Passed: %v\n",
		contestID, c.Locals("userID"), score, passed)

	submission.ContestID = contestID
	submission.OwnerID = c.Locals("userID").(string)
	submission.Status = passed
	submission.Score = float64(score)
	submission.CreatedAt = time.Now().Format(time.RFC3339)

	fmt.Printf("Submission before save: %+v\n", submission)

	// Use the new context for database operation
	record, err := h.SubmissionService.CreateSubmission(ctx, submission)
	if err != nil {
		fmt.Printf("Error in finalizeSubmission: %v\n", err)
		return util.HandleError(c, "Error saving submission")
	}

	return c.Status(statusCode).JSON(record)
}

func (h *SubmissionHandler) GetSubmissionsByOwnerID(c *fiber.Ctx) error {
	contestID := c.Params("contestId")
	ownerID := c.Params("ownerId")
	submissions, err := h.SubmissionService.GetSubmissionsByContestIDAndOwnerID(c.Context(), contestID, ownerID)

	if err != nil {
		return util.HandleError(c, "Error fetching submissions")
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
