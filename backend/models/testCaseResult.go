package models

type TestCaseResult struct {
	ID             string  `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SubmissionID   string  `json:"-" gorm:"type:uuid;index"`
	TestCaseID     string  `json:"testCaseId" gorm:"type:uuid;column:test_case_id"`
	Passed         bool    `json:"status" gorm:"type:boolean"`
	SolutionOutput *string `json:"solutionOutput" gorm:"type:text;column:solution_output"`
	MemoryUsage    int     `json:"memoryUsage" gorm:"type:int;column:memory_usage"`
	Time           int     `json:"time" gorm:"type:int"`
	Score          float64 `json:"score" gorm:"type:float"`
}
