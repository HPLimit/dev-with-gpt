#!/usr/bin/env node
import Conn from '@db/index.ts';
import { create, update } from '@eventSource/index.ts';
import '@db/entities/Booking/index.js';
import '@db/entities/EventLog/index.js';
import '@db/entities/StepRun/index.js';
import '@db/entities/Trigger/index.js';
import '@db/entities/User/index.js';
import '@db/entities/Workflow/index.js';
import '@db/entities/WorkflowRun/index.js';

const args = process.argv.slice(2);
const [command, table, ...rest] = args;

function parseOptions(parts: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const part of parts) {
    const cleaned = part.replace(/^--?/, '');
    const [key, value] = cleaned.split('=');
    result[key] = value ?? true;
  }
  return result;
}

await Conn.sync();

if (!command || !table) {
  console.error('Usage: evs <create|update> <table> [--field=value]');
  process.exit(1);
}

switch (command) {
  case 'create': {
    const data = parseOptions(rest);
    const result = await create(table, data);
    console.log(JSON.stringify(result, null, 2));
    break;
  }
  case 'update': {
    const opts = parseOptions(rest);
    if (!('id' in opts)) {
      console.error('Missing required option: id');
      process.exit(1);
    }
    const { id, ...data } = opts as any;
    await update(table, data, { id });
    console.log('✅ Updated successfully');
    break;
  }
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
