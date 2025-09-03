import { EventEmitter } from "node:events";
import { getDB } from "@db/index.js";
import type { Event } from "@eventSource/types.ts";

export const bus = new EventEmitter();

const logEvent = async (event: Event) => {
    const db = await getDB();
    await db.run(
        "INSERT INTO event_logs (type, payload) VALUES (?, ?)",
        event.type,
        JSON.stringify(event.payload),
    );
};

export const create = async (
    table: string,
    data: Record<string, unknown>,
) => {
    const db = await getDB();
    const keys = Object.keys(data);
    const placeholders = keys.map(() => "?").join(", ");
    const values = Object.values(data);
    const result = await db.run(
        `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
        values,
    );
    const event: Event = { type: `${table}.created`, payload: data };
    bus.emit(event.type, event);
    await logEvent(event);
    return result;
};

export const update = async (
    table: string,
    data: Record<string, unknown>,
    where: string,
    params: any[] = [],
) => {
    const db = await getDB();
    const assignments = Object.keys(data)
        .map((k) => `${k} = ?`)
        .join(", ");
    const values: any[] = [...Object.values(data), ...params];
    await db.run(
        `UPDATE ${table} SET ${assignments} WHERE ${where}`,
        values,
    );
    const event: Event = { type: `${table}.updated`, payload: { data, where, params } };
    bus.emit(event.type, event);
    await logEvent(event);
};

export const remove = async (
    table: string,
    where: string,
    params: any[] = [],
) => {
    const db = await getDB();
    await db.run(`DELETE FROM ${table} WHERE ${where}`, params);
    const event: Event = { type: `${table}.deleted`, payload: { where, params } };
    bus.emit(event.type, event);
    await logEvent(event);
};

export const find = async (
    table: string,
    where = "1=1",
    params: any[] = [],
) => {
    const db = await getDB();
    return db.all(`SELECT * FROM ${table} WHERE ${where}`, params);
};

export const init = () => {
    // no-op for now
};
