package services

import (
	"backend/models"
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type SubmissionService struct {
	SubmissionCollection *mongo.Collection
	ContestCollection    *mongo.Collection
}

func NewSubmissionService(client *mongo.Client) *SubmissionService {
	return &SubmissionService{
		SubmissionCollection: client.Database("contestify").Collection("submissions"),
		ContestCollection:    client.Database("contestify").Collection("contests"),
	}
}

func (s *SubmissionService) GetSubmissions(ctx context.Context) ([]models.Submission, error) {
	var submissions []models.Submission
	cursor, err := s.SubmissionCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	if err := cursor.All(ctx, &submissions); err != nil {
		return nil, err
	}
	return submissions, nil
}

func (s *SubmissionService) FindSubmissionByID(ctx context.Context, id string) (*models.Submission, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var submission models.Submission
	err = s.SubmissionCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&submission)
	if err != nil {
		return nil, err
	}
	return &submission, nil
}

func (s *SubmissionService) CreateSubmission(ctx context.Context, submission *models.Submission) (*models.Submission, error) {


	_, err := s.SubmissionCollection.InsertOne(ctx, submission)
	return submission, err
}

func (s *SubmissionService) DeleteSubmission(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = s.SubmissionCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	return err
}

func (s *SubmissionService) UpdateSubmission(ctx context.Context, id string, submission *models.Submission) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	update := bson.M{
		"$set": bson.M{
			"contestID":  submission.ContestID,
			"ownerID":    submission.OwnerID,
			"language":   submission.Language,
			"status":     submission.Status,
			"createdAt":  submission.CreatedAt,
		},
	}
	_, err = s.SubmissionCollection.UpdateOne(ctx, bson.M{"_id": objectID}, update)
	return err
}

func (s *SubmissionService) GetSubmissionsByContestID(ctx context.Context, contestID string) ([]models.Submission, error) {
	var submissions []models.Submission
	cursor, err := s.SubmissionCollection.Find(ctx, bson.M{"contestID": contestID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	if err := cursor.All(ctx, &submissions); err != nil {
		return nil, err
	}
	return submissions, nil
}

func (s *SubmissionService) GetSubmissionsByOwnerID(ctx context.Context, ownerID string) ([]models.Submission, error) {
	var submissions []models.Submission
	cursor, err := s.SubmissionCollection.Find(ctx, bson.M{"ownerID": ownerID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	if err := cursor.All(ctx, &submissions); err != nil {
		return nil, err
	}
	return submissions, nil
}

func (s *SubmissionService) GetSubmissionsByContestIDAndOwnerID(ctx context.Context, contestID, ownerID string) ([]models.Submission, error) {
	fmt.Printf("Querying for contestID: %s, ownerID: %s\n", contestID, ownerID)

	filter := bson.M{
        "ownerid":   ownerID,
        "contestid": contestID,
    }
	var submissions []models.Submission
	cursor, err := s.SubmissionCollection.Find(ctx, filter)

	if err != nil {
		fmt.Printf("Error in Find: %v\n", err)
		return nil, err
	}
	defer cursor.Close(ctx)
	if err := cursor.All(ctx, &submissions); err != nil {
		fmt.Printf("Error in cursor.All: %v\n", err)
		return nil, err
	}
	fmt.Printf("Found %d submissions\n", len(submissions))
	return submissions, nil
}	

func (s *SubmissionService) GetContestTestCases(ctx context.Context, contestID string) ([]models.TestCase, error) {
	objectID, err := primitive.ObjectIDFromHex(contestID)
	if err != nil {
		return nil, err
	}
	query := bson.M{"_id": objectID}
	var contest models.Contest
	err = s.ContestCollection.FindOne(ctx, query).Decode(&contest)
	if err != nil {
		return nil, err
	}
	return contest.TestCases, nil
}