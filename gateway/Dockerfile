# ===== STAGE 1: Build =====
FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o gateway ./cmd/server

# ===== STAGE 2: Run =====
FROM alpine:latest

RUN addgroup -S app && adduser -S app -G app
USER app

WORKDIR /app

COPY --from=builder /app/gateway .

EXPOSE 8000

CMD ["./gateway"]
