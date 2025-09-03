import { DataTypes } from "sequelize";
import Conn from "@db/index.js";

export const MODEL_WORKFLOW = "workflows";

export default Conn.define(
    MODEL_WORKFLOW,
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING },
        definition: { type: DataTypes.JSON },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { timestamps: false, tableName: MODEL_WORKFLOW },
);
