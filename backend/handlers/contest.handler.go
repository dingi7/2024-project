package handlers

import (
	"backend/models"
	"backend/services"
	"backend/util"
	"context"
	"fmt"
	"log"
	"strings"

	"mime/multipart"
	"time"

	"github.com/go-playground/validator"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ContestHandler struct {
	ContestService *services.ContestService
}

func NewContestHandler(db *gorm.DB) *ContestHandler {
	contestService := services.NewContestService(db)
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
		Title:       title,
		Description: description,
		Language:    language,
		StartDate:   startDate,
		EndDate:     endDate,
		Prize:       prize,
		OwnerID:     ownerID,
		CreatedAt:   time.Now(),
		TestCases:   []models.TestCase{},
	}

	if contestStructure != "" {
		contest.ContestStructure = &contestStructure
	}

	if testFramework != "" {
		contest.TestFramework = &testFramework
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
		log.Printf("Error creating contest: %v", err)
		return util.HandleError(c, "Failed to create contest")
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
		log.Printf("Error fetching contests: %v", err)
		return util.HandleError(c, "Failed to fetch contests")
	}

	return c.JSON(contests)
}

func (h *ContestHandler) GetContestById(c *fiber.Ctx) error {
	id := c.Params("id")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	contest, err := h.ContestService.FindContestByID(ctx, id)
	if err != nil {
		log.Printf("Error fetching contest: %v", err)
		return util.HandleError(c, "Failed to fetch contest")
	}

	return c.JSON(contest)
}

func (h *ContestHandler) DeleteContest(c *fiber.Ctx) error {
	id := c.Params("id")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := h.ContestService.DeleteContest(ctx, id); err != nil {
		log.Printf("Error deleting contest: %v", err)
		return util.HandleError(c, "Failed to delete contest")
	}

	return c.JSON(fiber.Map{"message": "Contest deleted successfully"})
}

func (h *ContestHandler) EditContest(c *fiber.Ctx) error {
	id := c.Params("id")
	var contest models.Contest
	if err := c.BodyParser(&contest); err != nil {
		return util.HandleError(c, "Invalid request body")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := h.ContestService.EditContest(ctx, id, &contest); err != nil {
		log.Printf("Error updating contest: %v", err)
		return util.HandleError(c, "Failed to update contest")
	}

	return c.JSON(fiber.Map{"message": "Contest updated successfully"})
}

func (h *ContestHandler) AddTestCase(c *fiber.Ctx) error {
	contestID := c.Params("id")
	var testCase models.TestCase
	if err := c.BodyParser(&testCase); err != nil {
		return util.HandleError(c, "Invalid request body")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := h.ContestService.AddTestCase(ctx, contestID, &testCase); err != nil {
		log.Printf("Error adding test case: %v", err)
		return util.HandleError(c, "Failed to add test case")
	}

	return c.JSON(fiber.Map{"message": "Test case added successfully", "testCase": testCase})
}

func (h *ContestHandler) UpdateTestCase(c *fiber.Ctx) error {
	var testCase models.TestCase
	if err := c.BodyParser(&testCase); err != nil {
		return util.HandleError(c, "Invalid request body")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := h.ContestService.UpdateTestCase(ctx, &testCase); err != nil {
		log.Printf("Error updating test case: %v", err)
		return util.HandleError(c, "Failed to update test case")
	}

	return c.JSON(fiber.Map{"message": "Test case updated successfully"})
}

func (h *ContestHandler) DeleteTestCase(c *fiber.Ctx) error {
	testCaseID := c.Params("testCaseId")
	fmt.Printf("Deleting test case ID: %s\n", testCaseID)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := h.ContestService.DeleteTestCase(ctx, testCaseID); err != nil {
		log.Printf("Error deleting test case: %v", err)
		return util.HandleError(c, "Failed to delete test case")
	}

	return c.JSON(fiber.Map{"message": "Test case deleted successfully"})
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
