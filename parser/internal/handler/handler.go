package handler

import (
	"io"
	"log/slog"
	"strings"

	"github.com/gofiber/fiber/v2"

	"parser/internal/cache"
	"parser/internal/parser"
)

type Handler struct {
	parser parser.Parser
	cache  *cache.Cache
	log    *slog.Logger
}

func New(p parser.Parser, c *cache.Cache, log *slog.Logger) *Handler {
	return &Handler{parser: p, cache: c, log: log}
}

// Parse handles POST /parse
//
// Accepts:
//   - multipart/form-data with a "file" field (PDF or plain text file)
//   - application/json with a "text" field containing syllabus text
func (h *Handler) Parse(c *fiber.Ctx) error {
	contentType := c.Get("Content-Type")

	if strings.Contains(contentType, "multipart/form-data") {
		return h.parseFile(c)
	}
	return h.parseText(c)
}

func (h *Handler) parseFile(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "expected a 'file' field in multipart form data",
		})
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to open uploaded file",
		})
	}
	defer f.Close()

	data, err := io.ReadAll(f)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to read uploaded file",
		})
	}

	if h.cache != nil {
		key := cache.Key(data)
		var cached parser.ParsedSyllabus
		if hit, err := h.cache.Get(key, &cached); hit && err == nil {
			h.log.Info("cache hit", "file", file.Filename)
			return c.JSON(&cached)
		}
	}

	var result *parser.ParsedSyllabus
	if strings.HasSuffix(strings.ToLower(file.Filename), ".pdf") {
		result, err = h.parser.ParsePDF(c.Context(), data)
	} else {
		result, err = h.parser.ParseText(c.Context(), string(data))
	}

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if h.cache != nil {
		if err := h.cache.Set(cache.Key(data), result); err != nil {
			h.log.Warn("cache write failed", "err", err)
		}
	}

	return c.JSON(result)
}

func (h *Handler) parseText(c *fiber.Ctx) error {
	var body struct {
		Text string `json:"text"`
	}
	if err := c.BodyParser(&body); err != nil || strings.TrimSpace(body.Text) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "request body must be JSON with a non-empty 'text' field, or multipart/form-data with a 'file' field",
		})
	}

	data := []byte(body.Text)

	if h.cache != nil {
		key := cache.Key(data)
		var cached parser.ParsedSyllabus
		if hit, err := h.cache.Get(key, &cached); hit && err == nil {
			h.log.Info("cache hit", "source", "text")
			return c.JSON(&cached)
		}
	}

	result, err := h.parser.ParseText(c.Context(), body.Text)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if h.cache != nil {
		if err := h.cache.Set(cache.Key(data), result); err != nil {
			h.log.Warn("cache write failed", "err", err)
		}
	}

	return c.JSON(result)
}
