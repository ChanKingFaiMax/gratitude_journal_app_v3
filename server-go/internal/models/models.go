package models

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID           int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	OpenID       string    `gorm:"uniqueIndex;not null" json:"openId"`
	Email        string    `gorm:"uniqueIndex" json:"email"`
	Name         string    `gorm:"not null" json:"name"`
	LoginMethod  string    `gorm:"not null" json:"loginMethod"` // email, firebase, google, apple
	LastSignedIn time.Time `gorm:"not null" json:"lastSignedIn"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

// JournalEntry represents a journal entry
type JournalEntry struct {
	ID             int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID         int64     `gorm:"index;not null" json:"userId"`
	LocalID        string    `gorm:"index" json:"localId"`
	Source         string    `gorm:"not null" json:"source"` // gratitude, philosophy, free
	Topic          string    `gorm:"type:text" json:"topic"`
	Content        string    `gorm:"type:text;not null" json:"content"`
	MastersSummary string    `gorm:"type:jsonb" json:"mastersSummary"`
	TimeOfDay      string    `json:"timeOfDay"` // morning, afternoon, evening, night
	CreatedAt      time.Time `gorm:"index;not null" json:"createdAt"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

// UserStats represents user statistics
type UserStats struct {
	ID              int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID          int64     `gorm:"uniqueIndex;not null" json:"userId"`
	TotalEntries    int       `gorm:"default:0" json:"totalEntries"`
	GratitudeCount  int       `gorm:"default:0" json:"gratitudeCount"`
	PhilosophyCount int       `gorm:"default:0" json:"philosophyCount"`
	FreeNoteCount   int       `gorm:"default:0" json:"freeNoteCount"`
	CurrentStreak   int       `gorm:"default:0" json:"currentStreak"`
	LongestStreak   int       `gorm:"default:0" json:"longestStreak"`
	LastEntryDate   time.Time `json:"lastEntryDate"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

// EmailVerification represents an email verification code
type EmailVerification struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Email     string    `gorm:"index;not null" json:"email"`
	Code      string    `gorm:"not null" json:"code"`
	ExpiresAt time.Time `gorm:"not null" json:"expiresAt"`
	Used      bool      `gorm:"default:false" json:"used"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

// TableName overrides
func (User) TableName() string {
	return "users"
}

func (JournalEntry) TableName() string {
	return "journal_entries"
}

func (UserStats) TableName() string {
	return "user_stats"
}

func (EmailVerification) TableName() string {
	return "email_verifications"
}
