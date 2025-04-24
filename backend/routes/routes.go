package routes

import (
	"backend/handlers"
	"backend/middlewares"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func Setup(app *fiber.App, db *gorm.DB) {
	api := app.Group("/api/v1")

	userHandler := handlers.NewUserHandler(db)
	contestHandler := handlers.NewContestHandler(db)
	submissionHandler := handlers.NewSubmissionHandler(db)
	leaderboardHandler := handlers.NewLeaderboardHandler(db)
	githubHandler := handlers.NewGitHubHandler()
	invitationHandler := handlers.NewInvitationHandler(db)

	// public routes
	api.Post("/auth/signIn", userHandler.UserSignIn)
	api.Get("/contest", contestHandler.GetContests)
	api.Get("/leaderboard", leaderboardHandler.GetLeaderboard)
	api.Post("/auth/refresh", userHandler.RefreshAccessToken)

	// private routes
	api.Use(middlewares.AuthMiddleware)

	// Contest creation and management (no access check needed)
	api.Post("/contest", contestHandler.CreateContest)
	api.Get("/users/:userId/contests", userHandler.GetUsersAttendedContests)
	api.Post("/contest/github/createRepo", githubHandler.CreateRepositoryFromTemplate)

	// Specific contest routes (needs access check)
	contestAccess := middlewares.ContestAccessMiddleware(db)

	// Get contest by ID - Need special handling as it's used to check if user has access
	api.Get("/contest/:id", contestHandler.GetContestById)

	// Routes that require contest access
	api.Post("/codeSubmit/:contestId", contestAccess, submissionHandler.CreateSubmission)
	api.Get("/submissions/:contestId", contestAccess, submissionHandler.GetSubmissionsByContestID)
	api.Get("/submissions/:contestId/:ownerId", contestAccess, submissionHandler.GetSubmissionsByOwnerID)

	// Contest management routes - only owner can access (checked in handlers)
	api.Put("/contest/:id", contestHandler.EditContest)
	api.Delete("/contest/:id", contestHandler.DeleteContest)
	api.Post("/contest/:id/TestCases", contestHandler.AddTestCase)
	api.Put("/contest/:contestId/TestCases", contestHandler.UpdateTestCase)
	api.Delete("/contest/:contestId/TestCases/:testCaseId", contestHandler.DeleteTestCase)

	// Get submission by ID doesn't need contest access middleware (checked in handler)
	api.Get("/submission/:id", submissionHandler.GetSubmissionByID)

	// invitation routes
	api.Post("/contest/:contestId/invitations", invitationHandler.CreateInvitation)
	api.Get("/contest/:contestId/invitations", invitationHandler.GetInvitationsForContest)
	api.Get("/invitations", invitationHandler.GetInvitationsForUser)
	api.Put("/invitation/:invitationId/respond", invitationHandler.RespondToInvitation)
	api.Delete("/invitation/:invitationId", invitationHandler.CancelInvitation)
}
