package services

import (
	"backend/models"
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type SubmissionService struct {
	DB *gorm.DB
}

func NewSubmissionService(db *gorm.DB) *SubmissionService {
	return &SubmissionService{
		DB: db,
	}
}

func (s *SubmissionService) GetSubmissions(ctx context.Context) ([]models.Submission, error) {
	var submissions []models.Submission
	result := s.DB.Preload("TestCasesResults").Find(&submissions)
	if result.Error != nil {
		return nil, result.Error
	}
	return submissions, nil
}

func (s *SubmissionService) FindSubmissionByID(ctx context.Context, id string) (*models.Submission, error) {
	var submission models.Submission
	result := s.DB.Preload("TestCasesResults").First(&submission, "id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("submission not found")
		}
		return nil, result.Error
	}

	fmt.Printf("Submission found: %+v\n", submission)
	return &submission, nil
}

func (s *SubmissionService) GetSubmissionsByContestID(ctx context.Context, contestID string) ([]models.Submission, error) {
	var submissions []models.Submission
	result := s.DB.Preload("TestCasesResults").Where("contest_id = ?", contestID).Find(&submissions)
	if result.Error != nil {
		return nil, result.Error
	}
	return submissions, nil
}

func (s *SubmissionService) GetSubmissionsByOwnerID(ctx context.Context, ownerID string, contestID string) ([]models.Submission, error) {
	var submissions []models.Submission
	result := s.DB.Preload("TestCasesResults").Where("owner_id = ? AND contest_id = ?", ownerID, contestID).Find(&submissions)
	if result.Error != nil {
		return nil, result.Error
	}
	return submissions, nil
}

func (s *SubmissionService) CreateSubmission(ctx context.Context, submission *models.Submission) (*models.Submission, error) {
	result := s.DB.Create(submission)
	if result.Error != nil {
		return nil, result.Error
	}
	return submission, nil
}

func (s *SubmissionService) DeleteSubmission(ctx context.Context, id string) error {
	var submission models.Submission
	result := s.DB.Delete(&submission, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (s *SubmissionService) UpdateSubmission(ctx context.Context, id string, submission *models.Submission) error {
	var existingSubmission models.Submission
	result := s.DB.First(&existingSubmission, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}

	existingSubmission.ContestID = submission.ContestID
	existingSubmission.OwnerID = submission.OwnerID
	existingSubmission.Language = submission.Language
	existingSubmission.Status = submission.Status
	existingSubmission.CreatedAt = submission.CreatedAt

	result = s.DB.Save(&existingSubmission)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (s *SubmissionService) GetSubmissionByID(id string) (*models.Submission, error) {
	var submission models.Submission
	result := s.DB.First(&submission, "id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("submission not found")
		}
		return nil, result.Error
	}
	return &submission, nil
}

func (s *SubmissionService) GetContestTestCases(ctx context.Context, contestID string) ([]models.TestCase, error) {
	var contest models.Contest
	result := s.DB.Preload("TestCases").First(&contest, "id = ?", contestID)
	if result.Error != nil {
		return nil, result.Error
	}
	return contest.TestCases, nil
}

func (s *SubmissionService) GetContestTestFiles(ctx context.Context, contestID string) ([]byte, error) {
	var contest models.Contest
	result := s.DB.First(&contest, "id = ?", contestID)
	if result.Error != nil {
		return nil, result.Error
	}
	if contest.TestFiles == nil {
		return nil, nil
	}
	return *contest.TestFiles, nil
}
