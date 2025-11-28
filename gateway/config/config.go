package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Env                          string
	GoogleApplicationCredentials string
	Port                         string
	WebpageURL                   string
}

func Load() Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := Config{
		Env:                          os.Getenv("ENV"),
		GoogleApplicationCredentials: os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"),
		Port:                         os.Getenv("PORT"),
		WebpageURL:                   os.Getenv("WEBPAGE_URL"),
	}

	if cfg.GoogleApplicationCredentials == "" {
		log.Fatal("Missing Google Authentication Token")
	}

	if _, err := os.Stat(cfg.GoogleApplicationCredentials); os.IsNotExist(err) {
		log.Fatalf("Google service account JSON not found at path: %s", cfg.GoogleApplicationCredentials)
	}

	return cfg
}
