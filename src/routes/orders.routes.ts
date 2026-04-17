import { Router } from "express";

import {
	cancelOrderController,
	createOrderController,
	getOrderDetailController,
	listOrdersController,
	updateOrderStatusController
} from "../controllers/orders.controller";
import { addItemToOrderController } from "../controllers/add-item.controller";
import { mockAuthMiddleware } from "../middlewares/auth.middleware";
import { orderCutoffMiddleware } from "../middlewares/order-time-window.middleware";

export const ordersRouter = Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create a preorder
 *     security:
 *       - roleHeaderAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Cutoff time exceeded
 */

ordersRouter.post("/orders", mockAuthMiddleware, orderCutoffMiddleware, createOrderController);

/**
 * @swagger
 * /api/orders/{orderId}/cancel:
 *   patch:
 *     tags:
 *       - Orders
 *     summary: Cancel an order
 *     security:
 *       - roleHeaderAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled
 *       404:
 *         description: Order not found
 */
ordersRouter.patch("/orders/:orderId/cancel", mockAuthMiddleware, cancelOrderController);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: List orders for KDS and operations
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
 *         description: Orders list
 */
ordersRouter.get("/orders", mockAuthMiddleware, listOrdersController);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get order detail
 *     security:
 *       - roleHeaderAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order detail
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
ordersRouter.get("/orders/:orderId", mockAuthMiddleware, getOrderDetailController);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   delete:
 *     tags:
 *       - Orders
 *     summary: Cancel an order and credit wallet when eligible
 *     security:
 *       - roleHeaderAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order cancelled
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       409:
 *         description: Cancellation not allowed
 */
ordersRouter.delete("/orders/:orderId", mockAuthMiddleware, cancelOrderController);

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   patch:
 *     tags:
 *       - Orders
 *     summary: Update order status for operations (ADMIN/STAFF)
 *     security:
 *       - roleHeaderAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [IN_PREPARATION, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       409:
 *         description: Invalid state transition
 */
ordersRouter.patch("/orders/:orderId/status", mockAuthMiddleware, updateOrderStatusController);
ordersRouter.patch("/orders/:orderId/add-item", mockAuthMiddleware, addItemToOrderController);
