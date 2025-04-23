package models

import "time"

type User struct {
	ID                string    `json:"id,omitempty" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name              string    `json:"name" gorm:"type:varchar(255)"`
	Email             string    `json:"email" gorm:"type:varchar(255);uniqueIndex"`
	Provider          string    `json:"provider" gorm:"type:varchar(100)"`
	Image             string    `json:"image" gorm:"type:text"`
	GitHubAccessToken string    `json:"githubAccessToken" gorm:"type:text;column:github_access_token"`
	CreatedAt         time.Time `json:"createdAt" gorm:"autoCreateTime"`
}
