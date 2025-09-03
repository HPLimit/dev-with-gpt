import {initSchema as initUser} from "@db/entities/User/index.ts";
import {initSchema as initBooking} from "@db/entities/Booking/index.js";
import {initSchema as initEventLog} from "@db/entities/EventLog/index.js";

export async function migrateAll() {
    await initUser();
    await initBooking();
    await initEventLog();
}