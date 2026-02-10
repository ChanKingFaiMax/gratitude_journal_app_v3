package service

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"github.com/yourusername/gratitude-journal-api/internal/config"
	"github.com/yourusername/gratitude-journal-api/internal/models"
	"github.com/yourusername/gratitude-journal-api/internal/repository"
	"gopkg.in/gomail.v2"
)

type EmailService struct {
	config   *config.EmailConfig
	repo     *repository.EmailVerificationRepository
	dialer   *gomail.Dialer
}

func NewEmailService(cfg *config.EmailConfig) *EmailService {
	dialer := gomail.NewDialer(cfg.Host, cfg.Port, cfg.User, cfg.Password)
	return &EmailService{
		config: cfg,
		repo:   repository.NewEmailVerificationRepository(),
		dialer: dialer,
	}
}

// GenerateVerificationCode generates a 6-digit verification code
func (s *EmailService) GenerateVerificationCode() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// SendVerificationCode sends a verification code to the email
func (s *EmailService) SendVerificationCode(email, language string) error {
	// Generate code
	code, err := s.GenerateVerificationCode()
	if err != nil {
		return fmt.Errorf("failed to generate code: %w", err)
	}

	// Delete any existing codes for this email
	_ = s.repo.DeleteVerificationsByEmail(email)

	// Save verification to database
	verification := &models.EmailVerification{
		Email:     email,
		Code:      code,
		ExpiresAt: time.Now().Add(5 * time.Minute),
		Used:      false,
	}
	if err := s.repo.CreateVerification(verification); err != nil {
		return fmt.Errorf("failed to save verification: %w", err)
	}

	// Send email
	if err := s.sendEmail(email, code, language); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

// VerifyCode verifies the code and returns true if valid
func (s *EmailService) VerifyCode(email, code string) (bool, error) {
	verification, err := s.repo.GetValidVerification(email, code)
	if err != nil {
		return false, nil // Invalid code
	}

	// Mark as used
	if err := s.repo.MarkAsUsed(verification.ID); err != nil {
		return false, fmt.Errorf("failed to mark verification as used: %w", err)
	}

	return true, nil
}

func (s *EmailService) sendEmail(to, code, language string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", s.config.From)
	m.SetHeader("To", to)

	var subject, body string
	if language == "en" {
		subject = "Awaken - Your Verification Code"
		body = s.getEnglishEmailBody(code)
	} else {
		subject = "觉醒日志 - 您的验证码"
		body = s.getChineseEmailBody(code)
	}

	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	return s.dialer.DialAndSend(m)
}

func (s *EmailService) getChineseEmailBody(code string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo-text { font-size: 28px; font-weight: bold; color: #FF8C00; }
        .title { font-size: 20px; color: #333; margin-bottom: 20px; text-align: center; }
        .code-box { background: linear-gradient(135deg, #FF8C00, #FFA500); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
        .code { font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px; }
        .note { color: #666; font-size: 14px; text-align: center; margin-top: 20px; }
        .footer { color: #999; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <span class="logo-text">🌅 觉醒日志</span>
        </div>
        <div class="title">您的登录验证码</div>
        <div class="code-box">
            <div class="code">%s</div>
        </div>
        <div class="note">
            验证码有效期为 5 分钟<br>
            如果这不是您的操作，请忽略此邮件
        </div>
        <div class="footer">
            © 2025 Awaken Journal · 觉醒日志
        </div>
    </div>
</body>
</html>
`, code)
}

func (s *EmailService) getEnglishEmailBody(code string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo-text { font-size: 28px; font-weight: bold; color: #FF8C00; }
        .title { font-size: 20px; color: #333; margin-bottom: 20px; text-align: center; }
        .code-box { background: linear-gradient(135deg, #FF8C00, #FFA500); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
        .code { font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px; }
        .note { color: #666; font-size: 14px; text-align: center; margin-top: 20px; }
        .footer { color: #999; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <span class="logo-text">🌅 Awaken</span>
        </div>
        <div class="title">Your Verification Code</div>
        <div class="code-box">
            <div class="code">%s</div>
        </div>
        <div class="note">
            This code expires in 5 minutes<br>
            If you didn't request this, please ignore this email
        </div>
        <div class="footer">
            © 2025 Awaken Journal
        </div>
    </div>
</body>
</html>
`, code)
}

// CleanupExpiredVerifications removes expired verification codes
func (s *EmailService) CleanupExpiredVerifications() error {
	return s.repo.DeleteExpiredVerifications()
}
