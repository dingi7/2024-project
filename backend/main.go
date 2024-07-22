package main

import (
    "backend/config"
    "backend/handlers"
    "backend/routes"
    "github.com/gofiber/fiber/v2"
    "log"
)

func main() {
    client, err := config.InitDatabase()
    if err != nil {
        log.Fatal(err)
    }

    handlers.InitUserCollection(client)

    app := fiber.New()

    routes.Setup(app)

    app.Listen(":3001")
	log.Println("Server started on port 3000")
}