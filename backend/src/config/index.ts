/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

import dotenv from 'dotenv';

/**
 * types
 */
import type ms from 'ms';

dotenv.config();

type RequiredEnvKey =
    | 'GOOGLE_CLIENT_ID'
    | 'GOOGLE_CLIENT_SECRET'
    | 'GOOGLE_REDIRECT_URL'
    | 'WEB_CLIENT_URL'
    | 'JWT_ACCESS_SECRET'
    | 'JWT_REFRESH_SECRET';

const requiredEnvKeys: RequiredEnvKey[] = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URL',
    'WEB_CLIENT_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
];

const missingKeys = requiredEnvKeys.filter((key) => !process.env[key]);
if (missingKeys.length > 0) {
    const errorMessage = `Missing required env vars: ${missingKeys.join(', ')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
}

export interface AppConfig {
    PORT: string | number;
    NODE_ENV?: string;
    WHITELIST_ORIGINS: string[];
    MONGO_URI?: string;
    LOG_LEVEL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    ACCESS_TOKEN_EXPIRY?: ms.StringValue;
    REFRESH_TOKEN_EXPIRY?: ms.StringValue;
    defaultResLimit: number;
    defaultResOffset: number;
    CLOUDINARY_CLOUD_NAME?: string;
    CLOUDINARY_API_KEY?: string;
    CLOUDINARY_API_SECRET?: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_REDIRECT_URL: string;
    GOOGLE_ANDROID_CLIENT_ID?: string;
    GOOGLE_IOS_CLIENT_ID?: string;
    WEB_CLIENT_URL: string;
}

const config: AppConfig = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV,
    WHITELIST_ORIGINS: ['https://docs.blog-api.oghenemine.com'],
    MONGO_URI: process.env.MONGO_URI,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY as ms.StringValue,
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY as ms.StringValue,
    defaultResLimit: 20,
    defaultResOffset: 0,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
    GOOGLE_REDIRECT_URL: process.env.GOOGLE_REDIRECT_URL!,
    GOOGLE_ANDROID_CLIENT_ID: process.env.GOOGLE_ANDROID_CLIENT_ID || undefined,
    GOOGLE_IOS_CLIENT_ID: process.env.GOOGLE_IOS_CLIENT_ID || undefined,
    WEB_CLIENT_URL: process.env.WEB_CLIENT_URL!,
};

export default config;