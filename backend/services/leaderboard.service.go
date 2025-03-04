package services

import (
	"context"
	"sort"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type LeaderboardService struct {
	SubmissionCollection *mongo.Collection
	UserCollection       *mongo.Collection
}

func NewLeaderboardService(client *mongo.Client) *LeaderboardService {
	return &LeaderboardService{
		SubmissionCollection: client.Database("contestify").Collection("submissions"),
		UserCollection:       client.Database("contestify").Collection("users"),
	}
}

type LeaderboardEntry struct {
	UserID               string  `json:"userId"`
	Username             string  `json:"username"`
	TotalScore           float64 `json:"totalScore"`
	ContestsParticipated int     `json:"contestsParticipated"`
}

func (s *LeaderboardService) GetLeaderboard(ctx context.Context) ([]LeaderboardEntry, error) {
	pipeline := []bson.M{
		{
			"$group": bson.M{
				"_id": bson.M{
					"userId":    "$ownerId",
					"contestId": "$contestId",
				},
				"bestScore": bson.M{"$max": "$score"},
			},
		},
		{
			"$group": bson.M{
				"_id":                  "$_id.userId",
				"totalScore":           bson.M{"$sum": "$bestScore"},
				"contestsParticipated": bson.M{"$addToSet": "$_id.contestId"},
			},
		},
		{
			"$lookup": bson.M{
				"from":         "users",
				"localField":   "_id",
				"foreignField": "_id",
				"as":           "user",
			},
		},
		{
			"$unwind": "$user",
		},
		{
			"$project": bson.M{
				"userId":               "$_id",
				"username":             "$user.name",
				"totalScore":           1,
				"contestsParticipated": bson.M{"$size": "$contestsParticipated"},
			},
		},
	}

	cursor, err := s.SubmissionCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var leaderboard []LeaderboardEntry
	if err := cursor.All(ctx, &leaderboard); err != nil {
		return nil, err
	}

	sort.Slice(leaderboard, func(i, j int) bool {
		if leaderboard[i].TotalScore == leaderboard[j].TotalScore {
			return leaderboard[i].ContestsParticipated > leaderboard[j].ContestsParticipated
		}
		return leaderboard[i].TotalScore > leaderboard[j].TotalScore
	})

	return leaderboard, nil
}
