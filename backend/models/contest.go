package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TestCase struct {
	ID     primitive.ObjectID `json:"id" bson:"_id"`
	Input  string             `json:"input"`
	Output string             `json:"output"`
}

type Contest struct {
	ID          string     `json:"id,omitempty" bson:"_id,omitempty"`
	Title       string     `json:"title" validate:"required"`
	Description string     `json:"description" validate:"required"`
	Language    string     `json:"language" validate:"required"`
	StartDate   string     `json:"startDate" validate:"required"`
	EndDate     string     `json:"endDate" validate:"required"`
	Prize       string     `json:"prize,omitempty" bson:"prize,omitempty"`
	OwnerID     string     `json:"ownerID" bson:"ownerid" validate:"required"`
	TestCases   []TestCase `json:"testCases" bson:"testCases" validate:"dive,required"`
	CreatedAt   time.Time  `json:"createdAt" bson:"createdAt"`
}
