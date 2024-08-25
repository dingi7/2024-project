package models 

type Submission struct {
	ID string `json:"id,omitempty" bson:"_id,omitempty"`
	ContestID string `json:"contestID" validate:"required"`
	OwnerID string `json:"userID" validate:"required"`
	Code string `json:"code" validate:"required"`
	Status string `json:"status" validate:"required"`
	CreatedAt string `json:"createdAt" validate:"required"`
	Language string   `json:"language"`
}