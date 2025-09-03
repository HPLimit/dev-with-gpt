declare module 'sequelize' {
    export class Sequelize {
        constructor(options?: any);
        models: Record<string, any>;
        define(name: string, attributes: any, options?: any): any;
        sync(): Promise<void>;
    }

    export class Model<T = any, T2 = any> {}

    export const DataTypes: any;
}

