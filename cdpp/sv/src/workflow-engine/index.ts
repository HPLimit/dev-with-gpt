import { bus } from '@eventSource/index.js';
import { getModel } from '@db/index.js';
import { MODEL_TRIGGER } from '@db/entities/Trigger/index.js';
import { MODEL_WORKFLOW } from '@db/entities/Workflow/index.js';
import { MODEL_WORKFLOW_RUN } from '@db/entities/WorkflowRun/index.js';
import { MODEL_STEP_RUN } from '@db/entities/StepRun/index.js';
import type { Event } from '@eventSource/types.js';
import type { Workflow, WorkflowContext } from './types.js';
import { getAction, init as initActions } from '@actions/index.js';

const runWorkflow = async (workflowRow: any, event?: Event) => {
    const workflow: Workflow = workflowRow.definition;
    const workflowRunModel = getModel(MODEL_WORKFLOW_RUN);
    const stepRunModel = getModel(MODEL_STEP_RUN);

    const workflowRun = await workflowRunModel.create({
        workflow_id: workflowRow.id,
        status: 'running',
        started_at: new Date(),
    });

    const context: WorkflowContext = { workflow, event, state: {} };

    for (const step of workflow.steps) {
        const stepRun = await stepRunModel.create({
            workflow_run_id: workflowRun.id,
            step_id: step.id,
            status: 'running',
            started_at: new Date(),
        });

        const action = getAction(step.action);
        const retries = step.retry ?? 0;
        let output: any;
        let success = false;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                output = await action.run(context, step);
                success = true;
                break;
            } catch (err) {
                if (attempt === retries) {
                    await stepRun.update({
                        status: 'failed',
                        finished_at: new Date(),
                        output: { error: (err as Error).message },
                    });
                    await workflowRun.update({
                        status: 'failed',
                        finished_at: new Date(),
                    });
                    return;
                }
            }
        }

        context.state[step.id] = output;
        await stepRun.update({
            status: 'completed',
            finished_at: new Date(),
            output,
        });

        if (!success) return;
    }

    await workflowRun.update({
        status: 'completed',
        finished_at: new Date(),
    });
};

export const init = async () => {
    await initActions();

    const triggerModel = getModel(MODEL_TRIGGER);
    const workflowModel = getModel(MODEL_WORKFLOW);

    const triggers = await triggerModel.findAll({ raw: true });

    for (const trigger of triggers) {
        bus.on(trigger.type, async (event: Event) => {
            const wf = await workflowModel.findByPk(trigger.workflow_id, {
                raw: true,
            });
            if (!wf) return;
            await runWorkflow(wf, event);
        });
    }
};

export { runWorkflow };

