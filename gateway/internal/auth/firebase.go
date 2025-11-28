package auth

import (
	"context"
	"log"

	"gateway/config"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

func InitFirebase(cfg config.Config) *auth.Client {
	ctx := context.Background()

	opt := option.WithCredentialsFile(cfg.GoogleApplicationCredentials)

	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		log.Fatalf("Failed to initialize Firebase app: %v", err)
	}

	client, err := app.Auth(ctx)
	if err != nil {
		log.Fatalf("Failed to get Firebase Auth client: %v", err)
	}

	return client
}
