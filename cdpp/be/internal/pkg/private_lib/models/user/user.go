package user

import (
	"github.com/HPLimit/dev-with-gpt.git/be/internal/pkg/private_lib/models"
	"gorm.io/gorm"
)

type User struct {
	Username string `gorm:"uniqueIndex;size:64;not null"`
	Email    string `gorm:"uniqueIndex;size:128;not null"`
	Password string `gorm:"size:256;not null"`

	models.TriggerableModel
	models.Timestamps
	models.SoftDelete
}

func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(&User{})
}
