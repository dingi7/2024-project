package models

type Contest struct {
	ID          string `json:"id,omitempty" bson:"_id,omitempty"`
	Title       string `json:"title"`
	Description string `json:"description"`
	StartTime   string `json:"startTime"`
	EndTime     string `json:"endTime"`
	Prize       string `json:"prize,omitempty" bson:"prize,omitempty"`
	OwnerID    string `json:"ownerID"`
}
