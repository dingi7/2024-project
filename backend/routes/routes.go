package routes

import (
	"backend/handlers"
	"backend/middlewares"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

func Setup(app *fiber.App, client *mongo.Client) {

	// app.Use(middlewares.Logger())
	api := app.Group("/api/v1")

	userHandler := handlers.NewUserHandler(client)
	contestHandler := handlers.NewContestHandler(client)

	// public routes
	api.Post("/auth/signIn", userHandler.UserSignIn)

	// private routes
	api.Use(middlewares.AuthMiddleware)
	api.Post("/codeSubmit", handlers.CreateSubmition)
	api.Post("/createContest", contestHandler.CreateContest)

}
