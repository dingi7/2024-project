package handlers

import (
	"backend/models"
	"backend/services"
	"context"
	"time"

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
	contest := new(models.Contest)
	if err := c.BodyParser(contest); err != nil {
		return err
	}
	// if err := util.ValidateStructFields(contest); err != nil {
	// 	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	// }

	// TODO: Validate contest fields
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := h.ContestService.CreateContest(ctx, contest); err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
	}

	return c.JSON(contest)
}
