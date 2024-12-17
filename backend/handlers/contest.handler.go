package handlers

import (
	"backend/models"
	"backend/services"
	"backend/util"
	"context"
	"fmt"
	"strings"

	"mime/multipart"
	"time"

	"github.com/go-playground/validator"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

type ContestHandler struct {
	ContestService *services.ContestService
}

func NewContestHandler(client *mongo.Client) *ContestHandler {
	contestService := services.NewContestService(client)
	return &ContestHandler{
		ContestService: contestService,
	}
}

func (h *ContestHandler) CreateContest(c *fiber.Ctx) error {
	const allowedLanguages = "python, java, javascript, c++, c#"

	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to parse form data"})
	}

	// Extract form fields with error handling
	title, err := getFormValue(form, "title")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	description, err := getFormValue(form, "description")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	language, err := getFormValue(form, "language")
	if err != nil || !isValidLanguage(language, allowedLanguages) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid language"})
	}

	startDate, err := getFormValue(form, "startDate")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	endDate, err := getFormValue(form, "endDate")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	prize, _ := getFormValue(form, "prize") // Prize is optional, so we ignore the error

	contestStructure, _ := getFormValue(form, "contestStructure")

	testFramework, _ := getFormValue(form, "testFramework")

	if contestStructure != "" && testFramework == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Test framework is required for structured contests"})
	}

	ownerID, err := getFormValue(form, "ownerId")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Create a new Contest instance with the form data
	contest := &models.Contest{
		Title:            title,
		Description:      description,
		Language:         language,
		StartDate:        startDate,
		EndDate:          endDate,
		Prize:            prize,
		OwnerID:          ownerID,
		CreatedAt:        time.Now(),
		TestCases:        []models.TestCase{},
		ContestStructure: contestStructure,
		TestFramework:    testFramework,
	}

	if files, ok := form.File["contestRules[0]"]; ok {
		pdfData, err := util.HandlePDFUpload(files)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		contest.ContestRules = pdfData
	}

	if testFiles, ok := form.File["testFiles[0]"]; ok {
		if len(testFiles) == 0 && contestStructure != "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Test files are required for structured contests"})
		}
		testFileData, err := util.HandleTestFileUpload(testFiles)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		contest.TestFiles = testFileData
	}

	// Validate contest data
	if err := validateContest(contest); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Create a context with a timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Pass the contest to the service layer for saving
	if err := h.ContestService.CreateContest(ctx, contest); err != nil {
		return util.HandleError(c, "Error creating contest", fiber.Map{"details": err.Error()})
	}

	// Return the saved contest as JSON
	return c.JSON(contest)
}

func isValidLanguage(language, allowedLanguages string) bool {
	return strings.Contains(allowedLanguages, strings.ToLower(language))
}

func (h *ContestHandler) GetContests(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	contests, err := h.ContestService.GetContests(ctx)
	if err != nil {
		return util.HandleError(c, "Error fetching contests", fiber.Map{"details": err.Error()})
	}
	for i := range contests {
		contests[i].TestCases = nil
		contests[i].TestFiles = nil
	}

	return c.JSON(contests)
}

func (h *ContestHandler) GetContestById(c *fiber.Ctx) error {
	userId := c.Locals("userID").(string)
	id := c.Params("id")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	contest, err := h.ContestService.FindContestByID(ctx, id)
	if err != nil {
		return util.HandleError(c, "Error fetching contest", fiber.Map{"details": err.Error()})
	}

	if userId == contest.OwnerID {
		return c.JSON(contest)
	} else {
		contest.TestCases = nil
		contest.TestFiles = nil
		return c.JSON(contest)
	}
}

func (h *ContestHandler) DeleteContest(c *fiber.Ctx) error {
	userId := c.Locals("userID").(string)
	id := c.Params("id")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	contest, err := h.ContestService.FindContestByID(ctx, id)
	if err != nil {
		return util.HandleError(c, "Error fetching contest", fiber.Map{"details": err.Error()})
	}
	if userId != contest.OwnerID {
		return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized")
	}
	if err := h.ContestService.DeleteContest(ctx, id); err != nil {
		return util.HandleError(c, "Error deleting contest", fiber.Map{"details": err.Error()})
	}

	return c.SendString("Contest deleted successfully")
}

func (h *ContestHandler) EditContest(c *fiber.Ctx) error {
	userId := c.Locals("userID").(string)
	id := c.Params("id")

	// Parse the multipart form data
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to parse form data"})
	}

	// Find the existing contest
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	existingContest, err := h.ContestService.FindContestByID(ctx, id)
	if err != nil {
		return util.HandleError(c, "Error fetching contest", fiber.Map{"details": err.Error()})
	}
	if userId != existingContest.OwnerID {
		return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized")
	}

	// Update contest fields
	if title, err := getFormValue(form, "title"); err == nil {
		existingContest.Title = title
	}
	if description, err := getFormValue(form, "description"); err == nil {
		existingContest.Description = description
	}
	if language, err := getFormValue(form, "language"); err == nil {
		existingContest.Language = language
	}
	if startDate, err := getFormValue(form, "startDate"); err == nil {
		existingContest.StartDate = startDate
	}
	if endDate, err := getFormValue(form, "endDate"); err == nil {
		existingContest.EndDate = endDate
	}
	if prize, err := getFormValue(form, "prize"); err == nil {
		existingContest.Prize = prize
	}

	if files, ok := form.File["contestRules[0]"]; ok {
		pdfData, err := util.HandlePDFUpload(files)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		existingContest.ContestRules = pdfData
	}

	// Validate updated contest data
	if err := validateContest(existingContest); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Update the contest in the database
	if err := h.ContestService.UpdateContest(ctx, id, existingContest); err != nil {
		return util.HandleError(c, "Error updating contest", fiber.Map{"details": err.Error()})
	}

	return c.JSON(existingContest)
}

func (h *ContestHandler) AddTestCase(c *fiber.Ctx) error {
	userId := c.Locals("userID").(string)
	id := c.Params("id")
	testCase := new(models.TestCase)
	if err := c.BodyParser(testCase); err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	contest, err := h.ContestService.FindContestByID(ctx, id)
	if err != nil {
		return util.HandleError(c, "Error fetching contest", fiber.Map{"details": err.Error()})
	}
	if userId != contest.OwnerID {
		return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized")
	}
	if err := h.ContestService.AddTestCase(ctx, id, testCase); err != nil {
		return util.HandleError(c, "Error adding test case", fiber.Map{"details": err.Error()})
	}

	return c.JSON(testCase)
}

func (h *ContestHandler) UpdateTestCase(c *fiber.Ctx) error {
	userId := c.Locals("userID").(string)
	id := c.Params("id")
	testCase := new(models.TestCase)
	if err := c.BodyParser(testCase); err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	contest, err := h.ContestService.FindContestByID(ctx, id)
	if err != nil {
		return util.HandleError(c, "Error fetching contest", fiber.Map{"details": err.Error()})
	}
	if userId != contest.OwnerID {
		return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized")
	}
	if err := h.ContestService.UpdateTestCase(ctx, id, testCase); err != nil {
		return util.HandleError(c, "Error updating test case", fiber.Map{"details": err.Error()})
	}

	return c.JSON(testCase)
}

func (h *ContestHandler) DeleteTestCase(c *fiber.Ctx) error {
	userId := c.Locals("userID").(string)
	contestId := c.Params("contestId")
	testCaseId := c.Params("testCaseId")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	contest, err := h.ContestService.FindContestByID(ctx, contestId)
	if err != nil {
		return util.HandleError(c, "Error fetching contest", fiber.Map{"details": err.Error()})
	}
	if userId != contest.OwnerID {
		return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized")
	}
	if err := h.ContestService.DeleteTestCase(ctx, contestId, testCaseId); err != nil {
		return util.HandleError(c, "Error deleting test case", fiber.Map{"details": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Test case deleted successfully",
	})
}

func validateContest(contest *models.Contest) error {
	validate := validator.New()
	validate.RegisterValidation("datetime", func(fl validator.FieldLevel) bool {
		_, err := time.Parse(time.RFC3339, fl.Field().String())
		return err == nil
	})
	return validate.Struct(contest)
}

// Add this helper function at the end of the file
func getFormValue(form *multipart.Form, key string) (string, error) {
	values, ok := form.Value[key]
	if !ok || len(values) == 0 {
		return "", fmt.Errorf("missing required field: %s", key)
	}
	return values[0], nil
}
