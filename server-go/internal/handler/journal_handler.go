package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/gratitude-journal-api/internal/middleware"
	"github.com/yourusername/gratitude-journal-api/internal/models"
	"github.com/yourusername/gratitude-journal-api/internal/repository"
	"github.com/yourusername/gratitude-journal-api/pkg/response"
)

type JournalHandler struct {
	repo      *repository.JournalRepository
	statsRepo *repository.StatsRepository
}

func NewJournalHandler() *JournalHandler {
	return &JournalHandler{
		repo:      repository.NewJournalRepository(),
		statsRepo: repository.NewStatsRepository(),
	}
}

// CreateEntryRequest represents a request to create a journal entry
type CreateEntryRequest struct {
	LocalID        string `json:"localId"`
	Source         string `json:"source" binding:"required,oneof=gratitude philosophy free"`
	Topic          string `json:"topic"`
	Content        string `json:"content" binding:"required"`
	MastersSummary string `json:"mastersSummary"`
	TimeOfDay      string `json:"timeOfDay"`
	CreatedAt      string `json:"createdAt"`
}

// UpdateEntryRequest represents a request to update a journal entry
type UpdateEntryRequest struct {
	Topic          string `json:"topic"`
	Content        string `json:"content"`
	MastersSummary string `json:"mastersSummary"`
}

// SyncEntriesRequest represents a request to sync entries
type SyncEntriesRequest struct {
	Entries []CreateEntryRequest `json:"entries" binding:"required"`
	Since   string               `json:"since"`
}

// ListEntries handles GET /api/journal/list
func (h *JournalHandler) ListEntries(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		response.Unauthorized(c, "Not authenticated")
		return
	}

	// Parse pagination params
	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	entries, total, err := h.repo.GetEntriesByUserIDPaginated(userID, limit, offset)
	if err != nil {
		response.InternalError(c, "Failed to fetch entries")
		return
	}

	response.Success(c, gin.H{
		"entries": entries,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// CreateEntry handles POST /api/journal/create
func (h *JournalHandler) CreateEntry(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		response.Unauthorized(c, "Not authenticated")
		return
	}

	var req CreateEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request", err.Error())
		return
	}

	// Parse created_at if provided
	createdAt := time.Now()
	if req.CreatedAt != "" {
		if parsed, err := time.Parse(time.RFC3339, req.CreatedAt); err == nil {
			createdAt = parsed
		}
	}

	entry := &models.JournalEntry{
		UserID:         userID,
		LocalID:        req.LocalID,
		Source:         req.Source,
		Topic:          req.Topic,
		Content:        req.Content,
		MastersSummary: req.MastersSummary,
		TimeOfDay:      req.TimeOfDay,
		CreatedAt:      createdAt,
	}

	if err := h.repo.CreateEntry(entry); err != nil {
		response.InternalError(c, "Failed to create entry")
		return
	}

	// Update stats
	_ = h.statsRepo.IncrementEntryCount(userID, req.Source)

	response.Created(c, entry)
}

// UpdateEntry handles PUT /api/journal/:id
func (h *JournalHandler) UpdateEntry(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		response.Unauthorized(c, "Not authenticated")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid entry ID", nil)
		return
	}

	// Get existing entry
	entry, err := h.repo.GetEntryByID(id)
	if err != nil {
		response.NotFound(c, "Entry not found")
		return
	}

	// Check ownership
	if entry.UserID != userID {
		response.Forbidden(c, "Not authorized to update this entry")
		return
	}

	var req UpdateEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request", err.Error())
		return
	}

	// Update fields
	if req.Topic != "" {
		entry.Topic = req.Topic
	}
	if req.Content != "" {
		entry.Content = req.Content
	}
	if req.MastersSummary != "" {
		entry.MastersSummary = req.MastersSummary
	}

	if err := h.repo.UpdateEntry(entry); err != nil {
		response.InternalError(c, "Failed to update entry")
		return
	}

	response.Success(c, entry)
}

// DeleteEntry handles DELETE /api/journal/:id
func (h *JournalHandler) DeleteEntry(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		response.Unauthorized(c, "Not authenticated")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid entry ID", nil)
		return
	}

	if err := h.repo.DeleteEntry(id, userID); err != nil {
		response.InternalError(c, "Failed to delete entry")
		return
	}

	response.NoContent(c)
}

// SyncEntries handles POST /api/journal/sync
func (h *JournalHandler) SyncEntries(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		response.Unauthorized(c, "Not authenticated")
		return
	}

	var req SyncEntriesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request", err.Error())
		return
	}

	// Upsert entries from client
	for _, entryReq := range req.Entries {
		createdAt := time.Now()
		if entryReq.CreatedAt != "" {
			if parsed, err := time.Parse(time.RFC3339, entryReq.CreatedAt); err == nil {
				createdAt = parsed
			}
		}

		entry := &models.JournalEntry{
			UserID:         userID,
			LocalID:        entryReq.LocalID,
			Source:         entryReq.Source,
			Topic:          entryReq.Topic,
			Content:        entryReq.Content,
			MastersSummary: entryReq.MastersSummary,
			TimeOfDay:      entryReq.TimeOfDay,
			CreatedAt:      createdAt,
		}

		_ = h.repo.UpsertEntry(entry)
	}

	// Get entries updated since the given time
	var serverEntries []models.JournalEntry
	if req.Since != "" {
		if since, err := time.Parse(time.RFC3339, req.Since); err == nil {
			serverEntries, _ = h.repo.GetEntriesSince(userID, since)
		}
	}

	if serverEntries == nil {
		serverEntries, _ = h.repo.GetEntriesByUserID(userID)
	}

	response.Success(c, gin.H{
		"entries":   serverEntries,
		"syncedAt":  time.Now().Format(time.RFC3339),
		"uploaded":  len(req.Entries),
	})
}

// GetEntry handles GET /api/journal/:id
func (h *JournalHandler) GetEntry(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		response.Unauthorized(c, "Not authenticated")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid entry ID", nil)
		return
	}

	entry, err := h.repo.GetEntryByID(id)
	if err != nil {
		response.NotFound(c, "Entry not found")
		return
	}

	if entry.UserID != userID {
		response.Forbidden(c, "Not authorized to view this entry")
		return
	}

	response.Success(c, entry)
}
