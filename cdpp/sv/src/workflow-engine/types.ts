export interface Step {
    id: string;
    action: string;
}

export interface Workflow {
    id: string;
    steps: Step[];
}

export interface WorkflowContext {
    workflow: Workflow;
}