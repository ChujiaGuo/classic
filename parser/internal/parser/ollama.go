package parser

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/ledongthuc/pdf"
)

// OllamaParser implements Parser using a local Ollama instance.
type OllamaParser struct {
	baseURL string
	model   string
	numCtx  int
	client  *http.Client
}

func NewOllamaParser(baseURL, model string, numCtx int) Parser {
	return &OllamaParser{
		baseURL: baseURL,
		model:   model,
		numCtx:  numCtx,
		client:  &http.Client{},
	}
}

type ollamaOptions struct {
	NumCtx int `json:"num_ctx"`
}

type ollamaChatRequest struct {
	Model    string         `json:"model"`
	Messages []ollamaMessage `json:"messages"`
	Stream   bool           `json:"stream"`
	Format   string         `json:"format"`
	Options  ollamaOptions  `json:"options"`
}

type ollamaMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ollamaChatResponse struct {
	Message ollamaMessage `json:"message"`
	Error   string        `json:"error"`
}

func (p *OllamaParser) chat(ctx context.Context, userContent string) (string, error) {
	reqBody := ollamaChatRequest{
		Model: p.model,
		Messages: []ollamaMessage{
			{Role: "system", Content: SystemPrompt},
			{Role: "user", Content: userContent},
		},
		Stream:  false,
		Format:  "json",
		Options: ollamaOptions{NumCtx: p.numCtx},
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal ollama request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.baseURL+"/api/chat", bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("failed to create ollama request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("ollama request failed (is Ollama running?): %w", err)
	}
	defer resp.Body.Close()

	var ollamaResp ollamaChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
		return "", fmt.Errorf("failed to decode ollama response: %w", err)
	}
	if ollamaResp.Error != "" {
		return "", fmt.Errorf("ollama error: %s", ollamaResp.Error)
	}
	return ollamaResp.Message.Content, nil
}

func (p *OllamaParser) ParseText(ctx context.Context, text string) (*ParsedSyllabus, error) {
	content, err := p.chat(ctx, text)
	if err != nil {
		return nil, err
	}
	return extractJSON(content)
}

func (p *OllamaParser) ParsePDF(ctx context.Context, pdfBytes []byte) (*ParsedSyllabus, error) {
	tmp, err := os.CreateTemp("", "syllabus-*.pdf")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file for PDF: %w", err)
	}
	defer os.Remove(tmp.Name())

	if _, err := tmp.Write(pdfBytes); err != nil {
		tmp.Close()
		return nil, fmt.Errorf("failed to write PDF to temp file: %w", err)
	}
	tmp.Close()

	f, r, err := pdf.Open(tmp.Name())
	if err != nil {
		return nil, fmt.Errorf("failed to open PDF: %w", err)
	}
	defer f.Close()

	var sb strings.Builder
	for i := 1; i <= r.NumPage(); i++ {
		page := r.Page(i)
		if page.V.IsNull() {
			continue
		}
		text, err := page.GetPlainText(nil)
		if err != nil {
			continue
		}
		sb.WriteString(text)
	}

	extracted := strings.TrimSpace(sb.String())
	if extracted == "" {
		return nil, fmt.Errorf("could not extract any text from PDF (scanned/image-only PDFs are not supported)")
	}

	return p.ParseText(ctx, extracted)
}
