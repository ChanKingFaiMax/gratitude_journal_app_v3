package repository

import (
	"time"

	"github.com/yourusername/gratitude-journal-api/internal/models"
	"gorm.io/gorm"
)

type StatsRepository struct {
	db *gorm.DB
}

func NewStatsRepository() *StatsRepository {
	return &StatsRepository{db: DB}
}

// GetStatsByUserID retrieves stats for a user
func (r *StatsRepository) GetStatsByUserID(userID int64) (*models.UserStats, error) {
	var stats models.UserStats
	err := r.db.Where("user_id = ?", userID).First(&stats).Error
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

// CreateStats creates new stats for a user
func (r *StatsRepository) CreateStats(stats *models.UserStats) error {
	return r.db.Create(stats).Error
}

// UpdateStats updates user stats
func (r *StatsRepository) UpdateStats(stats *models.UserStats) error {
	return r.db.Save(stats).Error
}

// UpsertStats creates or updates user stats
func (r *StatsRepository) UpsertStats(stats *models.UserStats) error {
	var existing models.UserStats
	err := r.db.Where("user_id = ?", stats.UserID).First(&existing).Error

	if err == gorm.ErrRecordNotFound {
		return r.db.Create(stats).Error
	} else if err != nil {
		return err
	}

	stats.ID = existing.ID
	return r.db.Save(stats).Error
}

// IncrementEntryCount increments the entry count for a user
func (r *StatsRepository) IncrementEntryCount(userID int64, source string) error {
	var stats models.UserStats
	err := r.db.Where("user_id = ?", userID).First(&stats).Error

	if err == gorm.ErrRecordNotFound {
		// Create new stats
		stats = models.UserStats{
			UserID:          userID,
			TotalEntries:    1,
			LastEntryDate:   time.Now(),
			CurrentStreak:   1,
			LongestStreak:   1,
		}
		switch source {
		case "gratitude":
			stats.GratitudeCount = 1
		case "philosophy":
			stats.PhilosophyCount = 1
		case "free":
			stats.FreeNoteCount = 1
		}
		return r.db.Create(&stats).Error
	} else if err != nil {
		return err
	}

	// Update existing stats
	stats.TotalEntries++
	switch source {
	case "gratitude":
		stats.GratitudeCount++
	case "philosophy":
		stats.PhilosophyCount++
	case "free":
		stats.FreeNoteCount++
	}

	// Update streak
	now := time.Now()
	lastEntry := stats.LastEntryDate
	daysSinceLastEntry := int(now.Sub(lastEntry).Hours() / 24)

	if daysSinceLastEntry <= 1 {
		if daysSinceLastEntry == 1 {
			stats.CurrentStreak++
		}
		// Same day, streak unchanged
	} else {
		stats.CurrentStreak = 1
	}

	if stats.CurrentStreak > stats.LongestStreak {
		stats.LongestStreak = stats.CurrentStreak
	}

	stats.LastEntryDate = now

	return r.db.Save(&stats).Error
}

// EmailVerificationRepository
type EmailVerificationRepository struct {
	db *gorm.DB
}

func NewEmailVerificationRepository() *EmailVerificationRepository {
	return &EmailVerificationRepository{db: DB}
}

// CreateVerification creates a new email verification
func (r *EmailVerificationRepository) CreateVerification(v *models.EmailVerification) error {
	return r.db.Create(v).Error
}

// GetValidVerification retrieves a valid (unused, not expired) verification
func (r *EmailVerificationRepository) GetValidVerification(email, code string) (*models.EmailVerification, error) {
	var v models.EmailVerification
	err := r.db.Where("email = ? AND code = ? AND used = false AND expires_at > ?", 
		email, code, time.Now()).First(&v).Error
	if err != nil {
		return nil, err
	}
	return &v, nil
}

// MarkAsUsed marks a verification as used
func (r *EmailVerificationRepository) MarkAsUsed(id int64) error {
	return r.db.Model(&models.EmailVerification{}).Where("id = ?", id).Update("used", true).Error
}

// DeleteExpiredVerifications deletes expired verifications
func (r *EmailVerificationRepository) DeleteExpiredVerifications() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&models.EmailVerification{}).Error
}

// DeleteVerificationsByEmail deletes all verifications for an email
func (r *EmailVerificationRepository) DeleteVerificationsByEmail(email string) error {
	return r.db.Where("email = ?", email).Delete(&models.EmailVerification{}).Error
}
