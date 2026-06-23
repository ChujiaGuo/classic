package proxy

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

// ProxyHandler returns a Fiber handler that forwards requests to the target URL.
// It preserves response headers set by earlier middleware (e.g. CORS) because
// proxy.Do replaces the response headers entirely with those from the upstream.
func ProxyHandler(target string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		type kv struct{ key, val string }
		var saved []kv
		c.Response().Header.VisitAll(func(k, v []byte) {
			saved = append(saved, kv{string(k), string(v)})
		})

		err := proxy.Do(c, target)

		for _, h := range saved {
			c.Set(h.key, h.val)
		}
		return err
	}
}
