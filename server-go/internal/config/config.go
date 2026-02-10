package config

import (
	"fmt"
	"time"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	AI       AIConfig
	Firebase FirebaseConfig
	Email    EmailConfig
	CORS     CORSConfig
	RateLimit RateLimitConfig
}

type ServerConfig struct {
	Port string
	Env  string
}

type DatabaseConfig struct {
	URL string
}

type JWTConfig struct {
	Secret string
	Expiry time.Duration
}

type AIConfig struct {
	OpenRouterAPIKey string
	OpenRouterModel  string
}

type FirebaseConfig struct {
	ProjectID       string
	CredentialsPath string
}

type EmailConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	From     string
}

type CORSConfig struct {
	Origins []string
}

type RateLimitConfig struct {
	Requests int
	Duration time.Duration
}

func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	viper.AutomaticEnv()

	// Set defaults
	viper.SetDefault("PORT", "3000")
	viper.SetDefault("ENV", "development")
	viper.SetDefault("JWT_EXPIRY", "168h")
	viper.SetDefault("OPENROUTER_MODEL", "google/gemini-2.0-flash-exp:free")
	viper.SetDefault("EMAIL_HOST", "smtp.gmail.com")
	viper.SetDefault("EMAIL_PORT", 587)
	viper.SetDefault("CORS_ORIGINS", "http://localhost:8081")
	viper.SetDefault("RATE_LIMIT_REQUESTS", 100)
	viper.SetDefault("RATE_LIMIT_DURATION", "1m")

	// Parse JWT expiry
	jwtExpiry, err := time.ParseDuration(viper.GetString("JWT_EXPIRY"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_EXPIRY: %w", err)
	}

	// Parse rate limit duration
	rateLimitDuration, err := time.ParseDuration(viper.GetString("RATE_LIMIT_DURATION"))
	if err != nil {
		return nil, fmt.Errorf("invalid RATE_LIMIT_DURATION: %w", err)
	}

	config := &Config{
		Server: ServerConfig{
			Port: viper.GetString("PORT"),
			Env:  viper.GetString("ENV"),
		},
		Database: DatabaseConfig{
			URL: viper.GetString("DATABASE_URL"),
		},
		JWT: JWTConfig{
			Secret: viper.GetString("JWT_SECRET"),
			Expiry: jwtExpiry,
		},
		AI: AIConfig{
			OpenRouterAPIKey: viper.GetString("OPENROUTER_API_KEY"),
			OpenRouterModel:  viper.GetString("OPENROUTER_MODEL"),
		},
		Firebase: FirebaseConfig{
			ProjectID:       viper.GetString("FIREBASE_PROJECT_ID"),
			CredentialsPath: viper.GetString("FIREBASE_CREDENTIALS_PATH"),
		},
		Email: EmailConfig{
			Host:     viper.GetString("EMAIL_HOST"),
			Port:     viper.GetInt("EMAIL_PORT"),
			User:     viper.GetString("EMAIL_USER"),
			Password: viper.GetString("EMAIL_PASSWORD"),
			From:     viper.GetString("EMAIL_FROM"),
		},
		CORS: CORSConfig{
			Origins: viper.GetStringSlice("CORS_ORIGINS"),
		},
		RateLimit: RateLimitConfig{
			Requests: viper.GetInt("RATE_LIMIT_REQUESTS"),
			Duration: rateLimitDuration,
		},
	}

	// Validate required fields
	if config.Database.URL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if config.JWT.Secret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return config, nil
}

func (c *Config) IsProduction() bool {
	return c.Server.Env == "production"
}
