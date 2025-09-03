import {createUserTable} from "@db/entities/User.js";

export async function migrateAll() {
    await createUserTable();
}