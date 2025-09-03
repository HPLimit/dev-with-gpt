import type { Action } from '../types.js';

const log: Action = {
    async run(_context, step) {
        console.log('📝', step.input ?? step.id);
    },
};

export default log;

