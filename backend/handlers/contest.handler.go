package handlers

import (
	"backend/models"
	"backend/services"
	"context"
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
	contest := new(models.Contest)
	if err := c.BodyParser(contest); err != nil {
		return err
	}
	if err := validateContest(contest); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := h.ContestService.CreateContest(ctx, contest); err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
	}

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



func validateContest(contest *models.Contest) error { // test this
	validate := validator.New()
	validate.RegisterValidation("datetime", func(fl validator.FieldLevel) bool {
		_, err := time.Parse(time.RFC3339, fl.Field().String())
		return err == nil
	})
	return validate.Struct(contest)
}
