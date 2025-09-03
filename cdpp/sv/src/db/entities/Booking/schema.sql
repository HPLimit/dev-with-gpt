CREATE TABLE IF NOT EXISTS bookings
(
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    source_id  INTEGER NOT NULL,
    amount     REAL    NOT NULL,
    created_at INTEGER NOT NULL
);