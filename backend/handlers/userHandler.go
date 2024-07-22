package handlers

import (
    "context"
    "time"
    "backend/models"
    "github.com/gofiber/fiber/v3"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
)

var userCollection *mongo.Collection

func InitUserCollection(client *mongo.Client) {
    userCollection = client.Database("contestify").Collection("users")
}

func GetUsers(c fiber.Ctx) error {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    var users []models.User
    cursor, err := userCollection.Find(ctx, bson.M{})
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
    }
    defer cursor.Close(ctx)

    if err := cursor.All(ctx, &users); err != nil {
        return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
    }

    return c.JSON(users)
}

// Uncomment and fix CreateUser function as needed