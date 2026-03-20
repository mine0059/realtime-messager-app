/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

import winston from "winston";

const { combine, timestamp, json, errors, align, printf, colorize } = winston.format;

const env = process.env.NODE_ENV || 'development';
const logLevel = process.env.LOG_LEVEL || 'info';

const transports: winston.transport[] = [];

if (env === "production") {
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
    level: logLevel,
    format: combine(timestamp(), errors({ stack: true }), json()),
    transports,
    silent: env === 'test',
});

export { logger };