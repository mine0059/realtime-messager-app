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

/**
 * Middlewares
 */
import authenticated from '@/middlewares/authenticated';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/refresh-token', authenticated, refreshToken)
router.post('/logout', authenticated, logout);
export default router;