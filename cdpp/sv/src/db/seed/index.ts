import { migrateAll } from "@db/migrations/index.js";
import { create, remove } from "@eventSource/index.js";
import path from "node:path";

export const init = async () => {
    // Ensure database schema is ready
    await migrateAll();
 // Clear existing data
    await remove("bookings", "1=1");
    await remove("users", "1=1");

    // Seed sample users
    const { lastID: aliceId } = await create("users", {
        name: "Alice",
        email: "alice@example.com",
    });
    const { lastID: bobId } = await create("users", {
        name: "Bob",
        email: "bob@example.com",
    });

    // Seed sample bookings linked to users
    await create("bookings", {
        user_id: aliceId,
        source_id: 1,
        amount: 100.0,
        created_at: Date.now(),
    });
    await create("bookings", {
        user_id: bobId,
        source_id: 2,
        amount: 200.0,
        created_at: Date.now(),
    });

    console.log("✅ Sample data seeded");
};

// Execute immediately when run as a script
const runAsScript =
    process.argv[1] && path.normalize(process.argv[1]).endsWith(path.join("db", "seed", "index.ts"));

if (runAsScript) {
    init().catch((err) => {
        console.error("❌ Failed to seed data:", err);
    });
}
