import {create, remove} from "@eventSource/index.js";
import path from "node:path";
import {MODEL_USER} from "@db/entities/User/index.js";
import {MODEL_BOOKING} from "@db/entities/Booking/index.js";
import * as process from "node:process";
import Conn from '@db/index.ts';

const arrModel = [MODEL_USER, MODEL_BOOKING];

async function main() {
    await Conn.sync();

    for (let model of arrModel) {
        await remove(model, {});
    }

    console.log("✅ All data removed");

    // Seed sample users
    const alice = (await create(MODEL_USER, {
        name: "Alice",
        email: "alice@example.com",
    })) as any;
    const bob = (await create(MODEL_USER, {
        name: "Bob",
        email: "bob@example.com",
    })) as any;

    // Seed sample bookings linked to users
    await create(MODEL_BOOKING, {
        user_id: alice.id,
        source_id: 1,
        amount: 100.0,
        created_at: Date.now(),
    });
    await create(MODEL_BOOKING, {
        user_id: bob.id,
        source_id: 2,
        amount: 200.0,
        created_at: Date.now(),
    });

    console.log("✅ Sample data seeded");
}

const runAsScript = process.argv[1] && path.normalize(process.argv[1])
    .endsWith(path.join("scripts", "db-scripts.ts"));

if (runAsScript) {
    main().catch((err) => {
        console.error("❌ Failed to seed data:", err);
    });
}
