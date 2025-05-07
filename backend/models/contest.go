package models

import (
	"time"
)

type TestCase struct {
	ID          string `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ContestID   string `json:"-" gorm:"type:uuid;index"`
	Input       string `json:"input" gorm:"type:text"`
	Output      string `json:"output" gorm:"type:text"`
	TimeLimit   int    `json:"timeLimit" gorm:"type:int"`
	MemoryLimit int    `json:"memoryLimit" gorm:"type:int"`
	Public      bool   `json:"public" gorm:"type:boolean"`
}

type Contest struct {
	ID                              string              `json:"id,omitempty" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Title                           string              `json:"title" validate:"required" gorm:"type:varchar(255);not null"`
	Description                     string              `json:"description" validate:"required" gorm:"type:text;not null"`
	Language                        string              `json:"language" validate:"required" gorm:"type:varchar(100);not null"`
	StartDate                       string              `json:"startDate" validate:"required" gorm:"type:varchar(100);column:start_date;not null"`
	EndDate                         string              `json:"endDate" validate:"required" gorm:"type:varchar(100);column:end_date;not null"`
	Prize                           string              `json:"prize,omitempty" gorm:"type:varchar(255)"`
	OwnerID                         string              `json:"ownerID" validate:"required" gorm:"type:varchar(255);column:owner_id;not null"`
	TestCases                       []TestCase          `json:"testCases" validate:"dive,required" gorm:"foreignKey:ContestID"`
	CreatedAt                       time.Time           `json:"createdAt" gorm:"autoCreateTime"`
	ContestRules                    *[]byte             `json:"contestRules" gorm:"type:bytea;column:contest_rules"`
	ContestStructure                *string             `json:"contestStructure,omitempty" gorm:"type:text;column:contest_structure"`
	TestFiles                       *[]byte             `json:"testFiles,omitempty" gorm:"type:bytea;column:test_files"`
	TestFramework                   *string             `json:"testFramework,omitempty" gorm:"type:varchar(100);column:test_framework"`
	EnableAICodeEntryIdentification bool                `json:"enableAICodeEntryIdentification" gorm:"type:boolean;column:enable_ai_code_entry_identification"`
	IsPublic                        bool                `json:"isPublic" gorm:"type:boolean"`
	InviteOnly                      bool                `json:"inviteOnly" gorm:"type:boolean"`
	InvitedUsers                    []ContestInvitation `json:"invitedUsers,omitempty" gorm:"foreignKey:ContestID"`
}
