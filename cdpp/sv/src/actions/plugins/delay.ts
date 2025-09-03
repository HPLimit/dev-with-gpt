import type { Action } from '../types.js';

const delay: Action = {
    async run(_context, step) {
        const ms =
            typeof step.input === 'number'
                ? step.input
                : Number(step.input?.ms ?? 0);
        await new Promise((resolve) => setTimeout(resolve, ms));
    },
};

export default delay;

