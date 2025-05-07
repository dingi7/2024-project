package middlewares

import (
	"backend/services"
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func ContestAccessMiddleware(db *gorm.DB) fiber.Handler {
	contestService := services.NewContestService(db)

	return func(c *fiber.Ctx) error {
		// Get the contest ID from the request parameters
		contestID := c.Params("contestId")
		if contestID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Contest ID is required",
			})
		}

		// Get the user ID from the context (set by AuthMiddleware)
		userID := c.Locals("userID").(string)

		// Create a context with timeout
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// Check if the user has access to the contest
		hasAccess, err := contestService.CheckUserContestAccess(ctx, userID, contestID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to check contest access: " + err.Error(),
			})
		}

		if !hasAccess {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You do not have access to this contest",
			})
		}

		// User has access, continue to the next handler
		return c.Next()
	}
}
