import {initSchema as initUser} from "@db/entities/User/index.ts";
import {initSchema as initBooking} from "@db/entities/Booking/index.js";

export async function migrateAll() {
    await initUser();
    await initBooking();
}