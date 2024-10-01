package handlers

import (
	"backend/models"
	"backend/services"
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

type UserHandler struct {
	UserService *services.UserService
}

func NewUserHandler(client *mongo.Client) *UserHandler {
	userService := services.NewUserService(client)
	return &UserHandler{
		UserService: userService,
	}
}

func (h *UserHandler) GetUsers(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	users, err := h.UserService.GetUsers(ctx)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
	}

	return c.JSON(users)
}

func (h *UserHandler) UserSignIn(c *fiber.Ctx) error {
	user := new(models.User)
	if err := c.BodyParser(user); err != nil {
		return err
	}

	// Validate GitHub access token
	isValid, err := validateGitHubToken(user.GitHubAccessToken)
	if !isValid || err != nil {
		log.Printf("Invalid GitHub access token: %v", err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid GitHub access token"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check if user exists
	existingUser, err := h.UserService.FindUserByID(ctx, user.ID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// User doesn't exist, create new user
			user.CreatedAt = time.Now() // Set the CreatedAt field
			if err := h.UserService.CreateUser(ctx, user); err != nil {
				log.Printf("Failed to create user: %v", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create user", "details": err.Error()})
			}
		} else {
			log.Printf("Database error: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error", "details": err.Error()})
		}
	} else {
		// User exists
		log.Printf("User already exists: %v", existingUser)
	}

	accessToken, err := h.UserService.CreateAccessToken(*user, "")
	if err != nil {
		log.Printf("Failed to create access token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create access token", "details": err.Error()})
	}
	refreshToken, err := h.UserService.CreateRefreshToken(*user)
	if err != nil {
		log.Printf("Failed to create refresh token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create refresh token", "details": err.Error()})
	}

	return c.JSON(fiber.Map{"accessToken": accessToken, "refreshToken": refreshToken})
}

func (h *UserHandler) RefreshAccessToken(c *fiber.Ctx) error {
	// Parse the request body
	var body struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Check if the refresh token is provided
	if body.RefreshToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Refresh token is required"})
	}

	// Use the parsed refresh token
	refreshToken := body.RefreshToken

	// Extract user ID from refresh token
	accessToken, err := h.UserService.CreateAccessTokenFromRefreshToken(refreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid refresh token"})
	}

	return c.JSON(fiber.Map{"accessToken": accessToken})
}

func validateGitHubToken(token string) (bool, error) {
	// Validate the token with GitHub API
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, nil
	}

	return true, nil
}
