import type { Action } from '../types.js';

const http: Action = {
    async run(context, step) {
        const { url, options } = step.input || {};
        if (!url) {
            throw new Error('http action requires a url');
        }
        const res = await fetch(url, options);
        const data = await res.json().catch(() => undefined);
        context.state[step.id] = data;
        return data;
    },
};

export default http;

