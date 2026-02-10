package repository

import (
	"time"

	"github.com/yourusername/gratitude-journal-api/internal/models"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository() *UserRepository {
	return &UserRepository{db: DB}
}

// CreateUser creates a new user
func (r *UserRepository) CreateUser(user *models.User) error {
	return r.db.Create(user).Error
}

// GetUserByID retrieves a user by ID
func (r *UserRepository) GetUserByID(id int64) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByOpenID retrieves a user by OpenID
func (r *UserRepository) GetUserByOpenID(openID string) (*models.User, error) {
	var user models.User
	err := r.db.Where("open_id = ?", openID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByEmail retrieves a user by email
func (r *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateUser updates a user
func (r *UserRepository) UpdateUser(user *models.User) error {
	return r.db.Save(user).Error
}

// UpsertUser creates or updates a user
func (r *UserRepository) UpsertUser(user *models.User) error {
	var existing models.User
	err := r.db.Where("open_id = ?", user.OpenID).First(&existing).Error
	
	if err == gorm.ErrRecordNotFound {
		// Create new user
		return r.db.Create(user).Error
	} else if err != nil {
		return err
	}
	
	// Update existing user
	user.ID = existing.ID
	user.CreatedAt = existing.CreatedAt
	return r.db.Save(user).Error
}

// UpdateLastSignIn updates the last sign in time
func (r *UserRepository) UpdateLastSignIn(userID int64) error {
	return r.db.Model(&models.User{}).
		Where("id = ?", userID).
		Update("last_signed_in", time.Now()).Error
}
