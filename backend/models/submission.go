package models

type Submission struct {
	ID        string  `json:"id,omitempty" bson:"_id,omitempty"`
	ContestID string  `json:"contestID" bson:"contestId" validate:"required"`
	OwnerID   string  `json:"userID" bson:"ownerId" validate:"required"`
	Code      string  `json:"code" validate:"required"`
	Status    bool    `json:"status" validate:"required"`
	Score     float64 `json:"score" bson:"score"`
	CreatedAt string  `json:"createdAt" bson:"createdAt" validate:"required"`
	Language  string  `json:"language"`
	IsRepo    bool    `json:"isRepo"`
}
