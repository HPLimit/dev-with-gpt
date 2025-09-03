import { DataTypes } from "sequelize";
import Conn from "@db/index.js";
import { MODEL_WORKFLOW } from "@db/entities/Workflow/index.js";

export const MODEL_TRIGGER = "triggers";

export default Conn.define(
    MODEL_TRIGGER,
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        workflow_id: {
            type: DataTypes.INTEGER,
            references: { model: MODEL_WORKFLOW, key: "id" },
        },
        type: { type: DataTypes.STRING },
        config: { type: DataTypes.JSON },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { timestamps: false, tableName: MODEL_TRIGGER },
);
