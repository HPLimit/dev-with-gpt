import {DataTypes} from "sequelize";
import Conn from "@db/index.js";

export const MODEL_BOOKING = "bookings";

export default Conn.define(
    MODEL_BOOKING,
    {
        id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        user_id: {type: DataTypes.INTEGER},
        source_id: {type: DataTypes.INTEGER},
        amount: {type: DataTypes.FLOAT},
        created_at: {type: DataTypes.BIGINT},
    },
    {timestamps: false, tableName: MODEL_BOOKING},
);

export function getModel(modelName: string) {
    return Conn.models[modelName]
}