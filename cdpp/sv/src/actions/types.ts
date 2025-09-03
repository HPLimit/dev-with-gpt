import type { WorkflowContext, Step } from '@workflowEngine/types.js';

export interface Action {
    run(context: WorkflowContext, step: Step): Promise<unknown>;
}