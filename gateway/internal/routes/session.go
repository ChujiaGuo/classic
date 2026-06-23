package routes

import (
	"gateway/config"
	"time"

	firebaseAuth "firebase.google.com/go/v4/auth"
	"github.com/gofiber/fiber/v2"
)

func SessionHandler(c *fiber.Ctx, cfg config.Config, authClient *firebaseAuth.Client) error {
	var body struct {
		IdToken string `json:"idToken"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}
	if body.IdToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "missing idToken"})
	}

	duration := 5 * 24 * time.Hour
	sessionCookie, err := authClient.SessionCookie(c.Context(), body.IdToken, duration)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "failed to create session"})
	}

	secure := cfg.Env == "production"
	c.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    sessionCookie,
		Expires:  time.Now().Add(duration),
		HTTPOnly: true,
		Secure:   secure,
		Path:     "/",
		SameSite: "None",
	})

	return c.JSON(fiber.Map{"message": "session created"})
}

func LogoutHandler(c *fiber.Ctx, cfg config.Config) error {
	secure := cfg.Env == "production"
	c.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
		Secure:   secure,
		Path:     "/",
		SameSite: "None",
	})
	return c.JSON(fiber.Map{"message": "logged out"})
}
