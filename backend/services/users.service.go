package services

import (
	"backend/models"
	"context"
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

func (s *UserService) CreateAccessToken(user models.User) (string, error) {
	claims := jwt.MapClaims{
		"id":  user.ID,
		"exp": time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	JWT_SECRET := []byte("your_secret_key_here") // Replace with your actual secret key extract in .env file

	accessToken, err := token.SignedString(JWT_SECRET)
	if err != nil {
		return "", err
	}
	return accessToken, nil
}
