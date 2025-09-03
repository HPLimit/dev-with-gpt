import { EventEmitter } from "node:events";
import { getDB } from "@db/index.js";
import type { Event } from "@eventSource/types.ts";

export const bus = new EventEmitter();

const getModel = async (table: string) => {
    const db = await getDB();
    const model = db.models[table];
    if (!model) {
        throw new Error(`Model not found: ${table}`);
    }
    return model;
};

const logEvent = async (event: Event) => {
    const model = await getModel("event_logs");
    await model.create({
        type: event.type,
        payload: JSON.stringify(event.payload),
    });
};

export const create = async (
    table: string,
    data: Record<string, unknown>,
) => {
    const model = await getModel(table);
    const instance = await model.create(data);
    const result = instance.toJSON() as Record<string, unknown>;
    const event: Event = { type: `${table}.created`, payload: result };
    bus.emit(event.type, event);
    await logEvent(event);
    return result;
};

export const update = async (
    table: string,
    data: Record<string, unknown>,
    where: Record<string, unknown>,
) => {
    const model = await getModel(table);
    await model.update(data, { where });
    const event: Event = { type: `${table}.updated`, payload: { data, where } };
    bus.emit(event.type, event);
    await logEvent(event);
};

export const remove = async (
    table: string,
    where: Record<string, unknown>,
) => {
    const model = await getModel(table);
    await model.destroy({ where });
    const event: Event = { type: `${table}.deleted`, payload: { where } };
    bus.emit(event.type, event);
    await logEvent(event);
};

export const find = async (
    table: string,
where: Record<string, unknown> = {},
) => {
    const model = await getModel(table);
    return model.findAll({ where, raw: true });
};

export const init = () => {
    // no-op for now
};
