.PHONY: build run dev test clean docker-build docker-run docker-stop lint fmt deps

# Variables
APP_NAME=gratitude-api
MAIN_PATH=./cmd/api
BINARY_PATH=./bin/$(APP_NAME)

# Build the application
build:
	@echo "Building $(APP_NAME)..."
	@go build -o $(BINARY_PATH) $(MAIN_PATH)
	@echo "Build complete: $(BINARY_PATH)"

# Run the application
run: build
	@echo "Running $(APP_NAME)..."
	@$(BINARY_PATH)

# Run in development mode with hot reload (requires air)
dev:
	@echo "Starting development server..."
	@air -c .air.toml || go run $(MAIN_PATH)/main.go

# Run tests
test:
	@echo "Running tests..."
	@go test -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	@go test -v -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf ./bin
	@rm -f coverage.out coverage.html
	@echo "Clean complete"

# Build Docker image
docker-build:
	@echo "Building Docker image..."
	@docker build -t $(APP_NAME):latest .

# Run with Docker Compose
docker-run:
	@echo "Starting services with Docker Compose..."
	@docker-compose up -d

# Stop Docker Compose services
docker-stop:
	@echo "Stopping services..."
	@docker-compose down

# View Docker logs
docker-logs:
	@docker-compose logs -f

# Run linter (requires golangci-lint)
lint:
	@echo "Running linter..."
	@golangci-lint run ./...

# Format code
fmt:
	@echo "Formatting code..."
	@go fmt ./...

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	@go mod download
	@go mod tidy

# Generate go.sum
tidy:
	@go mod tidy

# Initialize database (run migrations)
db-init:
	@echo "Database will be auto-migrated on first run"

# Help
help:
	@echo "Available commands:"
	@echo "  make build        - Build the application"
	@echo "  make run          - Build and run the application"
	@echo "  make dev          - Run in development mode"
	@echo "  make test         - Run tests"
	@echo "  make test-coverage- Run tests with coverage"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run with Docker Compose"
	@echo "  make docker-stop  - Stop Docker Compose services"
	@echo "  make docker-logs  - View Docker logs"
	@echo "  make lint         - Run linter"
	@echo "  make fmt          - Format code"
	@echo "  make deps         - Download dependencies"
	@echo "  make tidy         - Tidy go.mod"
