package routes

import (
	"backend/handlers"
	"backend/middlewares"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

func Setup(app *fiber.App, client *mongo.Client) {

	api := app.Group("/api/v1")

	userHandler := handlers.NewUserHandler(client)
	contestHandler := handlers.NewContestHandler(client)
	submissionHandler := handlers.NewSubmissionHandler(client)
	leaderboardHandler := handlers.NewLeaderboardHandler(client)

	// public routes
	api.Post("/auth/signIn", userHandler.UserSignIn)
	api.Get("/contest", contestHandler.GetContests)
	api.Get("/leaderboard", leaderboardHandler.GetLeaderboard)

	// private routes
	api.Use(middlewares.AuthMiddleware)
	api.Post("/codeSubmit/:contestId", submissionHandler.CreateSubmission)
	api.Get("/submissions/:contestId", submissionHandler.GetSubmissionsByContestID)
	api.Get("/submissions/:contestId/:ownerId", submissionHandler.GetSubmissionsByOwnerID)
	api.Post("/contest", contestHandler.CreateContest)
	api.Get("/contest/:id", contestHandler.GetContestById)
	api.Put("/contest/:id", contestHandler.EditContest)
	api.Delete("/contest/:id", contestHandler.DeleteContest)
	api.Post("/contest/:id/TestCases", contestHandler.AddTestCase)
	api.Put("/contest/:id/TestCases", contestHandler.UpdateTestCase)
	api.Delete("/contest/:contestId/TestCases/:testCaseId", contestHandler.DeleteTestCase)
	
}
