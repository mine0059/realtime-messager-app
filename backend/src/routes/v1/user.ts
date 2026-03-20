/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

import express from 'express';
import User from "@/models/user";
import { logger } from "@/lib/winston";

import authenticated from '@/middlewares/authenticated';
import { generateAccessToken } from "@/lib/jwt";

/**
 * Types
 */
import type { Request, Response } from "express";

const router = express.Router();

router.get('/me', authenticated, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if(!user) {
            res.status(404).json({
                code: 'NotFound',
                message: 'User not found'
            });
            return;
        }

        const { password, __v, ...safeUser } = user.toObject();

        // Generate a fresh access token for the session
        const accessToken = generateAccessToken(user._id);

        res.status(200).json({ 
            user: safeUser,
            accessToken
         });
    } catch (error) {
        logger.error('Error fetching user info', error);
        res.status(500).json({
            code: 'ServerError', 
            message: 'internal server error',
        });
    }
});

export default router;