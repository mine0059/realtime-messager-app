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


const app = express();

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

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});