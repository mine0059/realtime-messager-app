/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

import { verifyAccessToken } from "@/lib/jwt";
import { logger } from "@/lib/winston";

import type { Request, Response, NextFunction } from "express";
import type { Types } from "mongoose";

const authenticated = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if(!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({
            code: 'AuthenticationError',
            message: 'Access denied, no token provided',
        });
        return;
    }

    const [_, token] = authHeader.split(' ');

    try {
        const jwtPayload = verifyAccessToken(token) as { userId: Types.ObjectId };

        req.userId = jwtPayload.userId;

        return next();
    } catch (error) {
        // handle expired token error
        if(error instanceof TokenExpiredError) {
            res.status(401).json({
                code: 'AuthenticationError',
                message: 'Access token expired, request a new one with refresh token',
            });
            return;
        }

        // handles invalid token error
        if(error instanceof JsonWebTokenError) {
            res.status(401).json({
                code: 'AuthenticationError',
                message: 'Access token Invalid',
            });
            return;
        }

        // catch all for other errors
        res.status(500).json({
            code: 'ServerError', 
            message: 'internal server error',
            error: error
        });

        logger.error('Error during authentication', error);
    }
}

export default authenticated;