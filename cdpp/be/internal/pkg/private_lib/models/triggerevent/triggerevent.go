package triggerevent

import (
	"github.com/HPLimit/dev-with-gpt.git/be/internal/pkg/private_lib/models"
	"gorm.io/gorm"
)

type TriggerEvent struct {
	models.SilentModel
	models.Timestamps
}

func Migrate(db *gorm.DB) error { return db.AutoMigrate(&TriggerEvent{}) }
