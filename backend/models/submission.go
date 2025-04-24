package models

type Submission struct {
	ID               string           `json:"id,omitempty" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ContestID        string           `json:"contestID" validate:"required" gorm:"type:uuid;column:contest_id;index;not null"`
	OwnerID          string           `json:"ownerID" validate:"required" gorm:"type:varchar(255);column:owner_id;not null"`
	OwnerName        string           `json:"ownerName,omitempty" gorm:"type:varchar(255);column:owner_name"`
	Code             string           `json:"code" validate:"required" gorm:"type:text;not null"`
	Status           bool             `json:"status" validate:"required" gorm:"type:boolean;not null"`
	Score            float64          `json:"score" gorm:"type:float"`
	CreatedAt        string           `json:"createdAt" validate:"required" gorm:"type:varchar(100);column:created_at;not null"`
	Language         string           `json:"language" gorm:"type:varchar(100)"`
	IsRepo           bool             `json:"isRepo" gorm:"type:boolean;column:is_repo"`
	TestCasesResults []TestCaseResult `json:"testCasesResults" gorm:"foreignKey:SubmissionID"`
	TotalTestCases   int              `json:"totalTestCases" gorm:"type:int;column:total_test_cases"`
	PassedTestCases  int              `json:"passedTestCases" gorm:"type:int;column:passed_test_cases"`
}
