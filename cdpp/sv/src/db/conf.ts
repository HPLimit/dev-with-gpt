import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.join(__dirname, "../../../.data");
const dbPath = path.join(dbDir, "database.sqlite");

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, "");
}

export const DB_PATH = dbPath;