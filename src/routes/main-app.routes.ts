import { Router } from "express";

import {
  getMyProfileController,
  listMyAllergiesController,
  listMyOrdersController,
  listProductsController,
  listAllAllergensController,
  updateMyAllergiesController,
} from "../controllers/main-app.controller";
import { mockAuthMiddleware } from "../middlewares/auth.middleware";

export const mainAppRouter = Router();

/**
 * @swagger
 * /api/me:
 *   get:
 *     tags:
 *       - Main App
 *     summary: Get authenticated user profile for student app
 *     security:
 *       - roleHeaderAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 */
mainAppRouter.get("/me", mockAuthMiddleware, getMyProfileController);

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags:
 *       - Main App
 *     summary: List active products for main app
 *     security:
 *       - roleHeaderAuth: []
 *     parameters:
 *       - in: query
 *         name: officialMenuOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *     responses:
 *       200:
 *         description: Active products list
 */
mainAppRouter.get("/products", mockAuthMiddleware, listProductsController);

/**
 * @swagger
 * /api/me/orders:
 *   get:
 *     tags:
 *       - Main App
 *     summary: List authenticated user orders
 *     security:
 *       - roleHeaderAuth: []
 *     parameters:
 *       - in: query
 *         name: scheduledFor
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: shift
 *         schema:
 *           type: string
 *           enum: [MORNING, AFTERNOON, NIGHT]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PREPARATION, READY, DELIVERED, CANCELLED]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *     responses:
 *       200:
 *         description: User orders list
 */
mainAppRouter.get("/me/orders", mockAuthMiddleware, listMyOrdersController);

/**
 * @swagger
 * /api/me/allergies:
 *   get:
 *     tags:
 *       - Main App
 *     summary: List authenticated user allergies
 *     security:
 *       - roleHeaderAuth: []
 *     responses:
 *       200:
 *         description: User allergies list
 */
mainAppRouter.get("/me/allergies", mockAuthMiddleware, listMyAllergiesController);
mainAppRouter.put("/me/allergies", mockAuthMiddleware, updateMyAllergiesController);
mainAppRouter.get("/allergens", listAllAllergensController);
