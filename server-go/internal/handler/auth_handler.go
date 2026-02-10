package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/gratitude-journal-api/internal/middleware"
	"github.com/yourusername/gratitude-journal-api/internal/service"
	"github.com/yourusername/gratitude-journal-api/pkg/response"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// SendCodeRequest represents a request to send verification code
type SendCodeRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Language string `json:"language"`
}

// VerifyCodeRequest represents a request to verify code
type VerifyCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required,len=6"`
	Name  string `json:"name"`
}

// SendVerificationCode handles POST /api/auth/email/send-code
func (h *AuthHandler) SendVerificationCode(c *gin.Context) {
	var req SendCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request", err.Error())
		return
	}

	language := req.Language
	if language == "" {
		language = "zh"
	}

	if err := h.authService.SendVerificationCode(req.Email, language); err != nil {
		response.InternalError(c, "Failed to send verification code")
		return
	}

	response.Success(c, gin.H{
		"message": "Verification code sent",
	})
}

// VerifyCode handles POST /api/auth/email/verify
func (h *AuthHandler) VerifyCode(c *gin.Context) {
	var req VerifyCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request", err.Error())
		return
	}

	result, err := h.authService.VerifyEmailAndLogin(req.Email, req.Code, req.Name)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"token": result.Token,
		"user": gin.H{
			"id":           result.User.ID,
			"openId":       result.User.OpenID,
			"email":        result.User.Email,
			"name":         result.User.Name,
			"loginMethod":  result.User.LoginMethod,
			"lastSignedIn": result.User.LastSignedIn,
		},
	})
}

// GetMe handles GET /api/auth/me
func (h *AuthHandler) GetMe(c *gin.Context) {
	claims, ok := middleware.GetUserClaims(c)
	if !ok {
		response.Unauthorized(c, "Not authenticated")
		return
	}

	user, err := h.authService.GetUserByID(claims.UserID)
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}

	response.Success(c, gin.H{
		"user": gin.H{
			"id":           user.ID,
			"openId":       user.OpenID,
			"email":        user.Email,
			"name":         user.Name,
			"loginMethod":  user.LoginMethod,
			"lastSignedIn": user.LastSignedIn,
		},
	})
}

// Logout handles POST /api/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// For JWT-based auth, logout is handled client-side by removing the token
	// Server-side, we just acknowledge the request
	response.Success(c, gin.H{
		"message": "Logged out successfully",
	})
}

// Health handles GET /api/health
func (h *AuthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"timestamp": c.GetTime("requestTime"),
	})
}
