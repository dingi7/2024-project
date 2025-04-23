package util

import (
	"log"

	"gorm.io/gorm"
)

func DropDatabase(db *gorm.DB) {
	// To drop all tables in PostgreSQL with GORM
	err := db.Exec("DROP SCHEMA public CASCADE").Error
	if err != nil {
		log.Fatal(err)
	}

	err = db.Exec("CREATE SCHEMA public").Error
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Database has been dropped successfully")
}

func DropTable(db *gorm.DB, tableName string) {
	// Drop a specific table
	err := db.Exec("DROP TABLE IF EXISTS " + tableName + " CASCADE").Error
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Table '%s' has been dropped successfully", tableName)
}
