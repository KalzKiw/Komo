import { Request, Response, NextFunction } from "express";
import { addItemToOrder } from "../services/order.service";

export async function addItemToOrderController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const { orderId } = req.params;
    const item = req.body;
    const result = await addItemToOrder(req.user, orderId, item);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
