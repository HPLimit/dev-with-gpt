import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

import type { Action } from './types.js';

const actions: Record<string, Action> = {};

export const registerAction = (name: string, action: Action) => {
    actions[name] = action;
};

export const getAction = (name: string): Action => {
    const action = actions[name];
    if (!action) {
        throw new Error(`Action not found: ${name}`);
    }
    return action;
};

export const init = async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const pluginsDir = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginsDir)) return;
    const files = fs
        .readdirSync(pluginsDir)
        .filter((f) => f.endsWith('.ts') || f.endsWith('.js'));
    for (const file of files) {
        const mod = await import(`./plugins/${file}`);
        const action = mod.default as Action;
        const name = file.replace(/\.(ts|js)$/, '');
        registerAction(name, action);
    }
};

