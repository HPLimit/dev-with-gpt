package main

import (
	"log"

	"github.com/HPLimit/dev-with-gpt.git/be/internal/pkg/private_lib/db"
)

func main() {
	err := db.MigrateAllModel("../.data/database.sqlite")

	if err != nil {
		log.Fatal(err)
	}
}
