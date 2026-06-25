package main

import (
	"log/slog"
	"os"
	"time"

	"gateway/config"
	"gateway/internal/auth"
	"gateway/internal/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger) // routes log.* calls in config.go and firebase.go through slog

	cfg := config.Load()
	authClient := auth.InitFirebase(cfg)

	app := fiber.New(fiber.Config{
		BodyLimit: 25 * 1024 * 1024, // 25 MB to pass PDF uploads through to the parser
	})
	app.Use(requestLogger(logger))
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.WebpageURL,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept",
		AllowCredentials: true,
	}))
	routes.Setup(app, cfg, authClient)

	logger.Info("gateway starting", "port", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		logger.Error("server stopped", "err", err)
		os.Exit(1)
	}
}

func requestLogger(logger *slog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		logger.Info("request",
			"status", c.Response().StatusCode(),
			"method", c.Method(),
			"path", c.Path(),
			"ip", c.IP(),
			"latency", time.Since(start).String(),
		)
		return err
	}
}
