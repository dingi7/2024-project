package handlers

import (
	"backend/models"
	"context"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"time"
)

var userCollection *mongo.Collection

func InitUserCollection(client *mongo.Client) {
	userCollection = client.Database("contestify").Collection("users")
}

func GetUsers(c *fiber.Ctx) error {
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

func UserSignIn(c *fiber.Ctx) error {
	user := new(models.User)
	if err := c.BodyParser(user); err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check if user exists
	var existingUser models.User
	err := userCollection.FindOne(ctx, bson.M{"id": user.ID}).Decode(&existingUser)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// User doesn't exist, create new user
			_, err = userCollection.InsertOne(ctx, user)
			if err != nil {
				return c.Status(fiber.StatusInternalServerError).SendString("Failed to create user")
			}
		} else {
			return c.Status(fiber.StatusInternalServerError).SendString("Database error")
		}
	}

	accessToken, err := CreateAccessToken(*user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
	}
	return c.JSON(fiber.Map{"accessToken": accessToken})
}

func CreateAccessToken(user models.User) (string, error) {
	claims := jwt.MapClaims{
		"id":  user.ID,
		"exp": time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	JWT_SECRET := []byte("your_secret_key_here") // Replace with your actual secret key extract in .env file
	accessToken, err := token.SignedString(JWT_SECRET)
	if err != nil {
		return "", err
	}
	return accessToken, nil
}
