package models

type TestCaseResult struct {
	TestCase       TestCase `json:"testCase"`
	Passed         bool     `json:"status"`
	SolutionOutput *string  `json:"SolutionOutput"`
	MemoryUsage    int      `json:"memoryUsage"`
	Time           int      `json:"time"`
}
