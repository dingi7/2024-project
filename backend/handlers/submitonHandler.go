package handlers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

var submissionsCollection *mongo.Collection

func InitSubmissionsCollection(client *mongo.Client) {
	submissionsCollection = client.Database("contestify").Collection("submissions")
}

func createSubmition(c *fiber.Ctx) error {
	payload := c.Body()
	fmt.Println("Request Payload:", payload)
	return c.SendString("Create submission")
}