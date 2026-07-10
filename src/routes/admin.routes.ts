import { Router } from "express";

import {
  assignDelegateController,
  createProductAdminController,
  listKdsQueueController,
  listProductsAdminController,
  listStudentsAdminController,
  previewTestTicketController,
  printTestTicketController,
  reprintOrderTicketController,
  updateProductAdminController
} from "../controllers/admin.controller";
import {
  getScheduleController,
  updateScheduleController
} from "../controllers/settings.controller";
import { mockAuthMiddleware } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/require-role.middleware";

export const adminRouter = Router();

adminRouter.use("/admin", mockAuthMiddleware, requireRoles(["ADMIN"]));

/**
 * @swagger
 * /api/admin/students:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List students and delegates
 *     security:
 *       - roleHeaderAuth: []
 *     responses:
 *       200:
 *         description: Students list
 */
adminRouter.get("/admin/students", listStudentsAdminController);

/**
 * @swagger
 * /api/admin/students/{studentId}/delegate:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Assign or remove delegate role for a student
 *     security:
 *       - roleHeaderAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isDelegate]
 *             properties:
 *               isDelegate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Delegate role updated
 */
adminRouter.patch("/admin/students/:studentId/delegate", assignDelegateController);

/**
 * @swagger
 * /api/admin/kds:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get KDS queue
 *     security:
 *       - roleHeaderAuth: []
 *     responses:
 *       200:
 *         description: KDS queue
 */
adminRouter.get("/admin/kds", listKdsQueueController);

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List products for administration
 *     security:
 *       - roleHeaderAuth: []
 *     responses:
 *       200:
 *         description: Products list
 */
adminRouter.get("/admin/products", listProductsAdminController);

/**
 * @swagger
 * /api/admin/products:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create product
 *     security:
 *       - roleHeaderAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               isOfficialMenu:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Product created
 */
adminRouter.post("/admin/products", createProductAdminController);

/**
 * @swagger
 * /api/admin/products/{productId}:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update product
 *     security:
 *       - roleHeaderAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               price:
 *                 type: number
 *               isOfficialMenu:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated
 */
adminRouter.patch("/admin/products/:productId", updateProductAdminController);

/**
 * @swagger
 * /api/admin/settings/schedule:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get order cutoff schedule
 *     security:
 *       - roleHeaderAuth: []
 *     responses:
 *       200:
 *         description: Current schedule settings
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update order cutoff schedule
 *     security:
 *       - roleHeaderAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               morning:
 *                 type: string
 *                 example: "09:00"
 *               afternoon:
 *                 type: string
 *                 example: "15:00"
 *               night:
 *                 type: string
 *                 example: "18:00"
 *               graceMinutes:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Updated schedule
 */
adminRouter.get("/admin/settings/schedule", getScheduleController);
adminRouter.patch("/admin/settings/schedule", updateScheduleController);
adminRouter.post("/admin/print-test-ticket", printTestTicketController);
adminRouter.get("/admin/print-test-ticket/preview", previewTestTicketController);
adminRouter.post("/admin/orders/:orderId/print-ticket", reprintOrderTicketController);
