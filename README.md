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

| File | Used by |
|---|---|
| `.env` | Docker Compose — service URLs and Firebase build args |
| `parser/.env` | parser — LLM provider, API keys, cache path |
| `webpage/.env.local` | webpage — Firebase client config (local dev only) |

### Service URLs

Service locations are defined once in the root `.env` and substituted into `docker-compose.yml`:

```sh
GATEWAY_URL=http://localhost:8000       # browser-accessible gateway URL (baked into client bundle)
GATEWAY_INTERNAL_URL=http://gateway:8000  # Docker-internal URL for Next.js SSR
PARSER_URL=http://parser:4000           # Docker-internal URL for gateway → parser
WEBPAGE_URL=http://localhost:3000       # webpage URL used by gateway for CORS
```

In production, set these to your real hostnames. When services are on separate machines, use their public addresses — Docker-internal hostnames only work within the same Compose network.

Copy `.env.example` to `.env` and fill in your values.

### LLM Provider

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

Runs all three services in containers. The dev override configures `host.docker.internal` so the parser can reach Ollama running on the host machine.

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Production

Switch to a cloud LLM provider before deploying (see Environment Setup above), then:

```sh
docker compose up --build
```

For a different environment, pass a separate env file:

```sh
docker compose --env-file .env.prod up --build
```

### Running a single service

```sh
docker compose up gateway
docker compose up parser
docker compose up webpage
```

When services run on separate machines, set their URLs in `.env` to real hostnames instead of Docker-internal names.

## Testing

### Parser

Runs without a live LLM — all LLM calls are intercepted by a mock server.

```sh
cd parser
go test ./tests/... -v
```

### Webpage (Playwright Component Tests)

Renders components in a real Chromium browser. No gateway, parser, or Ollama needed.

```sh
cd webpage
npm test              # headless, all tests
npm run test:ui       # visual UI — step through each test and see the rendered component
npm run test:headed   # headed mode — browser window visible during the run
```

First run installs the browser automatically. Reports are written to `webpage/playwright-report/`.
