package services

import (
	"backend/models"
	"context"

	"go.mongodb.org/mongo-driver/bson"
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
	var contest models.Contest
	err := s.ContestCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&contest)
	if err != nil {
		return nil, err
	}
	return &contest, nil
}

func (s *ContestService) CreateContest(ctx context.Context, contest *models.Contest) error {
	_, err := s.ContestCollection.InsertOne(ctx, contest)
	return err
}
