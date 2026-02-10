package router

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/gratitude-journal-api/internal/config"
	"github.com/yourusername/gratitude-journal-api/internal/handler"
	"github.com/yourusername/gratitude-journal-api/internal/middleware"
	"github.com/yourusername/gratitude-journal-api/internal/service"
	"github.com/yourusername/gratitude-journal-api/pkg/jwt"
	"go.uber.org/zap"
)

func SetupRouter(cfg *config.Config, logger *zap.Logger) *gin.Engine {
	// Set Gin mode
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// Global middleware
	r.Use(middleware.RecoveryMiddleware(logger))
	r.Use(middleware.LoggerMiddleware(logger))
	r.Use(middleware.CORSMiddleware(cfg.CORS.Origins))
	r.Use(middleware.RequestIDMiddleware())

	// Initialize services
	authService := service.NewAuthService(cfg)
	aiService := service.NewAIService(&cfg.AI)

	// Initialize JWT manager
	jwtManager := jwt.NewJWTManager(cfg.JWT.Secret, cfg.JWT.Expiry)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	journalHandler := handler.NewJournalHandler()
	aiHandler := handler.NewAIHandler(aiService)
	statsHandler := handler.NewStatsHandler()

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "ok",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	// API routes
	api := r.Group("/api")
	{
		// Auth routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/email/send-code", authHandler.SendVerificationCode)
			auth.POST("/email/verify", authHandler.VerifyCode)
			auth.GET("/me", middleware.AuthMiddleware(jwtManager), authHandler.GetMe)
			auth.POST("/logout", middleware.AuthMiddleware(jwtManager), authHandler.Logout)
		}

		// Journal routes (protected)
		journal := api.Group("/journal")
		journal.Use(middleware.AuthMiddleware(jwtManager))
		{
			journal.GET("/list", journalHandler.ListEntries)
			journal.GET("/:id", journalHandler.GetEntry)
			journal.POST("/create", journalHandler.CreateEntry)
			journal.PUT("/:id", journalHandler.UpdateEntry)
			journal.DELETE("/:id", journalHandler.DeleteEntry)
			journal.POST("/sync", journalHandler.SyncEntries)
		}

		// AI routes
		ai := api.Group("/ai")
		{
			// Wisdom is public (no auth required)
			ai.POST("/wisdom", aiHandler.GetWisdom)
			// Summary is public (no auth required)
			ai.POST("/summary", aiHandler.GetSummary)
			// Topics and review require auth
			ai.POST("/topics", middleware.AuthMiddleware(jwtManager), aiHandler.GetPersonalizedTopics)
			ai.POST("/review", middleware.AuthMiddleware(jwtManager), aiHandler.GetReview)
		}

		// Stats routes (protected)
		stats := api.Group("/stats")
		stats.Use(middleware.AuthMiddleware(jwtManager))
		{
			stats.GET("", statsHandler.GetStats)
			stats.POST("/sync", statsHandler.SyncStats)
		}
	}

	return r
}
