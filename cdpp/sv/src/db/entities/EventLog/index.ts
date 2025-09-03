import { DataTypes } from "sequelize";
import Conn from "@db/index.js";

export const MODEL_EVENT_LOG = "event_logs";

export default Conn.define(
    MODEL_EVENT_LOG,
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        type: { type: DataTypes.STRING },
        payload: { type: DataTypes.TEXT },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { timestamps: false, tableName: MODEL_EVENT_LOG }
);
