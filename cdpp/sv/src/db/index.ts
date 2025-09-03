import { Sequelize } from "sequelize";
import { DB_PATH } from "@db/conf.js";

let db: Sequelize | null = null;

export const getDB = async () => {
    if (db === null) {
        db = new Sequelize({
            dialect: "sqlite",
            storage: DB_PATH,
            logging: false,
        });
    }
    return db;
};
