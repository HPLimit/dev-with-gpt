import {getDB} from "@db/index.js";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");

export interface User {
    id: number;
    name: string;
    email: string;
}

export const initSchema = async () => {
    const db = await getDB();

    await db.exec(schema);
    console.log("✅ users table ready");
};