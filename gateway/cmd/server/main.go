package main

import (
	"gateway/config"
	"gateway/internal/auth"
	"gateway/internal/routes"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	cfg := config.Load()                 // Load Configs
	authClient := auth.InitFirebase(cfg) // Initialize Firebase Auth
	app := fiber.New()                   // Initialize Fiber
	app.Use(logger.New())                // Logging
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.WebpageURL,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept",
		AllowCredentials: true,
	}))
	routes.Setup(app, cfg, authClient) // Mount routes

	// Start server
	log.Printf("API Gateway running on port %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
