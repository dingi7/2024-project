package services

import (
	"backend/models"
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type UserService struct {
	UserCollection       *mongo.Collection
	ContestCollection    *mongo.Collection
	SubmissionCollection *mongo.Collection
}

func NewUserService(client *mongo.Client) *UserService {
	return &UserService{
		UserCollection:       client.Database("contestify").Collection("users"),
		ContestCollection:    client.Database("contestify").Collection("contests"),
		SubmissionCollection: client.Database("contestify").Collection("submissions"),
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
	// Log the contest IDs
	fmt.Println("Contest IDs for user", userID)
	for _, submission := range submissions {
		fmt.Printf("ContestID: %s\n", submission.ContestID)
	}

	// Create a slice to store unique contest IDs
	contestIDs := make(map[string]bool)
	for _, submission := range submissions {
		contestIDs[submission.ContestID] = true
	}

	// Create a slice to store the contests
	var contests []models.Contest

	// Iterate through unique contest IDs
	for contestID := range contestIDs {
		// Convert string ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(contestID)
		if err != nil {
			return nil, fmt.Errorf("invalid contest ID: %v", err)
		}

		// Find the contest by ID
		var contest models.Contest
		err = s.ContestCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&contest)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				// Skip this contest if it doesn't exist
				continue
			}
			return nil, fmt.Errorf("error fetching contest: %v", err)
		}

		// Add the contest to the slice
		contests = append(contests, contest)
	}

	return contests, nil
}
