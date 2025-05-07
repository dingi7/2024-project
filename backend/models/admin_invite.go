package models

import "time"

type AdminInvite struct {
	Token     string `gorm:"primaryKey"`
	Email     string
	Used      bool
	CreatedAt time.Time
	UsedAt    *time.Time
}
