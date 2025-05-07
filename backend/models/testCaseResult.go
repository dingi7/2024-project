package models

type TestCaseResult struct {
	ID               string  `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SubmissionID     string  `json:"-" gorm:"type:uuid;index"`
	TestCaseID       string  `json:"testCaseId" gorm:"type:uuid;column:test_case_id"`
	Passed           bool    `json:"status" gorm:"type:boolean"`
	SolutionOutput   *string `json:"solutionOutput" gorm:"type:text;column:solution_output"`
	ExpectedOutput   *string `json:"expectedOutput" gorm:"type:text;column:expected_output"`
	Input            *string `json:"input" gorm:"type:text;column:input"`
	MemoryUsage      int     `json:"memoryUsage" gorm:"type:int;column:memory_usage"`
	Time             int     `json:"time" gorm:"type:int"`
	Score            float64 `json:"score" gorm:"type:float"`
	CPUUsage         float64 `json:"cpuUsage" gorm:"type:float;column:cpu_usage"`
	MemoryUsageLimit int     `json:"memoryUsageLimit" gorm:"type:int;column:memory_usage_limit"`
	TimeLimit        int     `json:"timeLimit" gorm:"type:int;column:time_limit"`
	
}
