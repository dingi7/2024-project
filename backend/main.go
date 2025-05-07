package main

import (
	"backend/config"
	"backend/routes"
	"log"

	"backend/util"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// Initialize PostgreSQL database with GORM
	db, err := config.InitDatabase()
	if err != nil {
		log.Fatal(err)
	}

	// Run database migrations
	if err := config.MigrateDatabase(); err != nil {
		log.Fatalf("Database migration failed: %v", err)
	}

	// Ensure admin users are set
	util.EnsureAdminUsers(db)

	app := fiber.New()

	app.Use(logger.New())

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, access-control-allow-origin, Access-Control-Allow-Headers",
		AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
		// AllowCredentials: true,
		AllowCredentials: false,
	}))

	routes.Setup(app, db)

	log.Println("Server starting on port 3001")
	if err := app.Listen(":3001"); err != nil {
		log.Fatal(err)
	}
}
