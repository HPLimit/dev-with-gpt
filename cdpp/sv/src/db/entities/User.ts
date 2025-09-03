import {getDB} from "@db/index.js";

export interface User {
    id: number;
    name: string;
    email: string;
}

export const createUserTable = async () => {
    const db = await getDB();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users
        (
            id
            INTEGER
            PRIMARY
            KEY
            AUTOINCREMENT,
            name
            TEXT
            NOT
            NULL,
            email
            TEXT
            UNIQUE
            NOT
            NULL
        )
    `);
    console.log("✅ users table ready");
};