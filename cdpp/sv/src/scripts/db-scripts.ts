import {create, remove} from "@eventSource/index.js";
import path from "node:path";
import {MODEL_USER} from "@db/entities/User/index.js";
import {MODEL_BOOKING} from "@db/entities/Booking/index.js";
import {MODEL_WORKFLOW} from "@db/entities/Workflow/index.js";
import {MODEL_TRIGGER} from "@db/entities/Trigger/index.js";
import {MODEL_WORKFLOW_RUN} from "@db/entities/WorkflowRun/index.js";
import {MODEL_STEP_RUN} from "@db/entities/StepRun/index.js";
import * as process from "node:process";
import Conn from "@db/index.ts";

const arrModel = [
    MODEL_STEP_RUN,
    MODEL_WORKFLOW_RUN,
    MODEL_TRIGGER,
    MODEL_WORKFLOW,
    MODEL_BOOKING,
    MODEL_USER,
];

async function main() {
    await Conn.sync();

    for (const model of arrModel) {
        await remove(model, {});
    }

    console.log("✅ All data removed");


    // Seed workflow and related data
    const workflow = (await create(MODEL_WORKFLOW, {
        name: "Sample Booking Workflow",
        definition: {
            steps: [{ id: "log-step", action: "log" }],
        },
        created_at: new Date(),
    })) as any;

    await create(MODEL_TRIGGER, {
        workflow_id: workflow.id,
        type: "bookings.created",
        config: {},
        created_at: new Date(),
    });

    console.log("✅ Sample data seeded");
}

const runAsScript =
    process.argv[1] &&
    path
        .normalize(process.argv[1])
        .endsWith(path.join("scripts", "db-scripts.ts"));

if (runAsScript) {
    main().catch((err) => {
        console.error("❌ Failed to seed data:", err);
    });
}
