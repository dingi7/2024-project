package models

import (
	"time"
)

type InvitationStatus string

const (
	InvitationStatusPending   InvitationStatus = "pending"
	InvitationStatusAccepted  InvitationStatus = "accepted"
	InvitationStatusRejected  InvitationStatus = "rejected"
	InvitationStatusCancelled InvitationStatus = "cancelled"
)

type ContestInvitation struct {
	ID         string           `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ContestID  string           `json:"contestId" gorm:"type:uuid;index;not null"`
	UserID     string           `json:"userId" gorm:"type:varchar(255);not null"`
	UserEmail  string           `json:"userEmail" gorm:"type:varchar(255);not null"`
	Status     InvitationStatus `json:"status" gorm:"type:varchar(50);not null;default:'pending'"`
	InvitedBy  string           `json:"invitedBy" gorm:"type:varchar(255);not null"` // ID of the user who sent the invitation
	InvitedAt  time.Time        `json:"invitedAt" gorm:"not null;autoCreateTime"`
	ResponseAt *time.Time       `json:"responseAt" gorm:"default:null"` // When the user responded to the invitation
	ExpiresAt  *time.Time       `json:"expiresAt" gorm:"default:null"`  // Optional expiration time for the invitation
}
