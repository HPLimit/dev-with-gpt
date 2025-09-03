import { getDB } from "@db/index.js";
import { migrateAll } from "@db/migrations/index.js";

export const init = async () => {
    // Ensure database schema is ready
    await migrateAll();
    const db = await getDB();

    // Clear existing data
    await db.exec("DELETE FROM bookings; DELETE FROM users;");

    // Seed sample users
    const { lastID: aliceId } = await db.run(
        "INSERT INTO users (name, email) VALUES (?, ?)",
        ["Alice", "alice@example.com"],
    );
    const { lastID: bobId } = await db.run(
        "INSERT INTO users (name, email) VALUES (?, ?)",
        ["Bob", "bob@example.com"],
    );

    // Seed sample bookings linked to users
    await db.run(
        "INSERT INTO bookings (user_id, source_id, amount, created_at) VALUES (?, ?, ?, ?)",
        [aliceId, 1, 100.0, Date.now()],
    );
    await db.run(
        "INSERT INTO bookings (user_id, source_id, amount, created_at) VALUES (?, ?, ?, ?)",
        [bobId, 2, 200.0, Date.now()],
    );

    console.log("✅ Sample data seeded");
};

// Execute immediately when run as a script
if (process.argv[1] && process.argv[1].endsWith("db/seed/index.ts")) {
    init().catch((err) => {
        console.error("❌ Failed to seed data:", err);
    });
}
