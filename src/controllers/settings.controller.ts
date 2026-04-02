import { NextFunction, Request, Response } from "express";

import { getOrderSchedule, updateOrderSchedule } from "../services/settings.service";
import { updateScheduleBodySchema } from "../validators/settings.validator";

export async function getScheduleController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await getOrderSchedule();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateScheduleController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = updateScheduleBodySchema.parse(req.body);
    const result = await updateOrderSchedule(body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
