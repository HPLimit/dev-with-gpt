package db

type MigrationError struct {
	Model string
	Err   error
}

func (e *MigrationError) Error() MigrationError {
	return *e
}
