package handlers

import (
	"backend/services"
	"backend/util"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type LeaderboardHandler struct {
	LeaderboardService *services.LeaderboardService
}

func NewLeaderboardHandler(db *gorm.DB) *LeaderboardHandler {
	leaderboardService := services.NewLeaderboardService(db)
	return &LeaderboardHandler{
		LeaderboardService: leaderboardService,
	}
}

func (h *LeaderboardHandler) GetLeaderboard(c *fiber.Ctx) error {
	leaderboard, err := h.LeaderboardService.GetLeaderboard(c.Context())
	if err != nil {
		return util.HandleError(c, "Failed to fetch leaderboard")
	}
	return c.JSON(leaderboard)
}
