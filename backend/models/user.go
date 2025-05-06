package models

import "time"

type User struct {
	ID                string    `json:"id,omitempty" gorm:"primaryKey;type:varchar(255)"`
	Name              string    `json:"name" gorm:"type:varchar(255)"`
	Email             string    `json:"email" gorm:"type:varchar(255);uniqueIndex"`
	Provider          string    `json:"provider" gorm:"type:varchar(100)"`
	Image             string    `json:"image" gorm:"type:text"`
	GitHubAccessToken string    `json:"githubAccessToken" gorm:"type:text;column:github_access_token"`
	Role              string    `json:"role" gorm:"type:varchar(100)"`
	CreatedAt         time.Time `json:"createdAt" gorm:"autoCreateTime"`
}

const (
	RoleAdmin = "admin"
	RoleUser  = "user"
)

func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin
}

func (u *User) IsUser() bool {
	return u.Role == RoleUser
}