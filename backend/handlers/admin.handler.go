package handlers

import (
	"backend/models"
	"backend/util"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func generateInviteToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func SendAdminInvite(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		type InviteRequest struct {
			Email string `json:"email"`
		}
		var req InviteRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
		}

		if req.Email == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Email required"})
		}

		token, err := generateInviteToken()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to generate invite token"})
		}

		// Store invite in DB
		invite := models.AdminInvite{
			Token:     token,
			Email:     req.Email,
			Used:      false,
			CreatedAt: time.Now(),
		}
		if err := db.Create(&invite).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to store invite"})
		}

		baseURL := os.Getenv("FRONTEND_URL")
		if baseURL == "" {
			baseURL = "http://localhost:3000" // fallback for dev
		}
		inviteLink := fmt.Sprintf("%s/accept-invite?token=%s", baseURL, token)

		err = util.SendAdminInviteEmail(req.Email, inviteLink)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to send invite"})
		}

		return c.JSON(fiber.Map{"message": "Admin invite sent"})
	}
}

func AcceptAdminInvite(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		type AcceptRequest struct {
			Token string `json:"token"`
		}
		var req AcceptRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
		}
		if req.Token == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Token required"})
		}

		// Find invite
		var invite models.AdminInvite
		if err := db.First(&invite, "token = ? AND used = ?", req.Token, false).Error; err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid or used invite token"})
		}

		// Get current user from context (assume middleware sets user email in c.Locals)
		email, ok := c.Locals("email").(string)
		if !ok || email == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Unauthorized: user email not found"})
		}

		if email != invite.Email {
			return c.Status(403).JSON(fiber.Map{"error": "This invite is not for your email"})
		}

		// Update user role to admin
		if err := db.Model(&models.User{}).Where("email = ?", email).Update("role", models.RoleAdmin).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to update user role"})
		}

		// Mark invite as used
		now := time.Now()
		if err := db.Model(&invite).Updates(map[string]interface{}{"used": true, "used_at": &now}).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to mark invite as used"})
		}

		return c.JSON(fiber.Map{"message": "You are now an admin!"})
	}
}
