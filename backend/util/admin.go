package util

import (
	"backend/models"
	"log"

	"gorm.io/gorm"
)

var adminEmails = []string{
	"kamenkanev88@gmail.com",
	"bgtrak@gmail.com",
}

// EnsureAdminUsers checks if users with adminEmails exist and sets their role to admin if not already
func EnsureAdminUsers(db *gorm.DB) {
	for _, email := range adminEmails {
		var user models.User
		result := db.Where("email = ?", email).First(&user)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				log.Printf("Admin user with email %s not found in DB", email)
				continue
			}
			log.Printf("Error querying user %s: %v", email, result.Error)
			continue
		}
		if user.Role != models.RoleAdmin {
			user.Role = models.RoleAdmin
			if err := db.Save(&user).Error; err != nil {
				log.Printf("Failed to update user %s to admin: %v", email, err)
			} else {
				log.Printf("User %s promoted to admin", email)
			}
		} else {
			log.Printf("User %s is already admin", email)
		}
	}
}
