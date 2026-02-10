package repository

import (
	"fmt"
	"log"

	"github.com/yourusername/gratitude-journal-api/internal/config"
	"github.com/yourusername/gratitude-journal-api/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDatabase initializes the database connection
func InitDatabase(cfg *config.Config) error {
	var err error
	
	// Configure GORM logger
	logLevel := logger.Info
	if cfg.IsProduction() {
		logLevel = logger.Error
	}

	DB, err = gorm.Open(postgres.Open(cfg.Database.URL), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get underlying SQL DB for connection pool settings
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	// Set connection pool settings
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetMaxIdleConns(10)

	// Auto migrate tables
	if err := AutoMigrate(); err != nil {
		return fmt.Errorf("failed to auto migrate: %w", err)
	}

	log.Println("Database connected and migrated successfully")
	return nil
}

// AutoMigrate runs auto migration for all models
func AutoMigrate() error {
	return DB.AutoMigrate(
		&models.User{},
		&models.JournalEntry{},
		&models.UserStats{},
		&models.EmailVerification{},
	)
}

// CloseDatabase closes the database connection
func CloseDatabase() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
