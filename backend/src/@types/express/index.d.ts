/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

import * as express from 'express';

import { Types } from 'mongoose';

declare global {
    namespace Express {
        interface Request {
            userId?: Types.ObjectId;
        }
    }
}