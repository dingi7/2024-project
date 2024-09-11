package main

import (
	"backend/config"
	"backend/routes"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	client, err := config.InitDatabase()
	if err != nil {
		log.Fatal(err)
	}
	app := fiber.New()

	app.Use(logger.New())

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, access-control-allow-origin, Access-Control-Allow-Headers",
		AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
		AllowCredentials: true,
	}))

	routes.Setup(app, client)

	log.Println("Server starting on port 3001")
	if err := app.Listen(":3001"); err != nil {
		log.Fatal(err)
	}
}
