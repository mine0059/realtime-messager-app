/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

/**
 * Node modules
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';

/**
 * Custom modules
 */
import config from '@/config';
import limiter from '@/lib/express_rate_limit';
import { connectToDatabase, disconnectFromDatabase } from '@/lib/mongoose';
import { logger } from '@/lib/winston';

/**
 * Router
 */
import v1Router from '@/routes/v1';

/**
 * Types
 */
import type { CorsOptions } from 'cors';

const app = express();
// configure CORS options
const corsOptions: CorsOptions = {
    origin(origin, callback) {
        if (config.NODE_ENV === 'development' || !origin || config.WHITELIST_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            // Reject request from non-whitelisted origins
            callback(
                new Error(`CORS error: ${origin} is not allowed by CORS`),
                false,
            );
            logger.warning(`CORS error: ${origin} is not allowed by CORS`);
        }
    }
}

app.use(cors(corsOptions));

// Enable JSON request body parsing
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

//Enable response compression to reduce payload size and improve performance
app.use(
    compression({
        threshold: 1024, // Only compress responses layer then 1KB
    }),
);

// Use helmet to enhance security by setting various HTTP headers
app.use(helmet());

// Apply rate limiting middleware to prevent excessive request and enhanvce security
app.use(limiter);

(async () => {
    try {
        await connectToDatabase();
        app.use('/api/v1', v1Router);

        app.listen(config.PORT, () => {
            logger.info(`Server running: http://localhost:${config.PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start the server', error);

        if(config.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
})();

const handleServershutdown = async () => {
    try {
        await disconnectFromDatabase();
        logger.warn('Server SHUTDOWN');
        process.exit(0);
    } catch (error) {
        logger.error('Error during server shutdown', error);
    }
}

/**
 * Listens for termination signals ('SIGTERM' AND `SIGINT`).
 * 
 * - `SIGTERM` is typically sent when stopping a process (e.g., `kill` command or container shutdown).
 * - `SIGINT` is triggered when the user interrupt the process (e.g., pressing `Ctrl + C`).
 * - when either signal is received, 'handleServerShurdown' is executed to ensure proper cleanup.
 */
process.on('SIGTERM', handleServershutdown);
process.on('SIGINT', handleServershutdown);