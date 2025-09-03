import { DataTypes } from "sequelize";
import Conn from "@db/index.js";
import { MODEL_WORKFLOW } from "@db/entities/Workflow/index.js";

export const MODEL_WORKFLOW_RUN = "workflow_runs";

export default Conn.define(
    MODEL_WORKFLOW_RUN,
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        workflow_id: {
            type: DataTypes.INTEGER,
            references: { model: MODEL_WORKFLOW, key: "id" },
        },
        status: { type: DataTypes.STRING },
        started_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        finished_at: { type: DataTypes.DATE },
    },
    { timestamps: false, tableName: MODEL_WORKFLOW_RUN },
);
