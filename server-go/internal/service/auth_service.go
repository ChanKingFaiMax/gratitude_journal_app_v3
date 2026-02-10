package service

import (
	"fmt"
	"time"

	"github.com/yourusername/gratitude-journal-api/internal/config"
	"github.com/yourusername/gratitude-journal-api/internal/models"
	"github.com/yourusername/gratitude-journal-api/internal/repository"
	"github.com/yourusername/gratitude-journal-api/pkg/jwt"
)

type AuthService struct {
	userRepo     *repository.UserRepository
	emailService *EmailService
	jwtManager   *jwt.JWTManager
}

func NewAuthService(cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo:     repository.NewUserRepository(),
		emailService: NewEmailService(&cfg.Email),
		jwtManager:   jwt.NewJWTManager(cfg.JWT.Secret, cfg.JWT.Expiry),
	}
}

// SendVerificationCode sends a verification code to the email
func (s *AuthService) SendVerificationCode(email, language string) error {
	return s.emailService.SendVerificationCode(email, language)
}

// VerifyEmailAndLogin verifies the code and logs in the user
func (s *AuthService) VerifyEmailAndLogin(email, code, name string) (*AuthResult, error) {
	// Verify the code
	valid, err := s.emailService.VerifyCode(email, code)
	if err != nil {
		return nil, fmt.Errorf("failed to verify code: %w", err)
	}
	if !valid {
		return nil, fmt.Errorf("invalid or expired verification code")
	}

	// Get or create user
	user, err := s.userRepo.GetUserByEmail(email)
	if err != nil {
		// Create new user
		openID := generateOpenID(email)
		userName := name
		if userName == "" {
			userName = extractNameFromEmail(email)
		}

		user = &models.User{
			OpenID:       openID,
			Email:        email,
			Name:         userName,
			LoginMethod:  "email",
			LastSignedIn: time.Now(),
		}
		if err := s.userRepo.CreateUser(user); err != nil {
			return nil, fmt.Errorf("failed to create user: %w", err)
		}
	} else {
		// Update last sign in
		user.LastSignedIn = time.Now()
		if name != "" && name != user.Name {
			user.Name = name
		}
		if err := s.userRepo.UpdateUser(user); err != nil {
			return nil, fmt.Errorf("failed to update user: %w", err)
		}
	}

	// Generate JWT token
	token, err := s.jwtManager.GenerateToken(user.ID, user.OpenID, user.Email, user.Name, user.LoginMethod)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &AuthResult{
		Token: token,
		User:  user,
	}, nil
}

// AuthResult represents the result of authentication
type AuthResult struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

// GetUserByID retrieves a user by ID
func (s *AuthService) GetUserByID(id int64) (*models.User, error) {
	return s.userRepo.GetUserByID(id)
}

// GetUserByOpenID retrieves a user by OpenID
func (s *AuthService) GetUserByOpenID(openID string) (*models.User, error) {
	return s.userRepo.GetUserByOpenID(openID)
}

// GetJWTManager returns the JWT manager
func (s *AuthService) GetJWTManager() *jwt.JWTManager {
	return s.jwtManager
}

// Helper functions
func generateOpenID(email string) string {
	return fmt.Sprintf("email_%s_%d", email, time.Now().UnixNano())
}

func extractNameFromEmail(email string) string {
	for i, c := range email {
		if c == '@' {
			return email[:i]
		}
	}
	return email
}
