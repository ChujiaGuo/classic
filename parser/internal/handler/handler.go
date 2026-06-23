package handler

import (
	"io"
	"strings"

	"github.com/gofiber/fiber/v2"

	"parser/internal/parser"
)

type Handler struct {
	parser parser.Parser
}

func New(p parser.Parser) *Handler {
	return &Handler{parser: p}
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

	result, err := h.parser.ParseText(c.Context(), body.Text)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(result)
}
