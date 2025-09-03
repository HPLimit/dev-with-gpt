import { DataTypes } from "sequelize";
import { getDB } from "@db/index.js";

export const initModel = async () => {
    const db = await getDB();
    db.define(
        "event_logs",
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            type: { type: DataTypes.STRING },
            payload: { type: DataTypes.TEXT },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        },
        { timestamps: false },
    );
};
