package services

import (
	"backend/models"
	"context"
	"errors"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
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
	// log the contest
	fmt.Printf("Contest: %v\n", contest.StartDate)
	return &contest, nil
}

func (s *ContestService) CreateContest(ctx context.Context, contest *models.Contest) error {
	_, err := s.ContestCollection.InsertOne(ctx, contest)
	return err
}

func (s *ContestService) DeleteContest(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	query := bson.M{"_id": objectID}
	_, err = s.ContestCollection.DeleteOne(ctx, query)
	return err
}

func (s *ContestService) UpdateContest(ctx context.Context, id string, contest *models.Contest) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	query := bson.M{"_id": objectID}
	update := bson.M{
		"$set": bson.M{
			"title":       contest.Title,
			"description": contest.Description,
			"language":    contest.Language,
			"startDate":   contest.StartDate,
			"endDate":     contest.EndDate,
			"prize":       contest.Prize,
			"ownerID":     contest.OwnerID,
			"testCases":   contest.TestCases,
			"contestRules": contest.ContestRules,
		},
	}
	_, err = s.ContestCollection.UpdateOne(ctx, query, update)
	return err
}

func (s *ContestService) AddTestCase(ctx context.Context, id string, testCase *models.TestCase) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	testCase.ID = primitive.NewObjectID()
	query := bson.M{"_id": objectID}
	update := bson.M{
		"$push": bson.M{
			"testCases": testCase,
		},
	}
	_, err = s.ContestCollection.UpdateOne(ctx, query, update)
	return err
}

func (s *ContestService) UpdateTestCase(ctx context.Context, id string, testCase *models.TestCase) error {
	// Convert the contest ID from hex to ObjectID
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	// Define the filter to locate the specific contest
	filter := bson.M{"_id": objectID}

	// Define the update to set the input and output of the specific test case
	update := bson.M{
		"$set": bson.M{
			"testCases.$[tc].input":  testCase.Input,
			"testCases.$[tc].output": testCase.Output,
		},
	}

	// Define array filters to target the specific test case by its ID
	arrayFilters := options.ArrayFilters{
		Filters: []interface{}{
			bson.M{"tc._id": testCase.ID},
		},
	}

	// Set the array filters option
	opts := options.Update().SetArrayFilters(arrayFilters)

	// Perform the update operation
	result, err := s.ContestCollection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return err
	}

	// Check if any document was modified
	if result.ModifiedCount == 0 {
		return errors.New("test case not found or no changes made")
	}

	return nil
}

func (s *ContestService) DeleteTestCase(ctx context.Context, id string, testCaseId string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	testCaseObjectID, err := primitive.ObjectIDFromHex(testCaseId)
	if err != nil {
		return err
	}
	query := bson.M{"_id": objectID}
	update := bson.M{
		"$pull": bson.M{
			"testCases": bson.M{"_id": testCaseObjectID},
		},
	}
	result, err := s.ContestCollection.UpdateOne(ctx, query, update)
	if err != nil {
		return err
	}
	if result.ModifiedCount == 0 {
		return errors.New("test case not found or not deleted")
	}
	return nil
}
