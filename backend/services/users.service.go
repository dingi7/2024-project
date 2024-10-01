package services

import (
	"backend/models"
	"context"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type UserService struct {
	UserCollection *mongo.Collection
}

func NewUserService(client *mongo.Client) *UserService {
	return &UserService{
		UserCollection: client.Database("contestify").Collection("users"),
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
		if err != nil {
			return "", err
		}
		if !valid {
			return "", errors.New("invalid refresh token")
		}
	}

	claims := jwt.MapClaims{
		"id":  user.ID,
		"exp": time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	JWT_SECRET := []byte(os.Getenv("ACCESS_TOKEN_SECRET"))

	accessToken, err := token.SignedString(JWT_SECRET)
	if err != nil {
		return "", err
	}
	return accessToken, nil
}

func (s *UserService) CreateRefreshToken(user models.User) (string, error) {
	claims := jwt.MapClaims{
		"id":  user.ID,
		"exp": time.Now().Add(time.Hour * 24 * 7).Unix(), // Token expires in 7 days
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	JWT_SECRET := []byte(os.Getenv("REFRESH_TOKEN_SECRET"))

	refreshToken, err := token.SignedString(JWT_SECRET)
	if err != nil {
		return "", err
	}
	return refreshToken, nil
}

func (s *UserService) CreateAccessTokenFromRefreshToken(refreshToken string) (string, error) {
	valid, userID, err := s.validateRefreshToken(refreshToken)
	if err != nil {
		return "", err
	}
	if !valid {
		return "", errors.New("invalid refresh token")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	user, err := s.FindUserByID(ctx, userID)
	if err != nil {
		return "", err
	}
	newAccessToken, err := s.CreateAccessToken(*user, refreshToken)
	if err != nil {
		return "", err
	}
	return newAccessToken, nil
}

func (s *UserService) validateRefreshToken(refreshToken string) (bool,string, error) {
	token, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid token signing method")
		}
		return []byte(os.Getenv("REFRESH_TOKEN_SECRET")), nil
	})
	if err != nil {
		return false, "", err
	}
	return token.Valid, token.Claims.(jwt.MapClaims)["id"].(string), nil
}
