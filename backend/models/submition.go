package models

type Submission struct {
	ID          string `json:"id,omitempty" bson:"_id,omitempty"`
	ContestID string `json:"contestID"`
	UserID      string `json:"userID"`
	Language    string `json:"language"`
	Code        string `json:"code"`
	Result      string `json:"result"`
}
