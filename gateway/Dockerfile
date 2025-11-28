# ===== STAGE 1: Build =====
FROM golang:1.21-alpine AS builder

# Set working directory
WORKDIR /app

# Install git for dependency fetching
RUN apk add --no-cache git

# Copy go.mod and go.sum first (for caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the binary
RUN go build -o gateway ./cmd/server

# ===== STAGE 2: Run =====
FROM alpine:latest

# Create a non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

# Set working directory
WORKDIR /app

# Copy the binary from the builder
COPY --from=builder /app/gateway .

# Copy service account JSON (make sure to mount it or include in build context)
COPY ./classic-webpage-auth.json ./classic-webpage-auth.json

# Copy .env file (optional, or use runtime environment variables)
COPY .env .env

# Expose port
EXPOSE 8000

# Run the binary
CMD ["./gateway"]
