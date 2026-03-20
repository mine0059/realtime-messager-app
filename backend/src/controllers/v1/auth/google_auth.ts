/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

/**
 * Custom module imports
 */
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import config from "@/config";
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

interface GoogleProfile {
    id: string; // google unique user ID
    email: string;
    name: string;
    picture: string; // avatar url provided by Google
    isVerified: boolean; // email verified by Google
};

const handleGoogleAuth = async (googleProfile: GoogleProfile) => {
    let user =  await User.findOne({ googleId: googleProfile.id });

    // find by email if user with googleId not found 
    // (handles the case where user previously signed up with email and password, 
    // then tries to login with google)
    if(!user) {
        user = await User.findOne({ email: googleProfile.email });

        if (user) {
            if (user.authProvider === 'local') {
                // lINK Google to existing local account
                user.googleId = googleProfile.id;
                user.authProvider = 'google';
                if (!user.avatar && googleProfile.picture) {
                    user.avatar = googleProfile.picture;
                }
                await user.save();
            }
            // If authProvider is already 'google' — just proceed, no action needed
        }
    }

    if (!user) {
        const baseUsername = googleProfile.email
            .split('@')[0]
            .replace(/[^a-zA-Z0-9]/g, '')
            .slice(0, 20)
            .toLowerCase();

        // Ensure username is unique by probing first and then retrying on race conditions
        let username = baseUsername;

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            username = `${baseUsername.slice(0, 16)}${crypto.randomBytes(2).toString('hex')}`;
        }

        const maxRetries = 3;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < maxRetries; attempt += 1) {
            try {
                user = await User.create({
                    googleId: googleProfile.id,
                    email: googleProfile.email,
                    username,
                    avatar: googleProfile.picture || null,
                    authProvider: 'google',
                });
                break;
            } catch (createError: any) {
                lastError = createError;

                // Mongoose duplicate key error for username uniqueness
                if (createError?.code === 11000 || createError?.code === 11001 || createError?.name === 'MongoServerError') {
                    username = `${baseUsername.slice(0, 16)}${crypto.randomBytes(2).toString('hex')}`;
                    continue;
                }

                throw createError;
            }
        }

        if (!user) {
            throw lastError || new Error('Failed to create user after retrying username uniqueness.');
        }
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await Token.findOneAndDelete({ userId: user._id });
    await Token.create({ token: refreshToken, userId: user._id });
    
    logger.info('Google auth handled successfully', {
        userId: user._id,
        authProvider: user.authProvider,
    });

    return { user, accessToken, refreshToken };
};

const getGoogleClient = () => {
    const clientId = config.GOOGLE_CLIENT_ID;
    const clientSecret = config.GOOGLE_CLIENT_SECRET;
    const redirectUri = config.GOOGLE_REDIRECT_URL;

    return new OAuth2Client(clientId, clientSecret, redirectUri);
}

const googleAuthStartHandler = (_req: Request, res: Response): void => {
    try {
        const client = getGoogleClient();

        const state = crypto.randomBytes(16).toString('hex');
        const cookieOptions = {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: config.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
            maxAge: 10 * 60 * 1000, // 10 minutes
        };

        res.cookie('googleOauthState', state, cookieOptions);

        const authUrl = client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: ['openid', 'profile', 'email'],
            state,
        });

        res.redirect(authUrl);
    } catch (error) {
        res.status(500).json({
            code: 'ServerError', 
            message: 'internal server error',
            error: error
        });

        logger.error('Error during user login', error);
    }
}

const googleAuthCallbackHandler = async (req: Request, res: Response): Promise<void> => {
    const code = req.query.code as string | undefined;
    const returnedState = req.query.state as string | undefined;
    const storedState = req.cookies?.googleOauthState as string | undefined;

    if (!code) {
        res.redirect(`${config.WEB_CLIENT_URL}/auth/google/error?reason=missing_code`);
        return;
    }

    if (!returnedState || !storedState || returnedState !== storedState) {
        res.clearCookie('googleOauthState');
        res.redirect(`${config.WEB_CLIENT_URL}/auth/google/error?reason=invalid_state`);
        return;
    }

    res.clearCookie('googleOauthState');

    try {
        const client = getGoogleClient();

        const { tokens } = await client.getToken(code);

        if (!tokens.id_token) {
            res.redirect(`${config.WEB_CLIENT_URL}/auth/google/error?reason=no_token`);
            return;
        }

        // verify id token and read the user info from it
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: config.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload?.email;
        const isVerified = payload?.email_verified;

        if (!email || !isVerified) {
            res.redirect(`${config.WEB_CLIENT_URL}/auth/google/error?reason=unverified_email`);
            return;
        }

        const googleProfile: GoogleProfile = {
            id: payload?.sub!,
            email: email.toLowerCase().trim(),
            name: payload?.name || 'Google User',
            picture: payload.picture || '',
            isVerified,
        };

        const { user, accessToken, refreshToken } = await handleGoogleAuth(googleProfile);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        logger.info('Google web login successfully', {
            username: user.username,
            email: user.email,
        });

        if (config.NODE_ENV === 'development') {
            res.status(200).json({
                user: {
                    username: user.username,
                    email: user.email,
                },
                accessToken,
                refreshToken,
            });
            return;
        }

        res.redirect(`${config.WEB_CLIENT_URL}/auth/google/success`);

    } catch (error) {
        logger.error('Error during Callback Google authentication', error);
        // ✅ Redirect to frontend error page instead of JSON
        res.redirect(`${config.WEB_CLIENT_URL}/auth/google/error`);
    }
}


const googleAuthMobileHandler = async (req: Request, res: Response): Promise<void> => {
    const { idToken } = req.body;

    if (!idToken) {
        res.status(400).json({
            code: 'ValidationError',
            message: 'idToken is required',
        });
        return;
    }

    try {
        const client = getGoogleClient();

        const audience = [
            config.GOOGLE_CLIENT_ID,
            config.GOOGLE_ANDROID_CLIENT_ID,
            config.GOOGLE_IOS_CLIENT_ID,
        ].filter((v): v is string => Boolean(v));

        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience,
        });

        const payload = ticket.getPayload();
        const email = payload?.email;
        const isVerified = payload?.email_verified;

        if (!email || !isVerified) {
            res.status(400).json({
                code: 'ValidationError',
                message: 'email not provided or not verified by Google',
            });
            return;
        }

        const googleProfile: GoogleProfile = {
            id: payload?.sub!,
            email: email.toLowerCase().trim(),
            name: payload?.name || 'Google User',
            picture: payload?.picture || '',
            isVerified,
        };

        const { user, accessToken, refreshToken } = await handleGoogleAuth(googleProfile);

        logger.info('Google mobile login successfully', {
            username: user.username,
            email: user.email,
        });

        // Mobile stores refreshToken in SecureStore
        res.status(200).json({
            user: {
                username: user.username,
                email: user.email,
            },
            accessToken,
            refreshToken,
        });

    } catch (error) {
        logger.error('Error during Mobile Google authentication', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'internal server error',
        });
    }
}

export {
    googleAuthStartHandler,
    googleAuthCallbackHandler,
    googleAuthMobileHandler
};
