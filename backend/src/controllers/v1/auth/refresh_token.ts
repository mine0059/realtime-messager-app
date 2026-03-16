/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

import { generateAccessToken, verifyRefreshToken, generateRefreshToken } from "@/lib/jwt";
import { logger } from "@/lib/winston";
import config from "@/config";

import Token from "@/models/token";

/**
 * Types
 */
import type { Request, Response } from "express";
import { Types } from 'mongoose';

interface RefreshTokenPayload {
    userId: Types.ObjectId;
}

const refreshToken = async (req: Request, res: Response): Promise<void> => {
    let incomingRefreshToken: string | undefined;

    try {
        // web send via cookie, mobile send via request body or header
        incomingRefreshToken = 
            req.cookies?.refreshToken || 
            req.body.refreshToken || 
            req.headers['x-refresh-token']; 

        if (!incomingRefreshToken) {
            res.status(401).json({
                code: 'AuthenticationError',
                message: 'Refresh token is required',
            });
            return;
        }
        const jwtPayload = verifyRefreshToken(incomingRefreshToken) as RefreshTokenPayload;

        const newAccessToken = generateAccessToken(jwtPayload.userId);
        const newRefreshToken = generateRefreshToken(jwtPayload.userId);

        // Atomic — find old token and replace with new one in single DB operation
        const tokenRecord = await Token.findOneAndUpdate(
            { token: incomingRefreshToken },
            { token: newRefreshToken },
            { returnDocument: 'after' }
        );

        if (!tokenRecord) {
            res.status(401).json({
                code: 'AuthenticationError',
                message: 'Invalid refresh token',
            });
            return;
        }

        logger.info('Refresh token rotated successfully', {
            userId: jwtPayload.userId,
        });

        // Set new cookie for web
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });

    } catch (error) {
        if(error instanceof TokenExpiredError) {
            if (incomingRefreshToken) {
                await Token.findOneAndDelete({ token: incomingRefreshToken });
            }

            logger.warn('Expired refresh token used', { token: incomingRefreshToken });

            res.status(401).json({
                code: 'AuthenticationError',
                message: 'Refresh token expired, please login again',
            });
            return;
        }

        if(error instanceof JsonWebTokenError) {
            logger.warn('Invalid refresh token used', { token: incomingRefreshToken });

            res.status(401).json({
                code: 'AuthenticationError',
                message: 'Invalid refresh token',
            });
            return;
        }

        logger.error('Error during refresh token', error);
        res.status(500).json({
            code: 'ServerError', 
            message: 'internal server error',
        });
    }
}

export default refreshToken;