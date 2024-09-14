package handlers

import (
    "backend/services"
    "github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

type LeaderboardHandler struct {
    LeaderboardService *services.LeaderboardService
}

func NewLeaderboardHandler(client *mongo.Client) *LeaderboardHandler {
    leaderboardService := services.NewLeaderboardService(client)
    return &LeaderboardHandler{
        LeaderboardService: leaderboardService,
    }
}

func (h *LeaderboardHandler) GetLeaderboard(c *fiber.Ctx) error {
    leaderboard, err := h.LeaderboardService.GetLeaderboard(c.Context())
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch leaderboard"})
    }
    return c.JSON(leaderboard)
}