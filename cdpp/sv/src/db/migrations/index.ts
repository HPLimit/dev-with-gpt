import { initModel as initUser } from "@db/entities/User/index.ts";
import { initModel as initBooking } from "@db/entities/Booking/index.ts";
import { initModel as initEventLog } from "@db/entities/EventLog/index.ts";
import { getDB } from "@db/index.js";

export async function migrateAll() {
    await initUser();
    await initBooking();
    await initEventLog();
    const db = await getDB();
    await db.sync();
}