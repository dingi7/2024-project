package services

import (
	"backend/models"
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ContestService struct {
	ContestCollection *mongo.Collection
}

func NewContestService(client *mongo.Client) *ContestService {
	return &ContestService{
		ContestCollection: client.Database("contestify").Collection("contests"),
	}
}

func (s *ContestService) GetContests(ctx context.Context) ([]models.Contest, error) {
	var contests []models.Contest
	cursor, err := s.ContestCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	if err := cursor.All(ctx, &contests); err != nil {
		return nil, err
	}
	return contests, nil
}

func (s *ContestService) FindContestByID(ctx context.Context, id string) (*models.Contest, error) {
	fmt.Printf("ID: %s\n", id)
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		fmt.Printf("Error converting ID to ObjectID: %v\n", err)
		return nil, err
	}
	query := bson.M{"_id": objectID}
	fmt.Printf("Query: %v\n", query)
	var contest models.Contest
	err = s.ContestCollection.FindOne(ctx, query).Decode(&contest)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return nil, err
	}
	return &contest, nil
}

func (s *ContestService) CreateContest(ctx context.Context, contest *models.Contest) error {
	_, err := s.ContestCollection.InsertOne(ctx, contest)
	return err
}
