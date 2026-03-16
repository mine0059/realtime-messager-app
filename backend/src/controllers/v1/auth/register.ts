/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

/**
 * Custom module imports
 */
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import config from "@/config";
import User from '@/models/user';
import Token from '@/models/token';
import { registerSchema } from '@/validations/auth';
import { logger } from '@/lib/winston';

/**
 * types
 */
import type { Request, Response } from "express";


const register = async (req: Request, res: Response): Promise<void> => {
    const result = registerSchema.safeParse(req.body);

    // If validation fails, return 400 with the errors
    if (!result.success) {
        res.status(400).json({
            code: 'ValidationError',
            message: 'Invalid request data',
            errors: result.error.flatten().fieldErrors,
        });
        return;
    }

    // Now safely destructure from result.data
    const { email, username, password } = result.data;
    try {
        const newUser = await User.create({ 
            email, 
            username, 
            password 
        });

        // Genetate access token and refresh token for new user
        const accessToken = generateAccessToken(newUser._id);
        const refreshToken = generateRefreshToken(newUser._id);

        // store refresh token in the db
        await Token.create({ userId: newUser._id, token: refreshToken });
        logger.info('Refresh token created for user', {
            userId: newUser._id,
            token: refreshToken,
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(201).json({
            user: {
                username: newUser.username,
                email: newUser.email,
            },
            accessToken,
            refreshToken,
        });

        logger.info('User registered successfully', {
            username: newUser.username,
            email: newUser.email,
        });
    } catch (error) {
        res.status(500).json({
            code: 'ServerError', 
            message: 'internal server error',
            error: error
        });

        logger.error('Error during user registration', error);
    }
};

export default register;