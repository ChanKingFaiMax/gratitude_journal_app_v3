package handler

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/gratitude-journal-api/internal/middleware"
	"github.com/yourusername/gratitude-journal-api/internal/models"
	"github.com/yourusername/gratitude-journal-api/internal/repository"
	"github.com/yourusername/gratitude-journal-api/pkg/response"
	"gorm.io/gorm"
)

type StatsHandler struct {
	repo *repository.StatsRepository
}

func NewStatsHandler() *StatsHandler {
	return &StatsHandler{
		repo: repository.NewStatsRepository(),
	}
}

// SyncStatsRequest represents a request to sync stats
type SyncStatsRequest struct {
	TotalEntries    int    `json:"totalEntries"`
	GratitudeCount  int    `json:"gratitudeCount"`
	PhilosophyCount int    `json:"philosophyCount"`
	FreeNoteCount   int    `json:"freeNoteCount"`
	CurrentStreak   int    `json:"currentStreak"`
	LongestStreak   int    `json:"longestStreak"`
	LastEntryDate   string `json:"lastEntryDate"`
}

// GetStats handles GET /api/stats
func (h *StatsHandler) GetStats(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		response.Unauthorized(c, "Not authenticated")
		return
	}

	stats, err := h.repo.GetStatsByUserID(userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Return empty stats for new users
			response.Success(c, gin.H{
				"stats": gin.H{
					"totalEntries":    0,
					"gratitudeCount":  0,
					"philosophyCount": 0,
					"freeNoteCount":   0,
					"currentStreak":   0,
					"longestStreak":   0,
					"lastEntryDate":   nil,
				},
			})
			return
		}
		response.InternalError(c, "Failed to fetch stats")
		return
	}

	response.Success(c, gin.H{
		"stats": stats,
	})
}

// SyncStats handles POST /api/stats/sync
func (h *StatsHandler) SyncStats(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		response.Unauthorized(c, "Not authenticated")
		return
	}

	var req SyncStatsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request", err.Error())
		return
	}

	// Parse last entry date
	var lastEntryDate time.Time
	if req.LastEntryDate != "" {
		if parsed, err := time.Parse(time.RFC3339, req.LastEntryDate); err == nil {
			lastEntryDate = parsed
		}
	}

	stats := &models.UserStats{
		UserID:          userID,
		TotalEntries:    req.TotalEntries,
		GratitudeCount:  req.GratitudeCount,
		PhilosophyCount: req.PhilosophyCount,
		FreeNoteCount:   req.FreeNoteCount,
		CurrentStreak:   req.CurrentStreak,
		LongestStreak:   req.LongestStreak,
		LastEntryDate:   lastEntryDate,
	}

	if err := h.repo.UpsertStats(stats); err != nil {
		response.InternalError(c, "Failed to sync stats")
		return
	}

	// Fetch the updated stats
	updatedStats, _ := h.repo.GetStatsByUserID(userID)

	response.Success(c, gin.H{
		"stats":    updatedStats,
		"syncedAt": time.Now().Format(time.RFC3339),
	})
}
