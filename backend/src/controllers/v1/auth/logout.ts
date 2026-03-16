/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

import { logger } from "@/lib/winston";
import config from "@/config";

import type { Request, Response } from 'express';
import Token from "@/models/token";

const logout = async (req: Request, res: Response): Promise<void> => {
    try {

        // web send via cookie, mobile send via request body or header
        const refreshToken = 
        req.cookies.refreshToken || 
        req.body.refreshToken || 
        req.headers['x-refresh-token']; 

        if (!refreshToken) {
            res.status(400).json({
                code: 'BadRequest',
                message: 'Refresh token is required',
            });
            return;
        }

        const deleted =  await Token.findOneAndDelete({ token: refreshToken });

        if (!deleted) {
            res.status(404).json({
                code: 'NotFound',
                message: 'Token not found or already logged out',
            });
            return;
        }

        logger.info('User refresh token deleted successfully', {
            userId: req.userId,
            token: refreshToken
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        res.sendStatus(204);

        logger.info('User logged out successfully', {
            userId: req.userId
        });

    } catch (error) {
        res.status(500).json({
            code: 'ServerError', 
            message: 'internal server error',
            error: error
        });

        logger.error('Error during user logout', error);
    }
}

export default logout;