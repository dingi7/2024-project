package services

import (
	"backend/models"
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

const (
	AccessTokenExpiry  = 24 * time.Hour
	RefreshTokenExpiry = 7 * 24 * time.Hour
)

type UserService struct {
	DB            *gorm.DB
	JWTSecret     []byte
	RefreshSecret []byte
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{
		DB:            db,
		JWTSecret:     []byte(os.Getenv("ACCESS_TOKEN_SECRET")),
		RefreshSecret: []byte(os.Getenv("REFRESH_TOKEN_SECRET")),
	}
}

func (s *UserService) GetUsers(ctx context.Context) ([]models.User, error) {
	var users []models.User
	result := s.DB.Find(&users)
	if result.Error != nil {
		return nil, result.Error
	}
	return users, nil
}

func (s *UserService) FindUserByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	result := s.DB.Where("id = ?", id).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("user not found")
		}
		return nil, result.Error
	}
	return &user, nil
}

func (s *UserService) CreateUser(ctx context.Context, user *models.User) error {
	return s.DB.Create(user).Error
}

func (s *UserService) CreateAccessToken(user models.User, refreshToken string) (string, error) {
	if refreshToken != "" {
		valid, _, err := s.validateRefreshToken(refreshToken)
		if err != nil || !valid {
			return "", errors.New("invalid refresh token")
		}
	}

	claims := jwt.MapClaims{
		"id":           user.ID,
		"github_token": user.GitHubAccessToken,
		"exp":          time.Now().Add(AccessTokenExpiry).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	accessToken, err := token.SignedString(s.JWTSecret)
	if err != nil {
		return "", err
	}
	return accessToken, nil
}

func (s *UserService) GetUsersAttendedContests(ctx context.Context, userID string) ([]models.Contest, error) {
	var submissions []models.Submission
	result := s.DB.Find(&submissions, "owner_id = ?", userID)
	if result.Error != nil {
		return nil, result.Error
	}

	// Use a map to store unique contest IDs
	contestIDs := make(map[string]bool)
	for _, submission := range submissions {
		contestIDs[submission.ContestID] = true
	}

	var contests []models.Contest
	for contestID := range contestIDs {
		var contest models.Contest
		result := s.DB.First(&contest, "id = ?", contestID)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				continue
			}
			return nil, result.Error
		}
		contests = append(contests, contest)
	}

	return contests, nil
}

func (s *UserService) CreateRefreshToken(user models.User) (string, error) {
	claims := jwt.MapClaims{
		"id":           user.ID,
		"github_token": user.GitHubAccessToken,
		"exp":          time.Now().Add(RefreshTokenExpiry).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	refreshToken, err := token.SignedString(s.RefreshSecret)
	if err != nil {
		return "", err
	}
	return refreshToken, nil
}

func (s *UserService) CreateAccessTokenFromRefreshToken(refreshToken string) (string, error) {
	valid, userID, err := s.validateRefreshToken(refreshToken)
	if err != nil || !valid {
		return "", errors.New("invalid refresh token")
	}

	var user models.User
	result := s.DB.First(&user, "id = ?", userID)
	if result.Error != nil {
		return "", result.Error
	}

	return s.CreateAccessToken(user, refreshToken)
}

func (s *UserService) validateRefreshToken(refreshToken string) (bool, string, error) {
	token, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid token signing method")
		}
		return s.RefreshSecret, nil
	})
	if err != nil {
		return false, "", err
	}
	return token.Valid, token.Claims.(jwt.MapClaims)["id"].(string), nil
}

func (s *UserService) ValidateGitHubToken(token string) (bool, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK, nil
}

// FindUsersByEmail finds users by email address
func (s *UserService) FindUsersByEmail(ctx context.Context, email string) ([]models.User, error) {
	var users []models.User
	result := s.DB.Where("email = ?", email).Find(&users)
	if result.Error != nil {
		return nil, result.Error
	}
	return users, nil
}
