package routes

import (
	"gateway/config"
	"gateway/internal/auth"
	internalproxy "gateway/internal/proxy"

	firebaseAuth "firebase.google.com/go/v4/auth"
	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App, cfg config.Config, authClient *firebaseAuth.Client) {
	app.Post("/api/session", func(c *fiber.Ctx) error { return SessionHandler(c, cfg, authClient) })
	app.Post("/api/logout", func(c *fiber.Ctx) error { return LogoutHandler(c, cfg) })

	app.Use(auth.FirebaseAuthMiddleware(authClient))
	app.Get("/api/auth", AuthHandler)
	app.Post("/api/parse", internalproxy.ProxyHandler(cfg.ParserURL+"/parse"))
}
