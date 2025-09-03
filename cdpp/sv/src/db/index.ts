import {Database, open} from "sqlite";
import {CONFIG} from "@db/conf.js";


let db: Database | null = null;

export const getDB = async () => {
    if (db === null) {
        db = await open(CONFIG);
    }
    return db;
};
