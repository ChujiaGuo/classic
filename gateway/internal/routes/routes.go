package routes

import (
	"gateway/config"
	"gateway/internal/auth"
	"time"

	firebaseAuth "firebase.google.com/go/v4/auth"
	"github.com/gofiber/fiber/v2"
)

// Setup mounts routes and attaches proxy handlers
func Setup(app *fiber.App, cfg config.Config, authClient *firebaseAuth.Client) {
	app.Post("/api/session", func(c *fiber.Ctx) error { return SessionHandler(c, cfg, authClient) })
	app.Post("/api/logout", func(c *fiber.Ctx) error { return LogoutHandler(c, cfg) })

	app.Use(auth.FirebaseAuthMiddleware(authClient)) // Apply Firebase Auth globally
	app.Get("/api/auth", func(c *fiber.Ctx) error { return AuthHandler(c, authClient) })
}

// AuthHandler handles current authenticated user
func AuthHandler(c *fiber.Ctx, authClient *firebaseAuth.Client) error {
	// Get the session cookie from the request
	cookie := c.Cookies("session")
	if cookie == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "no session cookie",
		})
	}

	// Verify the session cookie with Firebase
	token, err := authClient.VerifySessionCookie(c.Context(), cookie)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid or expired session",
		})
	}

	// Return user info if valid
	return c.JSON(fiber.Map{
		"uid":   token.UID,
		"email": token.Claims["email"],
		"valid": true,
	})
}

// SessionHandler creates a Firebase session cookie
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

// LogoutHandler clears the session cookie
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
