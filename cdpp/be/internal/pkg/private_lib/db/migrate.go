package db

import "github.com/HPLimit/dev-with-gpt.git/be/internal/pkg/private_lib/models/user"

func MigrateAllModel(dns string) error {
	Init(dns)

	err := user.Migrate(&*DB)

	return err
}
