import { Sequelize } from "sequelize";
import { DB_PATH } from "@db/conf.js";

const DB = new Sequelize({
    dialect: "sqlite",
    storage: DB_PATH,
    logging: false,
});

export default DB;

export function getModel(tableName: string): any {
    const model = DB.models[tableName];
    if (!model) {
        throw new Error(`Model not found: ${tableName}`);
    }
    return model;
}