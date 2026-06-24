package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// CacheSchemaVersion must be bumped whenever the system prompt or ParsedSyllabus
// schema changes, so stale cache entries are not returned.
const CacheSchemaVersion = "1"

type Provider string

const (
	ProviderAnthropic Provider = "anthropic"
	ProviderGemini    Provider = "gemini"
	ProviderOllama    Provider = "ollama"
)

type Config struct {
	Port            string
	Env             string
	Provider        Provider
	AnthropicAPIKey string
	GeminiAPIKey    string
	OllamaBaseURL   string
	OllamaModel     string
	OllamaNumCtx    int
	CachePath       string
}

func Load() Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	anthropicKey := os.Getenv("ANTHROPIC_API_KEY")
	geminiKey := os.Getenv("GEMINI_API_KEY")

	ollamaBaseURL := os.Getenv("OLLAMA_BASE_URL")
	if ollamaBaseURL == "" {
		ollamaBaseURL = "http://localhost:11434"
	}
	ollamaModel := os.Getenv("OLLAMA_MODEL")
	if ollamaModel == "" {
		ollamaModel = "gemma4:12b"
	}
	ollamaNumCtx := 32768
	if v := os.Getenv("OLLAMA_NUM_CTX"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			ollamaNumCtx = n
		}
	}

	var provider Provider
	switch os.Getenv("PROVIDER") {
	case "ollama":
		provider = ProviderOllama
		log.Printf("Using Ollama (%s at %s)", ollamaModel, ollamaBaseURL)
	case "gemini":
		if geminiKey == "" {
			log.Fatal("PROVIDER=gemini but GEMINI_API_KEY is not set")
		}
		provider = ProviderGemini
		log.Println("Using Google Gemini (gemini-2.0-flash)")
	case "anthropic":
		if anthropicKey == "" {
			log.Fatal("PROVIDER=anthropic but ANTHROPIC_API_KEY is not set")
		}
		provider = ProviderAnthropic
		log.Println("Using Anthropic (Claude Opus 4.8)")
	default:
		switch {
		case anthropicKey != "":
			provider = ProviderAnthropic
			log.Println("Using Anthropic (Claude Opus 4.8)")
		case geminiKey != "":
			provider = ProviderGemini
			log.Println("Using Google Gemini (gemini-2.0-flash)")
		default:
			log.Fatal("Set ANTHROPIC_API_KEY, GEMINI_API_KEY, or PROVIDER=ollama")
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	cachePath := os.Getenv("CACHE_PATH")
	if cachePath == "" {
		cachePath = "./cache.db"
	}

	return Config{
		Port:            port,
		Env:             os.Getenv("ENV"),
		Provider:        provider,
		AnthropicAPIKey: anthropicKey,
		GeminiAPIKey:    geminiKey,
		OllamaBaseURL:   ollamaBaseURL,
		OllamaModel:     ollamaModel,
		OllamaNumCtx:    ollamaNumCtx,
		CachePath:       cachePath,
	}
}
