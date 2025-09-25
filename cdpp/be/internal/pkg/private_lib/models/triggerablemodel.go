package models

import (
	"fmt"

	"gorm.io/gorm"
)

type TriggerableModel struct {
	BaseModel
}

func (m *TriggerableModel) BeforeCreate(tx *gorm.DB) (err error) {
	fmt.Println("BeforeCreate: triggerable model")
	return nil
}
