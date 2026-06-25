package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	"github.com/anthropics/anthropic-sdk-go"
	anthropicoption "github.com/anthropics/anthropic-sdk-go/option"
	"github.com/gofiber/fiber/v2"
	"google.golang.org/api/option"

	"github.com/google/generative-ai-go/genai"

	"parser/config"
	"parser/internal/cache"
	"parser/internal/handler"
	"parser/internal/parser"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger) // routes log.* calls in config.go through slog

	cfg := config.Load()

	var p parser.Parser
	switch cfg.Provider {
	case config.ProviderAnthropic:
		client := anthropic.NewClient(anthropicoption.WithAPIKey(cfg.AnthropicAPIKey))
		p = parser.NewAnthropicParser(client)

	case config.ProviderGemini:
		client, err := genai.NewClient(context.Background(), option.WithAPIKey(cfg.GeminiAPIKey))
		if err != nil {
			logger.Error("failed to create Gemini client", "err", err)
			os.Exit(1)
		}
		p = parser.NewGeminiParser(client)

	case config.ProviderOllama:
		p = parser.NewOllamaParser(cfg.OllamaBaseURL, cfg.OllamaModel, cfg.OllamaNumCtx)
	}

	c, err := cache.New(cfg.CachePath)
	if err != nil {
		logger.Error("failed to open cache", "err", err)
		os.Exit(1)
	}
	defer c.Close()
	logger.Info("cache ready", "path", cfg.CachePath)

	h := handler.New(p, c, logger)

	app := fiber.New(fiber.Config{
		BodyLimit: 20 * 1024 * 1024, // 20 MB for PDF uploads
	})
	app.Use(requestLogger(logger))

	app.Post("/parse", h.Parse)
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "provider": string(cfg.Provider)})
	})

	logger.Info("parser service starting", "port", cfg.Port)
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
