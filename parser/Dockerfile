# ===== STAGE 1: Build =====
FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o parser ./cmd/server

# ===== STAGE 2: Run =====
FROM alpine:latest

RUN addgroup -S app && adduser -S app -G app
USER app

WORKDIR /app

COPY --from=builder /app/parser .

EXPOSE 4000

CMD ["./parser"]
