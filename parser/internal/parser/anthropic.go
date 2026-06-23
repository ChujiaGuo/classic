package parser

import (
	"context"
	"encoding/base64"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
)

// AnthropicParser implements Parser using Claude Opus 4.8.
type AnthropicParser struct {
	client anthropic.Client
}

func NewAnthropicParser(client anthropic.Client) Parser {
	return &AnthropicParser{client: client}
}

func (p *AnthropicParser) buildParams(messages []anthropic.MessageParam) anthropic.MessageNewParams {
	adaptive := anthropic.ThinkingConfigAdaptiveParam{}
	return anthropic.MessageNewParams{
		Model:     anthropic.ModelClaudeOpus4_8,
		MaxTokens: 16000,
		System: []anthropic.TextBlockParam{{
			Text:         SystemPrompt,
			CacheControl: anthropic.NewCacheControlEphemeralParam(),
		}},
		Thinking: anthropic.ThinkingConfigParamUnion{OfAdaptive: &adaptive},
		Messages: messages,
	}
}

func (p *AnthropicParser) stream(ctx context.Context, params anthropic.MessageNewParams) (anthropic.Message, error) {
	s := p.client.Messages.NewStreaming(ctx, params)
	msg := anthropic.Message{}
	for s.Next() {
		msg.Accumulate(s.Current())
	}
	if err := s.Err(); err != nil {
		return anthropic.Message{}, fmt.Errorf("streaming error: %w", err)
	}
	return msg, nil
}

func (p *AnthropicParser) extractText(msg anthropic.Message) string {
	for _, block := range msg.Content {
		if b, ok := block.AsAny().(anthropic.TextBlock); ok {
			return b.Text
		}
	}
	return ""
}

func (p *AnthropicParser) ParseText(ctx context.Context, text string) (*ParsedSyllabus, error) {
	params := p.buildParams([]anthropic.MessageParam{
		anthropic.NewUserMessage(anthropic.NewTextBlock(text)),
	})
	msg, err := p.stream(ctx, params)
	if err != nil {
		return nil, err
	}
	return extractJSON(p.extractText(msg))
}

func (p *AnthropicParser) ParsePDF(ctx context.Context, pdfBytes []byte) (*ParsedSyllabus, error) {
	b64 := base64.StdEncoding.EncodeToString(pdfBytes)
	params := p.buildParams([]anthropic.MessageParam{
		anthropic.NewUserMessage(
			anthropic.NewDocumentBlock(anthropic.Base64PDFSourceParam{Data: b64}),
			anthropic.NewTextBlock("Parse this syllabus and extract all structured information."),
		),
	})
	msg, err := p.stream(ctx, params)
	if err != nil {
		return nil, err
	}
	return extractJSON(p.extractText(msg))
}
