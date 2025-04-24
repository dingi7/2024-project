package handlers

import (
	"backend/models"
	"backend/services"
	"backend/util"
	"context"
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type InvitationHandler struct {
	InvitationService *services.InvitationService
	UserService       *services.UserService
	ContestService    *services.ContestService
}

func NewInvitationHandler(db *gorm.DB) *InvitationHandler {
	invitationService := services.NewInvitationService(db)
	userService := services.NewUserService(db)
	contestService := services.NewContestService(db)
	return &InvitationHandler{
		InvitationService: invitationService,
		UserService:       userService,
		ContestService:    contestService,
	}
}

// CreateInvitation handles creating a new invitation
func (h *InvitationHandler) CreateInvitation(c *fiber.Ctx) error {
	// Parse request body
	var request struct {
		ContestID string `json:"contestId" validate:"required"`
		UserEmail string `json:"userEmail" validate:"required,email"`
		ExpiresIn int    `json:"expiresIn"` // Optional: Number of days before expiration
	}

	if err := c.BodyParser(&request); err != nil {
		return util.HandleError(c, "Invalid request body")
	}

	// Verify that the contest exists and the current user is the owner
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get current user ID
	currentUserID := c.Locals("userID").(string)

	// Get the contest
	contest, err := h.ContestService.FindContestByID(ctx, request.ContestID, currentUserID)
	if err != nil {
		if err.Error() == "access denied" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You do not have access to this contest",
			})
		}
		return util.HandleError(c, "Contest not found")
	}

	// Verify that the current user is the owner of the contest
	if contest.OwnerID != currentUserID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only the contest owner can send invitations",
		})
	}

	// Verify that the contest is invite-only
	if !contest.InviteOnly {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "This contest is not invite-only",
		})
	}

	// Check if the user already has an invitation for this contest
	invitations, err := h.InvitationService.GetInvitationsByUserEmail(ctx, request.UserEmail)
	if err != nil {
		log.Printf("Error checking existing invitations: %v", err)
		return util.HandleError(c, "Error checking existing invitations")
	}

	for _, invitation := range invitations {
		if invitation.ContestID == request.ContestID &&
			invitation.Status == models.InvitationStatusPending {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "User already has a pending invitation for this contest",
			})
		}
	}

	// Create invitation
	invitation := &models.ContestInvitation{
		ID:        uuid.New().String(),
		ContestID: request.ContestID,
		UserEmail: request.UserEmail,
		InvitedBy: currentUserID,
		Status:    models.InvitationStatusPending,
		InvitedAt: time.Now(),
	}

	// Set expiration date if provided
	if request.ExpiresIn > 0 {
		expiresAt := time.Now().AddDate(0, 0, request.ExpiresIn)
		invitation.ExpiresAt = &expiresAt
	}

	// Check if user exists in the system
	existingUsers, err := h.UserService.FindUsersByEmail(ctx, request.UserEmail)
	if err == nil && len(existingUsers) > 0 {
		// If user exists, set the user ID
		invitation.UserID = existingUsers[0].ID
	}

	// Save the invitation
	if err := h.InvitationService.CreateInvitation(ctx, invitation); err != nil {
		log.Printf("Error creating invitation: %v", err)
		return util.HandleError(c, "Error creating invitation")
	}

	// In a real application, you might want to send an email notification to the user here

	return c.Status(fiber.StatusCreated).JSON(invitation)
}

// GetInvitationsForContest gets all invitations for a contest
func (h *InvitationHandler) GetInvitationsForContest(c *fiber.Ctx) error {
	contestID := c.Params("contestId")
	if contestID == "" {
		return util.HandleError(c, "Contest ID is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get current user ID
	currentUserID := c.Locals("userID").(string)

	// Check if the user has permission to view invitations
	contest, err := h.ContestService.FindContestByID(ctx, contestID, currentUserID)
	if err != nil {
		if err.Error() == "access denied" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You do not have access to this contest",
			})
		}
		return util.HandleError(c, "Contest not found")
	}

	// Only the contest owner can view all invitations
	if contest.OwnerID != currentUserID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only the contest owner can view invitations",
		})
	}

	invitations, err := h.InvitationService.GetInvitationsByContestID(ctx, contestID)
	if err != nil {
		log.Printf("Error fetching invitations: %v", err)
		return util.HandleError(c, "Error fetching invitations")
	}

	return c.JSON(invitations)
}

// GetInvitationsForUser gets all invitations for the current user
func (h *InvitationHandler) GetInvitationsForUser(c *fiber.Ctx) error {
	currentUserID := c.Locals("userID").(string)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get user info to fetch by both ID and email
	user, err := h.UserService.FindUserByID(ctx, currentUserID)
	if err != nil {
		return util.HandleError(c, "User not found")
	}

	// Get invitations by user ID
	invitationsById, err := h.InvitationService.GetInvitationsByUserID(ctx, currentUserID)
	if err != nil {
		log.Printf("Error fetching invitations by ID: %v", err)
		return util.HandleError(c, "Error fetching invitations")
	}

	// Get invitations by user email
	invitationsByEmail, err := h.InvitationService.GetInvitationsByUserEmail(ctx, user.Email)
	if err != nil {
		log.Printf("Error fetching invitations by email: %v", err)
		return util.HandleError(c, "Error fetching invitations")
	}

	// Merge and deduplicate invitations
	allInvitations := append(invitationsById, invitationsByEmail...)
	uniqueInvitations := make(map[string]*models.ContestInvitation)

	for i := range allInvitations {
		uniqueInvitations[allInvitations[i].ID] = &allInvitations[i]
	}

	// Convert back to slice
	result := make([]models.ContestInvitation, 0, len(uniqueInvitations))
	for _, invitation := range uniqueInvitations {
		result = append(result, *invitation)
	}

	return c.JSON(result)
}

// RespondToInvitation handles user responses to invitations (accept/reject)
func (h *InvitationHandler) RespondToInvitation(c *fiber.Ctx) error {
	invitationID := c.Params("invitationId")
	if invitationID == "" {
		return util.HandleError(c, "Invitation ID is required")
	}

	var request struct {
		Accept bool `json:"accept" validate:"required"`
	}

	if err := c.BodyParser(&request); err != nil {
		return util.HandleError(c, "Invalid request body")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get the invitation
	invitation, err := h.InvitationService.GetInvitation(ctx, invitationID)
	if err != nil {
		return util.HandleError(c, "Invitation not found")
	}

	// Check if the invitation has expired
	if invitation.ExpiresAt != nil && invitation.ExpiresAt.Before(time.Now()) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invitation has expired",
		})
	}

	// Check if the current user is the invited user
	currentUserID := c.Locals("userID").(string)
	currentUser, err := h.UserService.FindUserByID(ctx, currentUserID)
	if err != nil {
		return util.HandleError(c, "User not found")
	}

	// Verify that the invitation is for this user (by ID or email)
	if invitation.UserID != currentUserID && invitation.UserEmail != currentUser.Email {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "This invitation is not for you",
		})
	}

	// Update the invitation status based on the response
	var status models.InvitationStatus
	if request.Accept {
		status = models.InvitationStatusAccepted
	} else {
		status = models.InvitationStatusRejected
	}

	// If the invitation didn't have a user ID, but we now know the user, update it
	if invitation.UserID == "" && currentUserID != "" {
		invitation.UserID = currentUserID
		// Update the invitation in the database
		if err := h.InvitationService.UpdateInvitation(ctx, invitation); err != nil {
			log.Printf("Error updating invitation user ID: %v", err)
			// Continue despite error
		}
	}

	// Update the invitation status
	if err := h.InvitationService.UpdateInvitationStatus(ctx, invitationID, status); err != nil {
		log.Printf("Error updating invitation status: %v", err)
		return util.HandleError(c, "Error updating invitation")
	}

	return c.JSON(fiber.Map{
		"message":  fmt.Sprintf("Invitation %s successfully", status),
		"accepted": request.Accept,
	})
}

// CancelInvitation allows a contest owner to cancel an invitation
func (h *InvitationHandler) CancelInvitation(c *fiber.Ctx) error {
	invitationID := c.Params("invitationId")
	if invitationID == "" {
		return util.HandleError(c, "Invitation ID is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get the invitation
	invitation, err := h.InvitationService.GetInvitation(ctx, invitationID)
	if err != nil {
		return util.HandleError(c, "Invitation not found")
	}

	// Get current user ID
	currentUserID := c.Locals("userID").(string)

	// Get the contest to check ownership
	contest, err := h.ContestService.FindContestByID(ctx, invitation.ContestID, currentUserID)
	if err != nil {
		if err.Error() == "access denied" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You do not have access to this contest",
			})
		}
		return util.HandleError(c, "Contest not found")
	}

	// Verify that the current user is the contest owner
	if contest.OwnerID != currentUserID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only the contest owner can cancel invitations",
		})
	}

	// Cancel the invitation
	if err := h.InvitationService.CancelInvitation(ctx, invitationID); err != nil {
		log.Printf("Error cancelling invitation: %v", err)
		return util.HandleError(c, "Error cancelling invitation")
	}

	return c.JSON(fiber.Map{
		"message": "Invitation cancelled successfully",
	})
}
