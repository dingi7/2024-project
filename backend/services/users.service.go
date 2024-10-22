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
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const (
	AccessTokenExpiry  = 24 * time.Hour
	RefreshTokenExpiry = 7 * 24 * time.Hour
)

type UserService struct {
	UserCollection       *mongo.Collection
	ContestCollection    *mongo.Collection
	SubmissionCollection *mongo.Collection
	JWTSecret            []byte
	RefreshSecret        []byte
}

func NewUserService(client *mongo.Client) *UserService {
	return &UserService{
		UserCollection:       client.Database("contestify").Collection("users"),
		ContestCollection:    client.Database("contestify").Collection("contests"),
		SubmissionCollection: client.Database("contestify").Collection("submissions"),
		JWTSecret:            []byte(os.Getenv("ACCESS_TOKEN_SECRET")),
		RefreshSecret:        []byte(os.Getenv("REFRESH_TOKEN_SECRET")),
	}
}

func (s *UserService) GetUsers(ctx context.Context) ([]models.User, error) {
	var users []models.User
	cursor, err := s.UserCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	if err := cursor.All(ctx, &users); err != nil {
		return nil, err
	}
	return users, nil
}

func (s *UserService) FindUserByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	err := s.UserCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *UserService) CreateUser(ctx context.Context, user *models.User) error {
	_, err := s.UserCollection.InsertOne(ctx, user)
	return err
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
	cursor, err := s.SubmissionCollection.Find(ctx, bson.M{"ownerId": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err := cursor.All(ctx, &submissions); err != nil {
		return nil, err
	}

	// Use a map to store unique contest IDs
	contestIDs := make(map[string]bool)
	for _, submission := range submissions {
		contestIDs[submission.ContestID] = true
	}

	var contests []models.Contest
	for contestID := range contestIDs {
		objectID, err := primitive.ObjectIDFromHex(contestID)
		if err != nil {
			return nil, fmt.Errorf("invalid contest ID: %v", err)
		}

		var contest models.Contest
		if err := s.ContestCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&contest); err != nil {
			if err != mongo.ErrNoDocuments {
				return nil, fmt.Errorf("error fetching contest: %v", err)
			}
			continue
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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	user, err := s.FindUserByID(ctx, userID)
	if err != nil {
		return "", err
	}

	return s.CreateAccessToken(*user, refreshToken)
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
