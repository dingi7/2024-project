package services

import (
	"backend/models"
	"context"
	"errors"
	"fmt"

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

func (s *ContestService) GetContests(ctx context.Context) ([]models.Contest, error) {
	var contests []models.Contest
	result := s.DB.Preload("TestCases").Find(&contests)
	if result.Error != nil {
		return nil, result.Error
	}
	return contests, nil
}

func (s *ContestService) FindContestByID(ctx context.Context, id string) (*models.Contest, error) {
	fmt.Printf("ID: %s\n", id)
	var contest models.Contest
	result := s.DB.Preload("TestCases").First(&contest, "id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("contest not found")
		}
		fmt.Printf("Error: %v\n", result.Error)
		return nil, result.Error
	}

	fmt.Printf("Contest: %v\n", contest.StartDate)
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
