package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token has expired")
)

type Claims struct {
	UserID      int64  `json:"userId"`
	OpenID      string `json:"openId"`
	Email       string `json:"email"`
	Name        string `json:"name"`
	LoginMethod string `json:"loginMethod"`
	jwt.RegisteredClaims
}

type JWTManager struct {
	secretKey []byte
	expiry    time.Duration
}

func NewJWTManager(secret string, expiry time.Duration) *JWTManager {
	return &JWTManager{
		secretKey: []byte(secret),
		expiry:    expiry,
	}
}

// GenerateToken generates a new JWT token for a user
func (m *JWTManager) GenerateToken(userID int64, openID, email, name, loginMethod string) (string, error) {
	claims := &Claims{
		UserID:      userID,
		OpenID:      openID,
		Email:       email,
		Name:        name,
		LoginMethod: loginMethod,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "gratitude-journal-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secretKey)
}

// ValidateToken validates a JWT token and returns the claims
func (m *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return m.secretKey, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// RefreshToken generates a new token with extended expiry
func (m *JWTManager) RefreshToken(claims *Claims) (string, error) {
	return m.GenerateToken(claims.UserID, claims.OpenID, claims.Email, claims.Name, claims.LoginMethod)
}
