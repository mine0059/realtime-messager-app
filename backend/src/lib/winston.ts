/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

import winston from "winston";

import config from "@/config";

const { combine, timestamp, json, errors, align, printf, colorize } = winston.format;

const transports: winston.transport[] = [];

if (config.NODE_ENV === "production") {
    transports.push(
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }), // Add colors to log levels
                timestamp({ format: 'YYYY-MM-DD hh:mm:ss A' }), // Add timestamp to logs
                align(), // Align log messages
                printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length
                        ? `\n${JSON.stringify(meta)}`
                        : '';

                    return `${timestamp} [${level}]: ${message}${metaStr}`;
                }),
            ),
        }),
    );
}

// Create a logger instance using winston
const logger = winston.createLogger({
    level: config.LOG_LEVEL || 'info', // set the default logging level to 'info,
    format: combine(timestamp(), errors({ stack: true }), json()), // use JSON format for log messages
    transports,
    silent: config.NODE_ENV === 'test', // Disable logging in test environment
});

export { logger };