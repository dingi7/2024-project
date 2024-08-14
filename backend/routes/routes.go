package routes

import (
	"backend/handlers"
	"backend/middlewares"

	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	app.Use(middlewares.Logger())
    api := app.Group("/api/v1")

	// public routes
    api.Post("/auth/signIn", handlers.UserSignIn)

	// private routes
	api.Use(middlewares.AuthMiddleware)
	api.Post("/submit", handlers)

}