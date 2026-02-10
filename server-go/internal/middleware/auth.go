package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/gratitude-journal-api/pkg/jwt"
	"github.com/yourusername/gratitude-journal-api/pkg/response"
)

const (
	AuthorizationHeader = "Authorization"
	BearerPrefix        = "Bearer "
	UserClaimsKey       = "userClaims"
)

// AuthMiddleware creates a JWT authentication middleware
func AuthMiddleware(jwtManager *jwt.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader(AuthorizationHeader)
		if authHeader == "" {
			response.Unauthorized(c, "Authorization header is required")
			c.Abort()
			return
		}

		if !strings.HasPrefix(authHeader, BearerPrefix) {
			response.Unauthorized(c, "Invalid authorization header format")
			c.Abort()
			return
		}

		token := strings.TrimPrefix(authHeader, BearerPrefix)
		claims, err := jwtManager.ValidateToken(token)
		if err != nil {
			if err == jwt.ErrExpiredToken {
				response.Unauthorized(c, "Token has expired")
			} else {
				response.Unauthorized(c, "Invalid token")
			}
			c.Abort()
			return
		}

		// Store claims in context for later use
		c.Set(UserClaimsKey, claims)
		c.Next()
	}
}

// OptionalAuthMiddleware creates an optional authentication middleware
// It doesn't abort if no token is provided, but validates if one is present
func OptionalAuthMiddleware(jwtManager *jwt.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader(AuthorizationHeader)
		if authHeader == "" {
			c.Next()
			return
		}

		if !strings.HasPrefix(authHeader, BearerPrefix) {
			c.Next()
			return
		}

		token := strings.TrimPrefix(authHeader, BearerPrefix)
		claims, err := jwtManager.ValidateToken(token)
		if err == nil {
			c.Set(UserClaimsKey, claims)
		}

		c.Next()
	}
}

// GetUserClaims retrieves user claims from context
func GetUserClaims(c *gin.Context) (*jwt.Claims, bool) {
	claims, exists := c.Get(UserClaimsKey)
	if !exists {
		return nil, false
	}
	userClaims, ok := claims.(*jwt.Claims)
	return userClaims, ok
}

// GetUserID retrieves user ID from context
func GetUserID(c *gin.Context) (int64, bool) {
	claims, ok := GetUserClaims(c)
	if !ok {
		return 0, false
	}
	return claims.UserID, true
}
