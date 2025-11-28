package proxy

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

// ProxyHandler returns a Fiber handler that forwards requests to the target URL
func ProxyHandler(target string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Forward the request to the target service
		return proxy.Do(c, target)
	}
}
