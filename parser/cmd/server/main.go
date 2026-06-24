package main

import (
	"context"
	"log"

	"github.com/anthropics/anthropic-sdk-go"
	anthropicoption "github.com/anthropics/anthropic-sdk-go/option"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"

	"parser/config"
	"parser/internal/cache"
	"parser/internal/handler"
	"parser/internal/parser"
)

func main() {
	cfg := config.Load()

	var p parser.Parser
	switch cfg.Provider {
	case config.ProviderAnthropic:
		client := anthropic.NewClient(anthropicoption.WithAPIKey(cfg.AnthropicAPIKey))
		p = parser.NewAnthropicParser(client)

	case config.ProviderGemini:
		client, err := genai.NewClient(context.Background(), option.WithAPIKey(cfg.GeminiAPIKey))
		if err != nil {
			log.Fatalf("Failed to create Gemini client: %v", err)
		}
		p = parser.NewGeminiParser(client)

	case config.ProviderOllama:
		p = parser.NewOllamaParser(cfg.OllamaBaseURL, cfg.OllamaModel, cfg.OllamaNumCtx)
	}

	c, err := cache.New(cfg.CachePath)
	if err != nil {
		log.Fatalf("Failed to open cache: %v", err)
	}
	defer c.Close()
	log.Printf("Cache: %s", cfg.CachePath)

	h := handler.New(p, c)

	app := fiber.New(fiber.Config{
		BodyLimit: 20 * 1024 * 1024, // 20 MB for PDF uploads
	})
	app.Use(logger.New())

	app.Post("/parse", h.Parse)
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "provider": string(cfg.Provider)})
	})

	log.Printf("Parser service running on port %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
