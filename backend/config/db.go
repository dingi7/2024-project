package config

import (
	"backend/models"
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDatabase() (*gorm.DB, error) {
	// Create a PostgreSQL connection string
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	// Configure GORM logger
	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second, // Slow SQL threshold
			LogLevel:                  logger.Info, // Log level
			IgnoreRecordNotFoundError: true,        // Ignore ErrRecordNotFound error for logger
			ParameterizedQueries:      true,        // Don't include params in the SQL log
			Colorful:                  true,        // Enable color
		},
	)

	// Connect to the database
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		log.Println("Error connecting to PostgreSQL!")
		return nil, err
	}

	// Get generic database object from GORM
	sqlDB, err := db.DB()
	if err != nil {
		log.Println("Error getting generic database object!")
		return nil, err
	}

	// Set connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Store the DB instance globally
	DB = db
	log.Println("Connected to PostgreSQL!")
	return db, nil
}

// MigrateDatabase runs database migrations for all models
func MigrateDatabase() error {
	log.Println("Running database migrations...")
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}

	// Run migrations for all models
	return DB.AutoMigrate(
		&models.User{},
		&models.Contest{},
		&models.TestCase{},
		&models.Submission{},
		&models.TestCaseResult{},
		&models.Solution{},
	)
}
