package auth

import (
	"context"
	"log"

	"firebase.google.com/go/v4/auth"
	"github.com/gofiber/fiber/v2"
)

// FirebaseAuthMiddleware returns a Fiber middleware that validates Firebase session cookies
func FirebaseAuthMiddleware(authClient *auth.Client) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Read the session cookie
		cookie := c.Cookies("session") // Firebase session cookie name
		if cookie == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "unauthenticated",
			})
		}

		// Verify the session cookie
		token, err := authClient.VerifySessionCookie(context.Background(), cookie)
		if err != nil {
			log.Printf("Failed to verify session cookie: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid session",
			})
		}

		// Store the decoded token in Fiber locals for downstream handlers
		c.Locals("user", token)

		return c.Next()
	}
}

// GetUserFromContext extracts the Firebase token from Fiber locals
func GetUserFromContext(c *fiber.Ctx) *auth.Token {
	token, ok := c.Locals("user").(*auth.Token)
	if !ok {
		return nil
	}
	return token
}
