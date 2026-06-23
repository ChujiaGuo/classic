package routes

import (
	"gateway/internal/auth"

	"github.com/gofiber/fiber/v2"
)

// AuthHandler returns the authenticated user's info.
// The FirebaseAuthMiddleware has already verified the session and stored the
// decoded token in Fiber locals — this handler just reads it back out.
func AuthHandler(c *fiber.Ctx) error {
	token := auth.GetUserFromContext(c)
	if token == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthenticated",
		})
	}
	return c.JSON(fiber.Map{
		"uid":   token.UID,
		"email": token.Claims["email"],
		"valid": true,
	})
}
