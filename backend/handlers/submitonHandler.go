package handlers

import (
	"backend/operations"
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

type Submission struct {
	Language string `json:"language"`
	Code     string `json:"code"`
	Input  []string `json:"input"`
	Output []string `json:"output"`
}

var submissionsCollection *mongo.Collection

func InitSubmissionsCollection(client *mongo.Client) {
	submissionsCollection = client.Database("contestify").Collection("submissions")
}

func CreateSubmition(c *fiber.Ctx) error {
	var payload Submission
	err := json.NewDecoder(bytes.NewReader(c.Body())).Decode(&payload)
	if err != nil {
		// handle error
		fmt.Println("Error:", err)
	}
	var output, _ = operations.RunTestCases(payload.Language, payload.Code)
	return c.SendString(output)
}
