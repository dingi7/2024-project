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
	UserService    *services.UserService
}

func NewContestHandler(db *gorm.DB) *ContestHandler {
	contestService := services.NewContestService(db)
	userService := services.NewUserService(db)
	return &ContestHandler{
		ContestService: contestService,
		UserService:    userService,
	}
}

func (h *ContestHandler) CreateContest(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	user, err := h.UserService.FindUserByID(context.Background(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get user"})
	}

	if !user.IsAdmin() {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You are not authorized to create a contest"})
	}

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

	// Get public and invite-only flags (optional)
	isPublicStr, _ := getFormValue(form, "isPublic")
	inviteOnlyStr, _ := getFormValue(form, "inviteOnly")

	// Default to public if not specified
	isPublic := true
	if isPublicStr == "false" {
		isPublic = false
	}

	// Default to not invite-only if not specified
	inviteOnly := false
	if inviteOnlyStr == "true" {
		inviteOnly = true
	}

	// If invite-only is true, isPublic must be false
	if inviteOnly && isPublic {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invite-only contests must be private"})
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
		IsPublic:    isPublic,
		InviteOnly:  inviteOnly,
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
		contest.ContestRules = &pdfData
	}

	if testFiles, ok := form.File["testFiles[0]"]; ok {
		if len(testFiles) == 0 && contestStructure != "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Test files are required for structured contests"})
		}
		testFileData, err := util.HandleTestFileUpload(testFiles)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		contest.TestFiles = &testFileData
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

	// Get userID from context if authenticated
	var userID string
	if c.Locals("userID") != nil {
		userID = c.Locals("userID").(string)
	}

	contests, err := h.ContestService.GetContests(ctx, userID)
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

	// Get user ID from context if authenticated
	var userID string
	if c.Locals("userID") != nil {
		userID = c.Locals("userID").(string)
	}

	// Get the contest with access check
	contest, err := h.ContestService.FindContestByID(ctx, id, userID)
	if err != nil {
		if err.Error() == "access denied" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You do not have access to this contest",
			})
		}
		log.Printf("Error fetching contest: %v", err)
		return util.HandleError(c, "Failed to fetch contest")
	}

	return c.JSON(contest)
}

func (h *ContestHandler) DeleteContest(c *fiber.Ctx) error {
	id := c.Params("id")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get user ID from context
	userID := c.Locals("userID").(string)

	// Get the existing contest to check permissions
	existingContest, err := h.ContestService.FindContestByID(ctx, id, userID)
	if err != nil {
		if err.Error() == "access denied" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You do not have access to this contest",
			})
		}
		return util.HandleError(c, "Failed to fetch contest")
	}

	// Only the owner can delete the contest
	if existingContest.OwnerID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only the contest owner can delete this contest",
		})
	}

	if err := h.ContestService.DeleteContest(ctx, id); err != nil {
		log.Printf("Error deleting contest: %v", err)
		return util.HandleError(c, "Failed to delete contest")
	}

	return c.JSON(fiber.Map{"message": "Contest deleted successfully"})
}

func (h *ContestHandler) EditContest(c *fiber.Ctx) error {
	id := c.Params("id")

	contentType := c.Get("Content-Type")
	var contestUpdate models.Contest

	if strings.HasPrefix(contentType, "multipart/form-data") {
		// Parse multipart form
		form, err := c.MultipartForm()
		if err != nil {
			return util.HandleError(c, "Invalid multipart form data")
		}

		// Parse regular fields
		if err := c.BodyParser(&contestUpdate); err != nil {
			fmt.Println("Error parsing request body:", err)
			return util.HandleError(c, "Invalid request body")
		}

		// Handle contestRules file upload (look for contestRules[0])
		if files, ok := form.File["contestRules[0]"]; ok && len(files) > 0 {
			pdfData, err := util.HandlePDFUpload(files)
			if err != nil {
				return util.HandleError(c, err.Error())
			}
			contestUpdate.ContestRules = &pdfData
		}
	} else {
		if err := c.BodyParser(&contestUpdate); err != nil {
			fmt.Println("Error parsing request body:", err)
			return util.HandleError(c, "Invalid request body")
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get user ID from context
	userID := c.Locals("userID").(string)

	// Get the existing contest to check permissions
	existingContest, err := h.ContestService.FindContestByID(ctx, id, userID)
	if err != nil {
		if err.Error() == "access denied" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You do not have access to this contest",
			})
		}
		return util.HandleError(c, "Failed to fetch contest")
	}

	// Only the owner can edit the contest
	if existingContest.OwnerID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only the contest owner can edit this contest",
		})
	}

	if err := h.ContestService.EditContest(ctx, id, &contestUpdate); err != nil {
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

	// Get user ID from context
	userID := c.Locals("userID").(string)

	// Get the existing contest to check permissions
	existingContest, err := h.ContestService.FindContestByID(ctx, contestID, userID)
	if err != nil {
		if err.Error() == "access denied" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You do not have access to this contest",
			})
		}
		return util.HandleError(c, "Failed to fetch contest")
	}

	// Only the owner can add test cases
	if existingContest.OwnerID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only the contest owner can add test cases",
		})
	}

	if err := h.ContestService.AddTestCase(ctx, contestID, &testCase); err != nil {
		log.Printf("Error adding test case: %v", err)
		return util.HandleError(c, "Failed to add test case")
	}

	return c.JSON(testCase)
}

func (h *ContestHandler) UpdateTestCase(c *fiber.Ctx) error {
	var testCase models.TestCase
	if err := c.BodyParser(&testCase); err != nil {
		return util.HandleError(c, "Invalid request body")
	}

	contestID := c.Params("contestId")
	testCase.ContestID = contestID

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get user ID from context
	userID := c.Locals("userID").(string)

	// Get the existing contest to check permissions
	existingContest, err := h.ContestService.FindContestByID(ctx, contestID, userID)
	if err != nil {
		if err.Error() == "access denied" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You do not have access to this contest",
			})
		}
		return util.HandleError(c, "Failed to fetch contest")
	}

	// Only the owner can update test cases
	if existingContest.OwnerID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only the contest owner can update test cases",
		})
	}

	if err := h.ContestService.UpdateTestCase(ctx, &testCase); err != nil {
		log.Printf("Error updating test case: %v", err)
		return util.HandleError(c, "Failed to update test case")
	}

	return c.JSON(fiber.Map{"message": "Test case updated successfully"})
}

func (h *ContestHandler) DeleteTestCase(c *fiber.Ctx) error {
	contestID := c.Params("contestId")
	testCaseID := c.Params("testCaseId")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get user ID from context
	userID := c.Locals("userID").(string)

	// Get the existing contest to check permissions
	existingContest, err := h.ContestService.FindContestByID(ctx, contestID, userID)
	if err != nil {
		if err.Error() == "access denied" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You do not have access to this contest",
			})
		}
		return util.HandleError(c, "Failed to fetch contest")
	}

	// Only the owner can delete test cases
	if existingContest.OwnerID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only the contest owner can delete test cases",
		})
	}

	if err := h.ContestService.DeleteTestCase(ctx, testCaseID); err != nil {
		log.Printf("Error deleting test case: %v", err)
		return util.HandleError(c, "Failed to delete test case")
	}

	return c.JSON(fiber.Map{"message": "Test case deleted successfully"})
}

// GetUserOwnedContests gets all contests owned by a specific user
func (h *ContestHandler) GetUserOwnedContests(c *fiber.Ctx) error {
	userId := c.Params("userId")
	if userId == "" {
		return util.HandleError(c, "User ID is required")
	}

	// Verify the request is authorized
	requestingUserID := c.Locals("userID").(string)

	// Only allow users to fetch their own owned contests for security
	if userId != requestingUserID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "You can only view your own owned contests",
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	contests, err := h.ContestService.GetUserOwnedContests(ctx, userId)
	if err != nil {
		log.Printf("Error fetching user's owned contests: %v", err)
		return util.HandleError(c, "Failed to fetch user's owned contests")
	}

	return c.JSON(contests)
}

// GetUserInvitedContests gets all contests a user has been invited to
func (h *ContestHandler) GetUserInvitedContests(c *fiber.Ctx) error {
	userId := c.Params("userId")
	if userId == "" {
		return util.HandleError(c, "User ID is required")
	}

	// Verify the request is authorized
	requestingUserID := c.Locals("userID").(string)

	// Only allow users to fetch their own invited contests for security
	if userId != requestingUserID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "You can only view your own invited contests",
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	contests, err := h.ContestService.GetUserInvitedContests(ctx, userId)
	if err != nil {
		log.Printf("Error fetching user's invited contests: %v", err)
		return util.HandleError(c, "Failed to fetch user's invited contests")
	}

	return c.JSON(contests)
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
