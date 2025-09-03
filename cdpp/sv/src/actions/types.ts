import type { WorkflowContext } from '@workflowEngine/types.js';

export interface Action {
    run(context: WorkflowContext): Promise<void>;
}