package models

type User struct {
	ID    string `json:"id,omitempty" bson:"_id,omitempty"`
	Name  string `json:"name"`
	Email string `json:"email"`
}
