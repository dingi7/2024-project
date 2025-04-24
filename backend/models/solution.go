package models

// Solution represents a code solution submitted by a user
type Solution struct {
	Language string
	Code     string
	Input    string `json:"input,omitempty"` // Optional input for the solution
}
