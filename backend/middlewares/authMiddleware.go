package middlewares

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(c *fiber.Ctx) error {
	// Get the Authorization header
	authHeader := c.Get("Authorization")

	// Check if the header is empty or doesn't start with "Bearer "
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Missing or invalid Authorization header",
		})
	}

	// Extract the token
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	// Parse and validate the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Make sure the signing method is correct
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.NewError(fiber.StatusUnauthorized, "Invalid token signing method")
		}

		// Return the secret key used to sign the token
		return []byte(os.Getenv("ACCESS_TOKEN_SECRET")), nil
	})

	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid or expired token",
		})
	}

	// Check if the token is valid
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		// You can access the claims here, e.g., user ID
		userID := claims["id"]

		// Add the user ID to the context for use in protected routes
		c.Locals("userID", userID)

		return c.Next()
	}

	return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
		"error": "Invalid token",
	})
}
