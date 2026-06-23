package tests

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"

	"parser/config"
	"parser/internal/handler"
	"parser/internal/parser"
)

// withEnv clears all provider env vars, sets the given ones, and restores
// the original state when the test ends.
func withEnv(t *testing.T, vars map[string]string) {
	t.Helper()
	keys := []string{"ANTHROPIC_API_KEY", "GEMINI_API_KEY", "PROVIDER", "OLLAMA_BASE_URL", "OLLAMA_MODEL"}
	saved := make(map[string]string, len(keys))
	existed := make(map[string]bool, len(keys))
	for _, k := range keys {
		v, ok := os.LookupEnv(k)
		saved[k] = v
		existed[k] = ok
		os.Unsetenv(k)
	}
	for k, v := range vars {
		os.Setenv(k, v)
	}
	t.Cleanup(func() {
		for _, k := range keys {
			if existed[k] {
				os.Setenv(k, saved[k])
			} else {
				os.Unsetenv(k)
			}
		}
	})
}

func strPtr(s string) *string { return &s }

// mockParser is a no-op parser for handler-level tests.
type mockParser struct{}

func (m *mockParser) ParseText(_ context.Context, _ string) (*parser.ParsedSyllabus, error) {
	return &parser.ParsedSyllabus{ClassName: "Mock Class"}, nil
}
func (m *mockParser) ParsePDF(_ context.Context, _ []byte) (*parser.ParsedSyllabus, error) {
	return &parser.ParsedSyllabus{ClassName: "Mock Class"}, nil
}

// TestProviderSelection verifies config.Load picks the right provider from env vars.
func TestProviderSelection(t *testing.T) {
	cases := []struct {
		name      string
		env       map[string]string
		wantProv  config.Provider
		wantModel string
	}{
		{
			name:     "anthropic key auto-detected",
			env:      map[string]string{"ANTHROPIC_API_KEY": "test-key"},
			wantProv: config.ProviderAnthropic,
		},
		{
			name:     "gemini key auto-detected",
			env:      map[string]string{"GEMINI_API_KEY": "test-key"},
			wantProv: config.ProviderGemini,
		},
		{
			name:      "PROVIDER=ollama with defaults",
			env:       map[string]string{"PROVIDER": "ollama"},
			wantProv:  config.ProviderOllama,
			wantModel: "gemma4:12b",
		},
		{
			name:      "PROVIDER=ollama with custom model",
			env:       map[string]string{"PROVIDER": "ollama", "OLLAMA_MODEL": "llama3.2"},
			wantProv:  config.ProviderOllama,
			wantModel: "llama3.2",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			withEnv(t, tc.env)

			cfg := config.Load()

			if cfg.Provider != tc.wantProv {
				t.Errorf("provider: got %q, want %q", cfg.Provider, tc.wantProv)
			}
			if tc.wantModel != "" && cfg.OllamaModel != tc.wantModel {
				t.Errorf("ollama model: got %q, want %q", cfg.OllamaModel, tc.wantModel)
			}
		})
	}
}

// TestHealthEndpoint verifies GET /health returns {"status":"ok","provider":"ollama"}.
func TestHealthEndpoint(t *testing.T) {
	app := fiber.New()
	h := handler.New(&mockParser{})
	app.Post("/parse", h.Parse)
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "provider": "ollama"})
	})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("status: got %d, want 200", resp.StatusCode)
	}

	var body struct {
		Status   string `json:"status"`
		Provider string `json:"provider"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body.Status != "ok" {
		t.Errorf("status field: got %q, want \"ok\"", body.Status)
	}
	if body.Provider != "ollama" {
		t.Errorf("provider field: got %q, want \"ollama\"", body.Provider)
	}
}

// TestBasicPrompt verifies OllamaParser sends the right request shape:
// correct model, system + user messages, stream=false, format="json".
func TestBasicPrompt(t *testing.T) {
	var captured struct {
		Model    string `json:"model"`
		Messages []struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"messages"`
		Stream bool   `json:"stream"`
		Format string `json:"format"`
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewDecoder(r.Body).Decode(&captured)
		json.NewEncoder(w).Encode(map[string]any{
			"message": map[string]string{
				"role":    "assistant",
				"content": `{"class_name":"","instructor":{"name":null,"email":null,"office_hours":null},"meeting_times":{},"exam_dates":[],"assignments":[],"projects":[],"grading_weights":[]}`,
			},
		})
	}))
	defer srv.Close()

	p := parser.NewOllamaParser(srv.URL, "gemma4:12b", 32768)
	if _, err := p.ParseText(context.Background(), "this is the syllabus text"); err != nil {
		t.Fatalf("ParseText: %v", err)
	}

	t.Logf("system prompt:\n%s", captured.Messages[0].Content)
	t.Logf("user message:\n%s", captured.Messages[1].Content)

	if captured.Model != "gemma4:12b" {
		t.Errorf("model: got %q, want \"gemma4:12b\"", captured.Model)
	}
	if captured.Stream {
		t.Error("stream should be false")
	}
	if captured.Format != "json" {
		t.Errorf("format: got %q, want \"json\"", captured.Format)
	}
	if len(captured.Messages) < 2 {
		t.Fatalf("expected at least 2 messages, got %d", len(captured.Messages))
	}
	if captured.Messages[0].Role != "system" {
		t.Errorf("messages[0].role: got %q, want \"system\"", captured.Messages[0].Role)
	}
	if !strings.Contains(captured.Messages[0].Content, "syllabus parser") {
		t.Error("system message should contain the system prompt")
	}
	if captured.Messages[1].Role != "user" {
		t.Errorf("messages[1].role: got %q, want \"user\"", captured.Messages[1].Role)
	}
	if !strings.Contains(captured.Messages[1].Content, "this is the syllabus text") {
		t.Error("user message should contain the input text")
	}
}

// TestBasicAnswer verifies OllamaParser correctly unmarshals a well-formed
// Ollama response into a ParsedSyllabus with the right field values.
func TestBasicAnswer(t *testing.T) {
	syllabus := parser.ParsedSyllabus{
		ClassName: "CS 101: Introduction to Computer Science",
		Instructor: parser.Instructor{
			Name:  strPtr("Dr. Smith"),
			Email: strPtr("smith@university.edu"),
		},
		MeetingTimes: map[string][]parser.MeetingTime{
			"Section 1": {
				{Day: "Monday", StartTime: "10:00 AM", EndTime: "11:15 AM", Location: strPtr("Room 204")},
				{Day: "Wednesday", StartTime: "10:00 AM", EndTime: "11:15 AM", Location: strPtr("Room 204")},
			},
		},
		Assignments: []parser.Assignment{
			{Name: "Homework 1", DueDate: "2025-09-15"},
		},
		GradingWeights: []parser.GradeWeight{
			{Component: "Homework", Weight: 0.40},
			{Component: "Final Exam", Weight: 0.60},
		},
	}

	payload, _ := json.Marshal(syllabus)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]any{
			"message": map[string]string{
				"role":    "assistant",
				"content": string(payload),
			},
		})
	}))
	defer srv.Close()

	p := parser.NewOllamaParser(srv.URL, "gemma4:12b", 32768)
	got, err := p.ParseText(context.Background(), "any input")
	if err != nil {
		t.Fatalf("ParseText: %v", err)
	}

	pretty, _ := json.MarshalIndent(got, "", "  ")
	t.Logf("parsed answer:\n%s", pretty)

	if got.ClassName != syllabus.ClassName {
		t.Errorf("class_name: got %q, want %q", got.ClassName, syllabus.ClassName)
	}
	if got.Instructor.Name == nil || *got.Instructor.Name != "Dr. Smith" {
		t.Errorf("instructor.name: got %v, want \"Dr. Smith\"", got.Instructor.Name)
	}
	if len(got.MeetingTimes["Section 1"]) != 2 {
		t.Errorf("meeting_times[Section 1]: got %d entries, want 2", len(got.MeetingTimes["Section 1"]))
	}
	if len(got.Assignments) != 1 || got.Assignments[0].Name != "Homework 1" {
		t.Errorf("assignments: got %+v, want one entry named \"Homework 1\"", got.Assignments)
	}
	if len(got.GradingWeights) != 2 || got.GradingWeights[0].Weight != 0.40 {
		t.Errorf("grading_weights: got %+v, want [{Homework 0.40} {Final Exam 0.60}]", got.GradingWeights)
	}
}
