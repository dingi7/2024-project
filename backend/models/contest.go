package models

import (
	"time"
)

type TestCase struct {
	Input  string `json:"input"`
	Output string `json:"output"`
}

type Contest struct {
	ID          string     `json:"id,omitempty" bson:"_id,omitempty"`
	Title       string     `json:"title" validate:"required"`
	Description string     `json:"description" validate:"required"`
	Language    string     `json:"language" validate:"required"`
	StartDate   time.Time  `json:"startDate" validate:"required"`
	EndDate     time.Time  `json:"endDate" validate:"required,gtfield=startDate"`
	Prize       string     `json:"prize,omitempty" bson:"prize,omitempty"`
	OwnerID     string     `json:"ownerID" validate:"required"`
	TestCases   []TestCase `json:"testCases" validate:"dive,required"`
}
