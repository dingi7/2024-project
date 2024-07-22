package handlers

import (
	"backend/models"
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
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

	// Validate GitHub access token
	isValid, err := validateGitHubToken(user.GitHubAccessToken)
	if !isValid || err != nil {
		log.Printf("Invalid GitHub access token: %v", err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid GitHub access token"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check if user exists
	var existingUser models.User
	err = userCollection.FindOne(ctx, bson.M{"_id": user.ID}).Decode(&existingUser)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// User doesn't exist, create new user
			_, err = userCollection.InsertOne(ctx, user)
			if err != nil {
				log.Printf("Failed to create user: %v", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create user", "details": err.Error()})
			}
		} else {
			log.Printf("Database error: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error", "details": err.Error()})
		}
	} else {
		// User exists
		log.Printf("User already exists: %v", existingUser)
	}

	accessToken, err := CreateAccessToken(*user)
	if err != nil {
		log.Printf("Failed to create access token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create access token", "details": err.Error()})
	}

	return c.JSON(fiber.Map{"accessToken": accessToken})
}

func validateGitHubToken(token string) (bool, error) {
	// Validate the token with GitHub API
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, nil
	}

	return true, nil
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
