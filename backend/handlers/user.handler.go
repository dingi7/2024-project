package handlers

import (
	"backend/models"
	"backend/services"
	"context"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

const requestTimeout = 10 * time.Second

type UserHandler struct {
	UserService *services.UserService
}

func NewUserHandler(client *mongo.Client) *UserHandler {
	userService := services.NewUserService(client)
	return &UserHandler{
		UserService: userService,
	}
}

// Helper function to create structured error responses
func createErrorResponse(message string, details string) fiber.Map {
	return fiber.Map{"error": message, "details": details}
}

func (h *UserHandler) GetUsers(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), requestTimeout)
	defer cancel()

	users, err := h.UserService.GetUsers(ctx)
	if err != nil {
		log.Printf("Error fetching users: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(createErrorResponse("Failed to fetch users", err.Error()))
	}

	return c.JSON(users)
}

func (h *UserHandler) UserSignIn(c *fiber.Ctx) error {
	var user models.User
	if err := c.BodyParser(&user); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(createErrorResponse("Invalid request body", err.Error()))
	}

	// Validate GitHub access token
	isValid, err := h.UserService.ValidateGitHubToken(user.GitHubAccessToken)
	if err != nil || !isValid {
		log.Printf("Invalid GitHub access token: %v", err)
		return c.Status(fiber.StatusUnauthorized).JSON(createErrorResponse("Invalid GitHub access token", ""))
	}

	ctx, cancel := context.WithTimeout(context.Background(), requestTimeout)
	defer cancel()

	// Check if user exists
	existingUser, err := h.UserService.FindUserByID(ctx, user.ID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// User doesn't exist, create new user
			user.CreatedAt = time.Now() // Set the CreatedAt field
			if err := h.UserService.CreateUser(ctx, &user); err != nil {
				log.Printf("Failed to create user: %v", err)
				return c.Status(fiber.StatusInternalServerError).JSON(createErrorResponse("Failed to create user", err.Error()))
			}
		} else {
			log.Printf("Database error: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(createErrorResponse("Database error", err.Error()))
		}
	} else {
		// User exists
		log.Printf("User already exists: %v", existingUser)
	}

	accessToken, err := h.UserService.CreateAccessToken(user, "")
	if err != nil {
		log.Printf("Failed to create access token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(createErrorResponse("Failed to create access token", err.Error()))
	}
	refreshToken, err := h.UserService.CreateRefreshToken(user)
	if err != nil {
		log.Printf("Failed to create refresh token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(createErrorResponse("Failed to create refresh token", err.Error()))
	}

	return c.JSON(fiber.Map{"accessToken": accessToken, "refreshToken": refreshToken})
}

func (h *UserHandler) RefreshAccessToken(c *fiber.Ctx) error {
	var body struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(createErrorResponse("Invalid request body", err.Error()))
	}

	if body.RefreshToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(createErrorResponse("Refresh token is required", ""))
	}

	accessToken, err := h.UserService.CreateAccessTokenFromRefreshToken(body.RefreshToken)
	if err != nil {
		log.Printf("Invalid refresh token: %v", err)
		return c.Status(fiber.StatusUnauthorized).JSON(createErrorResponse("Invalid refresh token", ""))
	}

	return c.JSON(fiber.Map{"accessToken": accessToken})
}

func (h *UserHandler) GetUsersAttendedContests(c *fiber.Ctx) error {
	userID := c.Params("userId")
	if userID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(createErrorResponse("User ID is required", ""))
	}

	ctx, cancel := context.WithTimeout(context.Background(), requestTimeout)
	defer cancel()

	attendedContests, err := h.UserService.GetUsersAttendedContests(ctx, userID)
	if err != nil {
		log.Printf("Error fetching attended contests: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(createErrorResponse("Failed to fetch attended contests", err.Error()))
	}

	return c.JSON(attendedContests)
}
