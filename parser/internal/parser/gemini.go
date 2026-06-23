package parser

import (
	"context"
	"fmt"

	"github.com/google/generative-ai-go/genai"
)

const geminiModel = "gemini-2.0-flash"

// GeminiParser implements Parser using Gemini 2.0 Flash.
type GeminiParser struct {
	client *genai.Client
}

func NewGeminiParser(client *genai.Client) Parser {
	return &GeminiParser{client: client}
}

func (p *GeminiParser) model() *genai.GenerativeModel {
	m := p.client.GenerativeModel(geminiModel)
	m.SystemInstruction = &genai.Content{
		Parts: []genai.Part{genai.Text(SystemPrompt)},
	}
	m.ResponseMIMEType = "application/json"
	return m
}

func (p *GeminiParser) extractText(resp *genai.GenerateContentResponse) (string, error) {
	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil {
		return "", fmt.Errorf("no content in Gemini response")
	}
	for _, part := range resp.Candidates[0].Content.Parts {
		if t, ok := part.(genai.Text); ok {
			return string(t), nil
		}
	}
	return "", fmt.Errorf("no text part in Gemini response")
}

func (p *GeminiParser) ParseText(ctx context.Context, text string) (*ParsedSyllabus, error) {
	resp, err := p.model().GenerateContent(ctx, genai.Text(text))
	if err != nil {
		return nil, fmt.Errorf("gemini API error: %w", err)
	}
	text, err = p.extractText(resp)
	if err != nil {
		return nil, err
	}
	return extractJSON(text)
}

func (p *GeminiParser) ParsePDF(ctx context.Context, pdfBytes []byte) (*ParsedSyllabus, error) {
	resp, err := p.model().GenerateContent(ctx,
		genai.Blob{MIMEType: "application/pdf", Data: pdfBytes},
		genai.Text("Parse this syllabus and extract all structured information."),
	)
	if err != nil {
		return nil, fmt.Errorf("gemini API error: %w", err)
	}
	text, err := p.extractText(resp)
	if err != nil {
		return nil, err
	}
	return extractJSON(text)
}
