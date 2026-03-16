/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */
import mongoose from "mongoose";

import config from "@/config";
import { logger } from "./winston";

/**
 * Types
 */
import type { ConnectOptions } from "mongoose";

/**
 * Client option
 */
const clientOptions: ConnectOptions = {
    dbName: 'realtime-messager-app',
    appName: 'Realtime Messenger API',
    serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
    },
};

export const connectToDatabase = async (): Promise<void> => {
    if (!config.MONGO_URI) {
        throw new Error('MongoDB URI is not defined in the configutation.');
    }

    try {
        await mongoose.connect(config.MONGO_URI, clientOptions);
        logger.info('Connected to the database successfully.', {
            url: config.MONGO_URI,
            Option: clientOptions,
        });

    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }

        logger.error('Error connecting to the database', error);
    }
};

export const disconnectFromDatabase = async () : Promise<void> => {
    try {
        await mongoose.disconnect
        logger.info('Disconnected from the database successfully.', {
            uri: config.MONGO_URI,
            options: clientOptions
        });

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }

        logger.error('Error disconnecting from the database', error);
    }
}