package handlers

import (
	"backend/models"
	"backend/operations"
	"backend/services"
	"backend/util"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type SubmissionHandler struct {
	SubmissionService *services.SubmissionService
	ContestService    *services.ContestService
	UserService       *services.UserService
}

func NewSubmissionHandler(db *gorm.DB) *SubmissionHandler {
	submissionService := services.NewSubmissionService(db)
	userService := services.NewUserService(db)
	contestService := services.NewContestService(db)
	return &SubmissionHandler{
		SubmissionService: submissionService,
		UserService:       userService,
		ContestService:    contestService,
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

	// If no test files, return an error
	if testFiles == nil {
		return util.HandleError(c, "No test files available for this contest")
	}

	statusCode, _, score, passed, passedTestCases, totalTestCases, err := operations.RunRepoTestCases(submission.Code, testFiles, c.Locals("githubToken").(string))
	if err != nil {
		return util.HandleError(c, "Error cloning repository", fiber.Map{"message": err.Error()})
	}

	return h.finalizeSubmission(c, ctx, submission, contestID, statusCode, score, passed, passedTestCases, totalTestCases)
}

func (h *SubmissionHandler) handleCodeSubmission(c *fiber.Ctx, ctx context.Context, submission *models.Submission, contestID string, testCases []models.TestCase) error {
	contest, err := h.ContestService.FindContestByID(ctx, contestID, submission.OwnerID)
	if err != nil {
		return util.HandleError(c, "Error fetching contest")
	}

	// Use the enhanced function with resource stats
	statusCode, results, score, passed, passedTestCases, totalTestCases, execResults, err := operations.RunCodeTestCasesWithStats(submission.Language, submission.Code, testCases, contest.EnableAICodeEntryIdentification)
	if err != nil {
		return util.HandleError(c, "Error running test cases")
	}

	var testCaseResults []models.TestCaseResult
	if err := json.Unmarshal(results, &testCaseResults); err != nil {
		return util.HandleError(c, "Error parsing test case results")
	}

	// Add the execution results to the submission
	submission.TestCasesResults = testCaseResults

	// Find max CPU and memory usage
	var maxCPUUsage float64
	var maxMemoryUsage int64

	for _, result := range execResults {
		if result.CPUUsage > maxCPUUsage {
			maxCPUUsage = result.CPUUsage
		}
		if result.MemUsage > maxMemoryUsage {
			maxMemoryUsage = result.MemUsage
		}
	}

	submission.MaxCPUUsage = maxCPUUsage
	submission.MaxMemoryUsage = int(maxMemoryUsage)

	return h.finalizeSubmission(c, ctx, submission, contestID, statusCode, score, passed, passedTestCases, totalTestCases)
}

func (h *SubmissionHandler) finalizeSubmission(c *fiber.Ctx, ctx context.Context, submission *models.Submission, contestID string,
	statusCode int, score int, passed bool, passedTestCases int, totalTestCases int) error {

	fmt.Printf("Finalizing submission - ContestID: %s, UserID: %v, Score: %d, Passed: %v\n",
		contestID, c.Locals("userID"), score, passed)

	submission.ContestID = contestID
	submission.OwnerID = c.Locals("userID").(string)

	// Get the user to set the owner name
	user, err := h.UserService.FindUserByID(ctx, submission.OwnerID)
	if err != nil {
		fmt.Printf("Error finding user: %v\n", err)
		// Continue even if user not found, just won't have owner name
	} else {
		submission.OwnerName = user.Name
	}

	submission.Status = passed
	submission.Score = float64(score)
	submission.CreatedAt = time.Now().Format(time.RFC3339)
	submission.TotalTestCases = totalTestCases
	submission.PassedTestCases = passedTestCases

	fmt.Printf("Submission before save: %+v\n", submission)

	// Use the context for database operation
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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	submissions, err := h.SubmissionService.GetSubmissionsByOwnerID(ctx, ownerID, contestID)
	if err != nil {
		return util.HandleError(c, "Error fetching submissions")
	}

	return c.Status(fiber.StatusOK).JSON(submissions)
}

func (h *SubmissionHandler) GetSubmissionsByContestID(c *fiber.Ctx) error {
	contestID := c.Params("contestId")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	submissions, err := h.SubmissionService.GetSubmissionsByContestID(ctx, contestID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error fetching submissions"})
	}
	return c.Status(fiber.StatusOK).JSON(submissions)
}

func (h *SubmissionHandler) GetSubmissionByID(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Submission ID is required",
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	submission, err := h.SubmissionService.FindSubmissionByID(ctx, id)
	if err != nil {
		if err.Error() == "submission not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Submission not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get submission: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"submission": submission,
	})
}
