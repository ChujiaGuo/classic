# Classic

Student schedule management tool. Upload a course syllabus and Classic extracts due dates, exams, meeting times, and grading weights into a unified dashboard — no more digging through Blackboard and Canvas.

## Services

| Service | Port | Stack |
|---|---|---|
| `gateway` | 8000 | Go 1.25 + Fiber — auth, CORS, proxies to internal services |
| `parser` | 4000 | Go 1.25 + Fiber — accepts syllabus uploads, returns structured JSON via LLM |
| `webpage` | 3000 | Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 |

Authentication is handled via Firebase (email/password and Google OAuth). The gateway exchanges Firebase ID tokens for session cookies on login.

## Prerequisites

- **Go 1.25+** (gateway, parser)
- **Node.js 20+** (webpage)
- **Docker + Docker Compose** (for containerized runs)
- **[Ollama](https://ollama.com)** with `gemma4:12b` pulled — default parser provider

```sh
ollama pull gemma4:12b
```

## Environment Setup

Each service reads from its own `.env` file. No system environment variables are required.

| File | Used by |
|---|---|
| `gateway/.env` | gateway (already configured) |
| `parser/.env` | parser (already configured for Ollama) |
| `webpage/.env.local` | webpage (already configured) |

To use a cloud LLM instead of Ollama, edit `parser/.env`:

```sh
# Anthropic
PROVIDER=anthropic
ANTHROPIC_API_KEY=your-key-here

# Google Gemini
PROVIDER=gemini
GEMINI_API_KEY=your-key-here
```

See `parser/.env.example` for all available parser options.

## Running Locally

Start each service from its own directory. Requires Ollama running in the background.

```sh
# Terminal 1
cd gateway && go run cmd/server/main.go

# Terminal 2
cd parser && go run cmd/server/main.go

# Terminal 3
cd webpage && npm run dev
```

## Running with Docker

### Development

Runs all three services in containers. The parser reaches your local Ollama instance over the host network.

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Production

Uses the provider configured in `parser/.env`. Switch to a cloud provider before deploying (see Environment Setup above).

```sh
docker compose up --build
```

## Testing

Parser tests run without a live LLM — all LLM calls are intercepted by a mock server.

```sh
cd parser
go test ./tests/... -v
```
