package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TestCase struct {
	ID          primitive.ObjectID `json:"id" bson:"_id"`
	Input       string             `json:"input"`
	Output      string             `json:"output"`
	TimeLimit   int                `json:"timeLimit"`
	MemoryLimit int                `json:"memoryLimit"`
	Public      bool               `json:"public"`
}

type Contest struct {
	ID               string     `json:"id,omitempty" bson:"_id,omitempty"`
	Title            string     `json:"title" validate:"required"`
	Description      string     `json:"description" validate:"required"`
	Language         string     `json:"language" validate:"required"`
	StartDate        string     `json:"startDate" bson:"startDate" validate:"required"`
	EndDate          string     `json:"endDate" bson:"endDate" validate:"required"`
	Prize            string     `json:"prize,omitempty" bson:"prize,omitempty"`
	OwnerID          string     `json:"ownerID" bson:"ownerId" validate:"required"`
	TestCases        []TestCase `json:"testCases" bson:"testCases" validate:"dive,required"`
	CreatedAt        time.Time  `json:"createdAt" bson:"createdAt"`
	ContestRules     []byte     `json:"contestRules" bson:"contestRules"`
	ContestStructure *string    `json:"contestStructure,omitempty" bson:"contestStructure,omitempty"`
	TestFiles        []byte     `json:"testFiles" bson:"testFiles"`
	TestFramework    *string    `json:"testFramework,omitempty" bson:"testFramework,omitempty"`
}
