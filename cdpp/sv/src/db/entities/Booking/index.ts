import { DataTypes } from "sequelize";
import { getDB } from "@db/index.js";

export const initModel = async () => {
    const db = await getDB();
    db.define(
        "bookings",
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            user_id: { type: DataTypes.INTEGER },
            source_id: { type: DataTypes.INTEGER },
            amount: { type: DataTypes.FLOAT },
            created_at: { type: DataTypes.BIGINT },
        },
        { timestamps: false },
    );
};