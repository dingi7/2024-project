package handlers

import (
	"backend/models"
	"backend/services"
	"context"
	"fmt"
	"io"
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
	// Parse the multipart form data (including the file)
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
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
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

	// Check if the "contestRules" field exists and has at least one file
	if files, ok := form.File["contestRules[0]"]; ok && len(files) > 0 {
		fileHeader := files[0]
		file, err := fileHeader.Open()
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to open PDF file"})
		}
		defer file.Close()

		pdfData, err := io.ReadAll(file)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read PDF file"})
		}

		contest.ContestRules = pdfData
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
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
	}

	// Return the saved contest as JSON
	return c.JSON(contest)
}

func (h *ContestHandler) GetContests(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	contests, err := h.ContestService.GetContests(ctx)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
	}
	for i := range contests {
		contests[i].TestCases = nil
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
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
	}

	if userId == contest.OwnerID {
		return c.JSON(contest)
	} else {
		contest.TestCases = nil
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
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
	}
	if userId != contest.OwnerID {
		return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized")
	}
	if err := h.ContestService.DeleteContest(ctx, id); err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
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
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
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

	// Handle contest rules file update
	if files, ok := form.File["contestRules[0]"]; ok && len(files) > 0 {
		fileHeader := files[0]
		file, err := fileHeader.Open()
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to open PDF file"})
		}
		defer file.Close()

		pdfData, err := io.ReadAll(file)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read PDF file"})
		}

		existingContest.ContestRules = pdfData
	}

	// Validate updated contest data
	if err := validateContest(existingContest); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Update the contest in the database
	if err := h.ContestService.UpdateContest(ctx, id, existingContest); err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
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
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
	}
	if userId != contest.OwnerID {
		return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized")
	}
	if err := h.ContestService.AddTestCase(ctx, id, testCase); err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
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
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
	}
	if userId != contest.OwnerID {
		return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized")
	}
	if err := h.ContestService.UpdateTestCase(ctx, id, testCase); err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
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
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
	}
	if userId != contest.OwnerID {
		return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized")
	}
	if err := h.ContestService.DeleteTestCase(ctx, contestId, testCaseId); err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
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
