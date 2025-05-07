package services

import (
	"backend/models"
	"context"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type InvitationService struct {
	DB *gorm.DB
}

func NewInvitationService(db *gorm.DB) *InvitationService {
	return &InvitationService{
		DB: db,
	}
}

// CreateInvitation creates a new invitation for a user to join a contest
func (s *InvitationService) CreateInvitation(ctx context.Context, invitation *models.ContestInvitation) error {
	return s.DB.Create(invitation).Error
}

// GetInvitationsByContestID gets all invitations for a specific contest
func (s *InvitationService) GetInvitationsByContestID(ctx context.Context, contestID string) ([]models.ContestInvitation, error) {
	var invitations []models.ContestInvitation
	if err := s.DB.Where("contest_id = ?", contestID).Find(&invitations).Error; err != nil {
		return nil, err
	}
	return invitations, nil
}

// GetInvitationsByUserID gets all invitations for a specific user
func (s *InvitationService) GetInvitationsByUserID(ctx context.Context, userID string) ([]models.ContestInvitation, error) {
	var invitations []models.ContestInvitation
	if err := s.DB.Where("user_id = ?", userID).Find(&invitations).Error; err != nil {
		return nil, err
	}
	return invitations, nil
}

// GetInvitationsByUserEmail gets all invitations for a specific user email
func (s *InvitationService) GetInvitationsByUserEmail(ctx context.Context, email string) ([]models.ContestInvitation, error) {
	var invitations []models.ContestInvitation
	if err := s.DB.Where("user_email = ?", email).Find(&invitations).Error; err != nil {
		return nil, err
	}
	return invitations, nil
}

// GetInvitation gets a specific invitation by ID
func (s *InvitationService) GetInvitation(ctx context.Context, invitationID string) (*models.ContestInvitation, error) {
	var invitation models.ContestInvitation
	if err := s.DB.First(&invitation, "id = ?", invitationID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("invitation not found")
		}
		return nil, err
	}
	return &invitation, nil
}

// UpdateInvitationStatus updates the status of an invitation
func (s *InvitationService) UpdateInvitationStatus(ctx context.Context, invitationID string, status models.InvitationStatus) error {
	// Get the current time for response timestamp
	now := time.Now()

	result := s.DB.Model(&models.ContestInvitation{}).
		Where("id = ?", invitationID).
		Updates(map[string]interface{}{
			"status":      status,
			"response_at": now,
		})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("invitation not found")
	}

	return nil
}

// CancelInvitation cancels an invitation
func (s *InvitationService) CancelInvitation(ctx context.Context, invitationID string) error {
	return s.UpdateInvitationStatus(ctx, invitationID, models.InvitationStatusCancelled)
}

// UpdateInvitation updates an invitation in the database
func (s *InvitationService) UpdateInvitation(ctx context.Context, invitation *models.ContestInvitation) error {
	return s.DB.Save(invitation).Error
}
