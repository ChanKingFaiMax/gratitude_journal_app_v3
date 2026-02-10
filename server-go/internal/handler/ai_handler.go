package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/yourusername/gratitude-journal-api/internal/middleware"
	"github.com/yourusername/gratitude-journal-api/internal/repository"
	"github.com/yourusername/gratitude-journal-api/internal/service"
	"github.com/yourusername/gratitude-journal-api/pkg/response"
)

type AIHandler struct {
	aiService   *service.AIService
	journalRepo *repository.JournalRepository
}

func NewAIHandler(aiService *service.AIService) *AIHandler {
	return &AIHandler{
		aiService:   aiService,
		journalRepo: repository.NewJournalRepository(),
	}
}

// WisdomRequest represents a request for sage wisdom
type WisdomRequest struct {
	Topic    string `json:"topic"`
	Content  string `json:"content"`
	Language string `json:"language"`
}

// SummaryRequest represents a request for sage summary
type SummaryRequest struct {
	Topic    string `json:"topic" binding:"required"`
	Content  string `json:"content" binding:"required"`
	Language string `json:"language"`
}

// TopicsRequest represents a request for personalized topics
type TopicsRequest struct {
	Language string `json:"language"`
}

// ReviewRequest represents a request for deep review
type ReviewRequest struct {
	Type     string `json:"type" binding:"required,oneof=consciousness growth relationships attention"`
	Language string `json:"language"`
}

// GetWisdom handles POST /api/ai/wisdom
func (h *AIHandler) GetWisdom(c *gin.Context) {
	var req WisdomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request", err.Error())
		return
	}

	language := req.Language
	if language == "" {
		language = "zh"
	}

	wisdoms, err := h.aiService.GenerateWisdom(req.Topic, req.Content, language)
	if err != nil {
		response.InternalError(c, "Failed to generate wisdom")
		return
	}

	response.Success(c, gin.H{
		"wisdoms": wisdoms,
	})
}

// GetSummary handles POST /api/ai/summary
func (h *AIHandler) GetSummary(c *gin.Context) {
	var req SummaryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request", err.Error())
		return
	}

	language := req.Language
	if language == "" {
		language = "zh"
	}

	summaries, err := h.aiService.GenerateSummary(req.Topic, req.Content, language)
	if err != nil {
		response.InternalError(c, "Failed to generate summary")
		return
	}

	response.Success(c, gin.H{
		"summaries": summaries,
	})
}

// GetPersonalizedTopics handles POST /api/ai/topics
func (h *AIHandler) GetPersonalizedTopics(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		response.Unauthorized(c, "Not authenticated")
		return
	}

	var req TopicsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request", err.Error())
		return
	}

	language := req.Language
	if language == "" {
		language = "zh"
	}

	// Get recent entries
	entries, err := h.journalRepo.GetRecentEntries(userID, 10)
	if err != nil {
		response.InternalError(c, "Failed to fetch entries")
		return
	}

	// Extract content from entries
	var contents []string
	for _, entry := range entries {
		contents = append(contents, entry.Content)
	}

	topics, err := h.aiService.GeneratePersonalizedTopics(contents, language)
	if err != nil {
		response.InternalError(c, "Failed to generate topics")
		return
	}

	response.Success(c, gin.H{
		"topics": topics,
	})
}

// GetReview handles POST /api/ai/review
func (h *AIHandler) GetReview(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		response.Unauthorized(c, "Not authenticated")
		return
	}

	var req ReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request", err.Error())
		return
	}

	language := req.Language
	if language == "" {
		language = "zh"
	}

	// Get all entries for the user
	entries, err := h.journalRepo.GetEntriesByUserID(userID)
	if err != nil {
		response.InternalError(c, "Failed to fetch entries")
		return
	}

	if len(entries) == 0 {
		response.BadRequest(c, "No journal entries found for analysis", nil)
		return
	}

	// Extract content from entries
	var contents []string
	for _, entry := range entries {
		content := entry.Topic + "\n" + entry.Content
		contents = append(contents, content)
	}

	review, err := h.aiService.GenerateReview(req.Type, contents, language)
	if err != nil {
		response.InternalError(c, "Failed to generate review")
		return
	}

	response.Success(c, gin.H{
		"type":    req.Type,
		"content": review,
	})
}
