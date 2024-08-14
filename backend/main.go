package main

import (
    "backend/config"
    "backend/handlers"
    "backend/routes"
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/fiber/v2/middleware/logger"
    "log"
)

func main() {
    client, err := config.InitDatabase()
    if err != nil {
        log.Fatal(err)
    }
    handlers.InitUserCollection(client)

    app := fiber.New()

    // Add logger middleware
    app.Use(logger.New())

    // Configure CORS
    app.Use(cors.New(cors.Config{
        AllowOrigins: "http://localhost:3000",
        AllowHeaders: "Origin, Content-Type, Accept, Authorization, access-control-allow-origin, Access-Control-Allow-Headers",
        AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
        AllowCredentials: true,
    }))

    // // Log all incoming requests
    // app.Use(func(c *fiber.Ctx) error {
    //     log.Printf("Received %s request to %s", c.Method(), c.Path())
    //     return c.Next()
    // })

    routes.Setup(app)

    log.Println("Server starting on port 3001")
    if err := app.Listen(":3001"); err != nil {
        log.Fatal(err)
    }
}