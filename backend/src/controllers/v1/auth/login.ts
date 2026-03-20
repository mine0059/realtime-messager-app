/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

import bcrypt from 'bcryptjs';

/**
 * Custom module imports
 */
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import config from "@/config";
import { loginSchema } from '@/validations/auth';
import { logger } from '@/lib/winston';

/**
 * models
 */
import User from '@/models/user';
import Token from '@/models/token';

/**
 * types
 */
import type { Request, Response } from "express";

const login = async (req: Request, res: Response): Promise<void> => {
    const result = loginSchema.safeParse(req.body);
    
    if (!result.success) {
        res.status(400).json({
            code: 'ValidationError',
            message: 'Invalid request data',
            errors: result.error.flatten().fieldErrors,
        });
        return;
    }

    const { email, password, twoFactorAuthSecret } = result.data;
    try {
        const user = await User.findOne({ email })
            .select('username email password twoFactorAuthSecret twoFactorAuthEnabled')
            .lean()
            .exec();

        if(!user) {
            res.status(400).json({
                code: 'ValidationError',
                message: 'Invalid email or password'
            });
            return;
        }

        if (!user.password) {
            res.status(400).json({
                code: 'ValidationError',
                message: 'Invalid email or password',
            });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            res.status(400).json({
                code: 'ValidationError',
                message: 'Invalid email or password',
            });
            return;
        }

        if (user.twoFactorAuthEnabled) {
            if (!twoFactorAuthSecret || typeof twoFactorAuthSecret !== 'string') {
                res.status(400).json({
                    code: 'ValidationError',
                    message: 'Two-factor code is required',
                });
                return;
            }

            if (!user.twoFactorAuthSecret) {
                res.status(400).json({
                    code: 'ValidationError',
                    message: 'Two factor miscofigured for this account, please contact support',
                });
                return;
            }

            // If 2FA is enabled, verify the code using otpLibrary
        }

        // Generate access token and refresh token for new user
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Delete old token if exists, then create new one
        await Token.findOneAndDelete({ userId: user._id });

        // store refresh token in db
        await Token.create({ token: refreshToken, userId: user._id });
        logger.info('Refresh token created for user', {
            userId: user._id,
            token: refreshToken,
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({
            user: {
                username: user.username,
                email: user.email,
            },
            accessToken,
            refreshToken,
        });

        logger.info('User login successfully', user);

    } catch (error) {
        res.status(500).json({
            code: 'ServerError', 
            message: 'internal server error',
            error: error
        });

        logger.error('Error during user login', error);
    }
};

export default login;