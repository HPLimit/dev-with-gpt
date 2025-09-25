package models

import (
	"time"

	"gorm.io/gorm"
)

type Timestamps struct {
	CreatedAt time.Time
	UpdatedAt time.Time
}

type SoftDelete struct {
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

type BaseModel struct {
	ID uint `gorm:"primaryKey"`
}
