package db

import (
	"github.com/HPLimit/dev-with-gpt.git/be/internal/pkg/private_lib/models/triggerevent"
	"github.com/HPLimit/dev-with-gpt.git/be/internal/pkg/private_lib/models/user"
)

func MigrateAllModel(dns string) error {
	Init(dns)

	err := user.Migrate(&*DB)
	err2 := triggerevent.Migrate(&*DB)

	if err != nil || err2 != nil {
		return err
	}

	return nil
}
