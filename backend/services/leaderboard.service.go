package services

import (
	"backend/models"
	"context"
	"sort"

	"gorm.io/gorm"
)

type LeaderboardService struct {
	DB *gorm.DB
}

func NewLeaderboardService(db *gorm.DB) *LeaderboardService {
	return &LeaderboardService{
		DB: db,
	}
}

type LeaderboardEntry struct {
	UserID               string  `json:"userId"`
	Username             string  `json:"username"`
	TotalScore           float64 `json:"totalScore"`
	ContestsParticipated int     `json:"contestsParticipated"`
}

func (s *LeaderboardService) GetLeaderboard(ctx context.Context) ([]LeaderboardEntry, error) {
	// Query all submissions with preloaded users
	var submissions []models.Submission
	if err := s.DB.Find(&submissions).Error; err != nil {
		return nil, err
	}

	// Query all users to get usernames
	var users []models.User
	if err := s.DB.Find(&users).Error; err != nil {
		return nil, err
	}

	// Map to store user data
	userMap := make(map[string]string)
	for _, user := range users {
		userMap[user.ID] = user.Name
	}

	// Calculate scores per user
	userScores := make(map[string]float64)
	userContestCounts := make(map[string]map[string]bool)

	for _, submission := range submissions {
		// Initialize user contest map if needed
		if userContestCounts[submission.OwnerID] == nil {
			userContestCounts[submission.OwnerID] = make(map[string]bool)
		}

		// Add this contest to the user's participated contests
		userContestCounts[submission.OwnerID][submission.ContestID] = true

		// Add to the user's total score
		userScores[submission.OwnerID] += submission.Score
	}

	// Create leaderboard entries
	var leaderboard []LeaderboardEntry
	for userID, totalScore := range userScores {
		leaderboard = append(leaderboard, LeaderboardEntry{
			UserID:               userID,
			Username:             userMap[userID],
			TotalScore:           totalScore,
			ContestsParticipated: len(userContestCounts[userID]),
		})
	}

	// Sort the leaderboard by total score (descending)
	sort.Slice(leaderboard, func(i, j int) bool {
		return leaderboard[i].TotalScore > leaderboard[j].TotalScore
	})

	return leaderboard, nil
}
