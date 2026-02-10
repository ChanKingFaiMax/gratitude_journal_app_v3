package repository

import (
	"time"

	"github.com/yourusername/gratitude-journal-api/internal/models"
	"gorm.io/gorm"
)

type JournalRepository struct {
	db *gorm.DB
}

func NewJournalRepository() *JournalRepository {
	return &JournalRepository{db: DB}
}

// CreateEntry creates a new journal entry
func (r *JournalRepository) CreateEntry(entry *models.JournalEntry) error {
	return r.db.Create(entry).Error
}

// GetEntryByID retrieves an entry by ID
func (r *JournalRepository) GetEntryByID(id int64) (*models.JournalEntry, error) {
	var entry models.JournalEntry
	err := r.db.First(&entry, id).Error
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

// GetEntryByLocalID retrieves an entry by local ID and user ID
func (r *JournalRepository) GetEntryByLocalID(userID int64, localID string) (*models.JournalEntry, error) {
	var entry models.JournalEntry
	err := r.db.Where("user_id = ? AND local_id = ?", userID, localID).First(&entry).Error
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

// GetEntriesByUserID retrieves all entries for a user
func (r *JournalRepository) GetEntriesByUserID(userID int64) ([]models.JournalEntry, error) {
	var entries []models.JournalEntry
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&entries).Error
	if err != nil {
		return nil, err
	}
	return entries, nil
}

// GetEntriesByUserIDPaginated retrieves entries with pagination
func (r *JournalRepository) GetEntriesByUserIDPaginated(userID int64, limit, offset int) ([]models.JournalEntry, int64, error) {
	var entries []models.JournalEntry
	var total int64

	// Get total count
	r.db.Model(&models.JournalEntry{}).Where("user_id = ?", userID).Count(&total)

	// Get paginated entries
	err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&entries).Error

	if err != nil {
		return nil, 0, err
	}
	return entries, total, nil
}

// GetEntriesSince retrieves entries created after a specific time
func (r *JournalRepository) GetEntriesSince(userID int64, since time.Time) ([]models.JournalEntry, error) {
	var entries []models.JournalEntry
	err := r.db.Where("user_id = ? AND updated_at > ?", userID, since).
		Order("created_at DESC").
		Find(&entries).Error
	if err != nil {
		return nil, err
	}
	return entries, nil
}

// UpdateEntry updates an existing entry
func (r *JournalRepository) UpdateEntry(entry *models.JournalEntry) error {
	return r.db.Save(entry).Error
}

// DeleteEntry deletes an entry
func (r *JournalRepository) DeleteEntry(id int64, userID int64) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.JournalEntry{}).Error
}

// UpsertEntry creates or updates an entry based on local_id
func (r *JournalRepository) UpsertEntry(entry *models.JournalEntry) error {
	var existing models.JournalEntry
	err := r.db.Where("user_id = ? AND local_id = ?", entry.UserID, entry.LocalID).First(&existing).Error

	if err == gorm.ErrRecordNotFound {
		// Create new entry
		return r.db.Create(entry).Error
	} else if err != nil {
		return err
	}

	// Update existing entry
	entry.ID = existing.ID
	return r.db.Save(entry).Error
}

// BulkUpsertEntries upserts multiple entries
func (r *JournalRepository) BulkUpsertEntries(entries []models.JournalEntry) error {
	for i := range entries {
		if err := r.UpsertEntry(&entries[i]); err != nil {
			return err
		}
	}
	return nil
}

// GetRecentEntries retrieves recent entries for AI analysis
func (r *JournalRepository) GetRecentEntries(userID int64, limit int) ([]models.JournalEntry, error) {
	var entries []models.JournalEntry
	err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&entries).Error
	if err != nil {
		return nil, err
	}
	return entries, nil
}

// GetEntriesCount returns the count of entries for a user
func (r *JournalRepository) GetEntriesCount(userID int64) (int64, error) {
	var count int64
	err := r.db.Model(&models.JournalEntry{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

// GetEntriesCountBySource returns counts grouped by source
func (r *JournalRepository) GetEntriesCountBySource(userID int64) (map[string]int64, error) {
	type Result struct {
		Source string
		Count  int64
	}
	var results []Result

	err := r.db.Model(&models.JournalEntry{}).
		Select("source, count(*) as count").
		Where("user_id = ?", userID).
		Group("source").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	counts := make(map[string]int64)
	for _, r := range results {
		counts[r.Source] = r.Count
	}
	return counts, nil
}
