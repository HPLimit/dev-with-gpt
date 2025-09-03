import type { Event } from '@eventSource/types.js';

export interface Step {
    id: string;
    action: string;
    input?: any;
    retry?: number;
}

export interface Workflow {
    id: string;
    steps: Step[];
}

export interface WorkflowContext {
    workflow: Workflow;
    event?: Event;
    state: Record<string, any>;
}