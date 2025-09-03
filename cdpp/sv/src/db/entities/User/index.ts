import { DataTypes } from "sequelize";
import { getDB } from "@db/index.js";

export interface User {
    id: number;
    name: string;
    email: string;
}

export const initModel = async () => {
    const db = await getDB();
    db.define(
        "users",
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            name: { type: DataTypes.STRING },
            email: { type: DataTypes.STRING },
        },
        { timestamps: false },
    );
};