/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

import { Router } from "express";

/**
 * Controllers
 */

import login  from '@/controllers/v1/auth/login';
import register from '@/controllers/v1/auth/register';
import logout from '@/controllers/v1/auth/logout';
import refreshToken from "@/controllers/v1/auth/refresh_token";
import { 
    googleAuthStartHandler, 
    googleAuthCallbackHandler, 
    googleAuthMobileHandler 
} from "@/controllers/v1/auth/google_auth";

/**
 * Middlewares
 */
import authenticated from '@/middlewares/authenticated';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/refresh-token', authenticated, refreshToken)
router.post('/logout', authenticated, logout);
router.get('/google', googleAuthStartHandler);
router.get('/google/callback', googleAuthCallbackHandler);
router.post('/google/mobile', googleAuthMobileHandler);

export default router;