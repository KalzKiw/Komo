import { Router } from "express";

import { healthController } from "../controllers/health.controller";

export const healthRouter = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: API healthy
 */
healthRouter.get("/health", healthController);
