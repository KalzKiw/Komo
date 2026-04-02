import { NextFunction, Request, Response } from "express";

import { cancelOrder, createOrder, getOrderDetail, listOrders, updateOrderStatus } from "../services/order.service";
import {
  cancelOrderParamsSchema,
  getOrderDetailParamsSchema,
  listOrdersQuerySchema,
  updateOrderStatusBodySchema,
  updateOrderStatusParamsSchema
} from "../validators/order.validator";

export async function createOrderController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const order = await createOrder(req.user, req.body);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

export async function cancelOrderController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { orderId } = cancelOrderParamsSchema.parse(req.params);
    const result = await cancelOrder(req.user, orderId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listOrdersController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const query = listOrdersQuerySchema.parse(req.query);
    const result = await listOrders(req.user, query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getOrderDetailController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { orderId } = getOrderDetailParamsSchema.parse(req.params);
    const result = await getOrderDetail(req.user, orderId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatusController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { orderId } = updateOrderStatusParamsSchema.parse(req.params);
    const { status } = updateOrderStatusBodySchema.parse(req.body);
    const result = await updateOrderStatus(req.user, orderId, status);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
