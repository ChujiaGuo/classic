package parser

import (
	"context"
	"encoding/json"
	"fmt"
)

// SystemPrompt is shared across all LLM providers.
const SystemPrompt = `You are a syllabus parser for a student schedule management system. Extract structured information from university syllabi.

Return ONLY a single valid JSON object — no markdown fences, no explanation, no text before or after the JSON.

Required schema:
{
  "class_name": "full course name and number (e.g. 'CS 101: Introduction to Computer Science')",
  "instructor": {
    "name": "string or null",
    "email": "string or null",
    "office_hours": "string or null — include days, times, and location"
  },
  "meeting_times": {
    "Section 001": [
      {
        "day": "day of week (e.g. 'Monday')",
        "start_time": "12-hour format (e.g. '10:00 AM')",
        "end_time": "12-hour format (e.g. '11:15 AM')",
        "location": "string or null"
      }
    ]
  },
  "exam_dates": [
    {
      "type": "exam name (e.g. 'Midterm 1', 'Final Exam', 'Quiz 3')",
      "date": "YYYY-MM-DD if known, otherwise descriptive (e.g. 'Week 8 Wednesday')",
      "time": "string or null",
      "location": "string or null"
    }
  ],
  "assignments": [
    {
      "name": "assignment name or number (e.g. 'Homework 1', 'Problem Set 3')",
      "due_date": "YYYY-MM-DD if known, otherwise descriptive",
      "due_time": "string or null (e.g. '11:59 PM')",
      "description": "string or null"
    }
  ],
  "projects": [
    {
      "name": "project name",
      "due_date": "YYYY-MM-DD if known, otherwise descriptive",
      "due_time": "string or null",
      "description": "string or null"
    }
  ],
  "grading_weights": [
    {
      "component": "grade component (e.g. 'Homework', 'Midterm Exam', 'Participation')",
      "weight": 0.30
    }
  ]
}

Rules:
- Use null for unknown string fields — never omit a field
- Use null for unknown string fields — never omit a field
- Use [] for empty arrays, {} for meeting_times if no sections are found
- Convert percentage weights to decimals (30% → 0.30)
- Extract ALL exams, quizzes, and tests found in the syllabus
- Extract ALL individual assignment due dates when listed explicitly
- If assignments recur weekly without individual dates, create one entry per assignment type
- Distinguish projects (multi-week, substantial) from regular homework assignments
- meeting_times keys are section identifiers (e.g. "Section 001", "Lab", "Lecture") — use "Section 1" if the syllabus has only one section with no explicit label
- If a section meets on multiple days (e.g. MWF), create one entry per day within that section's array`

// Parser is the common interface for all LLM-backed syllabus parsers.
type Parser interface {
	ParseText(ctx context.Context, text string) (*ParsedSyllabus, error)
	ParsePDF(ctx context.Context, pdfBytes []byte) (*ParsedSyllabus, error)
}

// ParsedSyllabus holds the structured schedule data extracted from a syllabus.
type ParsedSyllabus struct {
	ClassName      string        `json:"class_name"`
	Instructor     Instructor    `json:"instructor"`
	MeetingTimes   map[string][]MeetingTime `json:"meeting_times"`
	ExamDates      []ExamDate    `json:"exam_dates"`
	Assignments    []Assignment  `json:"assignments"`
	Projects       []Project     `json:"projects"`
	GradingWeights []GradeWeight `json:"grading_weights"`
}

type Instructor struct {
	Name        *string `json:"name"`
	Email       *string `json:"email"`
	OfficeHours *string `json:"office_hours"`
}

type MeetingTime struct {
	Day       string  `json:"day"`
	StartTime string  `json:"start_time"`
	EndTime   string  `json:"end_time"`
	Location  *string `json:"location"`
}

type ExamDate struct {
	Type     string  `json:"type"`
	Date     string  `json:"date"`
	Time     *string `json:"time"`
	Location *string `json:"location"`
}

type Assignment struct {
	Name        string  `json:"name"`
	DueDate     string  `json:"due_date"`
	DueTime     *string `json:"due_time"`
	Description *string `json:"description"`
}

type Project struct {
	Name        string  `json:"name"`
	DueDate     string  `json:"due_date"`
	DueTime     *string `json:"due_time"`
	Description *string `json:"description"`
}

type GradeWeight struct {
	Component string  `json:"component"`
	Weight    float64 `json:"weight"`
}

// extractJSON unmarshals raw JSON text into a ParsedSyllabus.
func extractJSON(text string) (*ParsedSyllabus, error) {
	if text == "" {
		return nil, fmt.Errorf("empty response from model")
	}
	var result ParsedSyllabus
	if err := json.Unmarshal([]byte(text), &result); err != nil {
		return nil, fmt.Errorf("model response is not valid JSON: %w\nraw: %.500s", err, text)
	}
	return &result, nil
}
