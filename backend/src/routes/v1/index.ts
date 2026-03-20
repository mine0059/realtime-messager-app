/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

import { Router } from "express";

const router = Router();

import authRoutes from '@/routes/v1/auth';
import userRoutes from '@/routes/v1/user';

/**
 * Root route
 */
router.get('/', (req, res) => {
    res.status(200).json({
        message: "API is live",
        status: 'Ok',
        version: '1.0.0',
        docs: 'https://docs.realtime-messenger-api.oghenemine.com',
        timestamp: new Date().toISOString(),
    });
});

router.use('/auth', authRoutes);
router.use('/user', userRoutes);

export default router;