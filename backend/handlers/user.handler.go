package handlers

import (
	"backend/models"
	"backend/services"
	"backend/util"
	"context"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

const requestTimeout = 10 * time.Second

type UserHandler struct {
	UserService *services.UserService
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	userService := services.NewUserService(db)
	return &UserHandler{
		UserService: userService,
	}
}

func (h *UserHandler) GetUsers(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), requestTimeout)
	defer cancel()

	users, err := h.UserService.GetUsers(ctx)
	if err != nil {
		log.Printf("Error fetching users: %v", err)
		return util.HandleError(c, "Failed to fetch users")
	}

	return c.JSON(users)
}

func (h *UserHandler) UserSignIn(c *fiber.Ctx) error {
	var user models.User
	if err := c.BodyParser(&user); err != nil {
		return util.HandleError(c, "Invalid request body")
	}

	// Validate GitHub access token
	isValid, err := h.UserService.ValidateGitHubToken(user.GitHubAccessToken)
	if err != nil || !isValid {
		log.Printf("Invalid GitHub access token: %v", err)
		return util.HandleError(c, "Invalid GitHub access token")
	}

	ctx, cancel := context.WithTimeout(context.Background(), requestTimeout)
	defer cancel()

	// Check if user exists
	existingUser, err := h.UserService.FindUserByID(ctx, user.ID)
	if err != nil {
		// Check if it's a "not found" error
		if err.Error() == "user not found" {
			// User doesn't exist, create new user
			if err := h.UserService.CreateUser(ctx, &user); err != nil {
				log.Printf("Failed to create user: %v", err)
				return util.HandleError(c, "Failed to create user")
			}
		} else {
			log.Printf("Database error: %v", err)
			return util.HandleError(c, "Database error")
		}
	} else {
		// User exists
		log.Printf("User already exists: %v", existingUser)
	}

	accessToken, err := h.UserService.CreateAccessToken(user, "")
	if err != nil {
		log.Printf("Failed to create access token: %v", err)
		return util.HandleError(c, "Failed to create access token")
	}
	refreshToken, err := h.UserService.CreateRefreshToken(user)
	if err != nil {
		log.Printf("Failed to create refresh token: %v", err)
		return util.HandleError(c, "Failed to create refresh token")
	}

	return c.JSON(fiber.Map{"accessToken": accessToken, "refreshToken": refreshToken})
}

func (h *UserHandler) RefreshAccessToken(c *fiber.Ctx) error {
	// Get the refresh token from the request body
	var requestBody struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := c.BodyParser(&requestBody); err != nil {
		return util.HandleError(c, "Invalid request body")
	}

	if requestBody.RefreshToken == "" {
		return util.HandleError(c, "Refresh token is required")
	}

	// Create a new access token from the refresh token
	accessToken, err := h.UserService.CreateAccessTokenFromRefreshToken(requestBody.RefreshToken)
	if err != nil {
		log.Printf("Failed to refresh token: %v", err)
		return util.HandleError(c, "Failed to refresh token")
	}

	return c.JSON(fiber.Map{"accessToken": accessToken})
}

func (h *UserHandler) GetUsersAttendedContests(c *fiber.Ctx) error {
	userId := c.Params("userId")
	if userId == "" {
		return util.HandleError(c, "User ID is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), requestTimeout)
	defer cancel()

	contests, err := h.UserService.GetUsersAttendedContests(ctx, userId)
	if err != nil {
		log.Printf("Error fetching user's attended contests: %v", err)
		return util.HandleError(c, "Failed to fetch user's attended contests")
	}

	return c.JSON(contests)
}
