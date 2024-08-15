package models

type TestCase struct {
	Input  string `json:"input"`
	Output string `json:"output"`
}

type Contest struct {
	ID          string `json:"id,omitempty" bson:"_id,omitempty"`
	Title       string `json:"title"`
	Description string `json:"description"`
	StartTime   string `json:"startTime"`
	EndTime     string `json:"endTime"`
	Prize       string `json:"prize,omitempty" bson:"prize,omitempty"`
	OwnerID    	string `json:"ownerID"`
	TestCases   []TestCase `json:"testCases"`
}
