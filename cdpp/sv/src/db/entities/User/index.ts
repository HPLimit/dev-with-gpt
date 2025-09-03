import { DataTypes } from "sequelize";
import Conn from "@db/index.ts";

export const MODEL_USER = "users";

export default Conn.define(
    MODEL_USER,
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING },
        email: { type: DataTypes.STRING, unique: true },
    },
    { timestamps: true, tableName: MODEL_USER },
)