import { DataTypes } from "sequelize";
import Conn from "@db/index.js";
import { MODEL_WORKFLOW_RUN } from "@db/entities/WorkflowRun/index.js";

export const MODEL_STEP_RUN = "step_runs";

export default Conn.define(
    MODEL_STEP_RUN,
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        workflow_run_id: {
            type: DataTypes.INTEGER,
            references: { model: MODEL_WORKFLOW_RUN, key: "id" },
        },
        step_id: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING },
        started_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        finished_at: { type: DataTypes.DATE },
        output: { type: DataTypes.JSON },
    },
    { timestamps: false, tableName: MODEL_STEP_RUN },
);
