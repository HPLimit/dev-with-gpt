import { create, remove } from "@eventSource/index.js";
import path from "node:path";
import { MODEL_USER } from "@db/entities/User/index.js";
import { MODEL_BOOKING } from "@db/entities/Booking/index.js";
import { MODEL_WORKFLOW } from "@db/entities/Workflow/index.js";
import { MODEL_TRIGGER } from "@db/entities/Trigger/index.js";
import { MODEL_WORKFLOW_RUN } from "@db/entities/WorkflowRun/index.js";
import { MODEL_STEP_RUN } from "@db/entities/StepRun/index.js";
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

    // Seed sample users
    const alice = (await create(MODEL_USER, {
        name: "Alice",
        email: "alice@example.com",
    })) as any;
    const bob = (await create(MODEL_USER, {
        name: "Bob",
        email: "bob@example.com",
    })) as any;

    // Seed sample bookings linked to users
    await create(MODEL_BOOKING, {
        user_id: alice.id,
        source_id: 1,
        amount: 100.0,
        created_at: Date.now(),
    });
    await create(MODEL_BOOKING, {
        user_id: bob.id,
        source_id: 2,
        amount: 200.0,
        created_at: Date.now(),
    });

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

    const workflowRun = (await create(MODEL_WORKFLOW_RUN, {
        workflow_id: workflow.id,
        status: "completed",
        started_at: new Date(),
        finished_at: new Date(),
    })) as any;

    await create(MODEL_STEP_RUN, {
        workflow_run_id: workflowRun.id,
        step_id: "log-step",
        status: "completed",
        started_at: new Date(),
        finished_at: new Date(),
        output: { message: "booking logged" },
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
