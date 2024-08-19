package models

type TestCase struct {
	Input  string `json:"input"`
	Output string `json:"output"`
}

type Contest struct {
	ID          string     `json:"id,omitempty" bson:"_id,omitempty"`
	Title       string     `json:"title" validate:"required"`
	Description string     `json:"description" validate:"required"`
	Language    string     `json:"language" validate:"required"`
	StartDate   string     `json:"startDate" validate:"required"`
	EndDate     string     `json:"endDate" validate:"required"`
	Prize       string     `json:"prize,omitempty" bson:"prize,omitempty"`
	OwnerID     string     `json:"ownerID" validate:"required"`
	TestCases   []TestCase `json:"testCases" validate:"dive,required"`
}
