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
	githubHandler := handlers.NewGitHubHandler()
	// public routes
	api.Post("/auth/signIn", userHandler.UserSignIn)
	api.Get("/contest", contestHandler.GetContests)
	api.Get("/leaderboard", leaderboardHandler.GetLeaderboard)
	api.Post("/auth/refresh", userHandler.RefreshAccessToken)

	// private routes
	api.Use(middlewares.AuthMiddleware)
	api.Post("/codeSubmit/:contestId", submissionHandler.CreateSubmission)
	api.Get("/submissions/:contestId", submissionHandler.GetSubmissionsByContestID)
	api.Get("/submissions/:contestId/:ownerId", submissionHandler.GetSubmissionsByOwnerID)
	api.Get("/submission/:id", submissionHandler.GetSubmissionByID)
	api.Post("/contest", contestHandler.CreateContest)
	api.Get("/contest/:id", contestHandler.GetContestById)
	api.Put("/contest/:id", contestHandler.EditContest)
	api.Delete("/contest/:id", contestHandler.DeleteContest)
	api.Post("/contest/:id/TestCases", contestHandler.AddTestCase)
	api.Put("/contest/:id/TestCases", contestHandler.UpdateTestCase)
	api.Delete("/contest/:contestId/TestCases/:testCaseId", contestHandler.DeleteTestCase)
	api.Get("/users/:userId/contests", userHandler.GetUsersAttendedContests)
	api.Post("/contest/github/createRepo", githubHandler.CreateRepositoryFromTemplate)
}
