package services

import (
	"backend/models"
	"context"
	"errors"
	"fmt"
	"log"

	"gorm.io/gorm"
)

type ContestService struct {
	DB *gorm.DB
}

func NewContestService(db *gorm.DB) *ContestService {
	return &ContestService{
		DB: db,
	}
}

// GetContests returns all contests that are public or user has access to
func (s *ContestService) GetContests(ctx context.Context, userID string) ([]models.Contest, error) {
	var publicContests []models.Contest

	// First get all public contests
	if err := s.DB.Preload("TestCases").Where("is_public = ?", true).Find(&publicContests).Error; err != nil {
		return nil, err
	}

	// If no userID provided, return only public contests
	if userID == "" {
		return publicContests, nil
	}

	// Get contests where user is the owner
	var ownedContests []models.Contest
	if err := s.DB.Preload("TestCases").Where("owner_id = ?", userID).Find(&ownedContests).Error; err != nil {
		return nil, err
	}

	// Get private contests user has been invited to and accepted
	var invitedContestIDs []string
	if err := s.DB.Model(&models.ContestInvitation{}).
		Distinct("contest_id").
		Where("(user_id = ? OR user_email = (SELECT email FROM users WHERE id = ?)) AND status = ?",
			userID, userID, models.InvitationStatusAccepted).
		Pluck("contest_id", &invitedContestIDs).Error; err != nil {
		return nil, err
	}

	log.Printf("DEBUG: invitedContestIDs: %+v", invitedContestIDs)

	var invitedContests []models.Contest
	if len(invitedContestIDs) > 0 {
		if err := s.DB.Preload("TestCases").Where("id IN ? AND is_public = ?", invitedContestIDs, false).
			Find(&invitedContests).Error; err != nil {
			return nil, err
		}
	}

	// Combine and deduplicate contests
	allContests := append(publicContests, ownedContests...)
	allContests = append(allContests, invitedContests...)

	// Deduplicate contests using a map
	deduplicatedContests := make(map[string]models.Contest)
	for _, contest := range allContests {
		deduplicatedContests[contest.ID] = contest
	}

	// Convert back to slice
	result := make([]models.Contest, 0, len(deduplicatedContests))
	for _, contest := range deduplicatedContests {
		result = append(result, contest)
	}

	return result, nil
}

// CheckUserContestAccess checks if a user has access to a contest
func (s *ContestService) CheckUserContestAccess(ctx context.Context, userID string, contestID string) (bool, error) {
	// First get the contest
	var contest models.Contest
	if err := s.DB.First(&contest, "id = ?", contestID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, fmt.Errorf("contest not found")
		}
		return false, err
	}

	// If the contest is public, anyone has access
	if contest.IsPublic {
		return true, nil
	}

	// If no user ID is provided, and the contest is not public, deny access
	if userID == "" {
		log.Printf("DEBUG: userID is empty, denying access")
		return false, nil
	}

	// If user is the owner, they have access
	if contest.OwnerID == userID {
		return true, nil
	}

	// If the contest is invite-only, check for an invitation
	if contest.InviteOnly {
		log.Printf("DEBUG: contest is invite-only, checking for invitation")
		var invitation models.ContestInvitation
		result := s.DB.Where("contest_id = ? AND (user_id = ? OR user_email = (SELECT email FROM users WHERE id = ?))",
			contestID, userID, userID).First(&invitation)

		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				// No accepted invitation found
				return false, nil
			}
			return false, result.Error
		}

		// Accepted invitation found
		return true, nil
	}

	// If we got here, the contest is private but not invite-only,
	// which shouldn't happen in the current model, but we'll return false to be safe
	return false, nil
}

// FindContestByID finds a contest by ID and checks if the user has access
func (s *ContestService) FindContestByID(ctx context.Context, id string, userID string) (*models.Contest, error) {
	var contest models.Contest
	result := s.DB.Preload("TestCases").First(&contest, "id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("contest not found")
		}
		return nil, result.Error
	}

	// Check if the user has access to the contest
	hasAccess, err := s.CheckUserContestAccess(ctx, userID, id)
	if err != nil {
		return nil, err
	}

	if !hasAccess {
		return nil, fmt.Errorf("access denied")
	}

	return &contest, nil
}

func (s *ContestService) CreateContest(ctx context.Context, contest *models.Contest) error {
	return s.DB.Create(contest).Error
}

func (s *ContestService) EditContest(ctx context.Context, id string, contest *models.Contest) error {
	return s.DB.Model(&models.Contest{}).Where("id = ?", id).Updates(contest).Error
}

func (s *ContestService) DeleteContest(ctx context.Context, id string) error {
	return s.DB.Delete(&models.Contest{}, "id = ?", id).Error
}

func (s *ContestService) AddTestCase(ctx context.Context, contestID string, testCase *models.TestCase) error {
	testCase.ContestID = contestID
	return s.DB.Create(testCase).Error
}

func (s *ContestService) UpdateTestCase(ctx context.Context, testCase *models.TestCase) error {
	return s.DB.Save(testCase).Error
}

func (s *ContestService) DeleteTestCase(ctx context.Context, testCaseID string) error {
	return s.DB.Delete(&models.TestCase{}, "id = ?", testCaseID).Error
}

// GetUserOwnedContests returns all contests where the user is the owner
func (s *ContestService) GetUserOwnedContests(ctx context.Context, userID string) ([]models.Contest, error) {
	if userID == "" {
		return nil, fmt.Errorf("user ID is required")
	}

	var ownedContests []models.Contest
	if err := s.DB.Preload("TestCases").Where("owner_id = ?", userID).Find(&ownedContests).Error; err != nil {
		return nil, err
	}

	return ownedContests, nil
}

// GetUserInvitedContests returns all contests the user has been invited to
func (s *ContestService) GetUserInvitedContests(ctx context.Context, userID string) ([]models.Contest, error) {
	if userID == "" {
		return nil, fmt.Errorf("user ID is required")
	}

	// Get IDs of contests the user has been invited to
	var invitedContestIDs []string
	if err := s.DB.Model(&models.ContestInvitation{}).
		Distinct("contest_id").
		Where("(user_id = ? OR user_email = (SELECT email FROM users WHERE id = ?)) AND status = ?",
			userID, userID, models.InvitationStatusAccepted).
		Pluck("contest_id", &invitedContestIDs).Error; err != nil {
		return nil, err
	}

	// If no invitations found, return empty slice
	if len(invitedContestIDs) == 0 {
		return []models.Contest{}, nil
	}

	// Get the contests
	var invitedContests []models.Contest
	if err := s.DB.Preload("TestCases").
		Where("id IN ? AND owner_id != ?", invitedContestIDs, userID).
		Find(&invitedContests).Error; err != nil {
		return nil, err
	}

	return invitedContests, nil
}
