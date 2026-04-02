import { NextFunction, Request, Response } from "express";

import { OrderShift } from "../types/domain";
import { getOrderSchedule } from "../services/settings.service";
import { env } from "../config/env";

export async function orderCutoffMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (env.BYPASS_ORDER_CUTOFF === "true") {
    next();
    return;
  }
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const shift = req.body?.shift as OrderShift | undefined;

  if (!shift || !["MORNING", "AFTERNOON", "NIGHT"].includes(shift)) {
    next();
    return;
  }

  let schedule;
  try {
    schedule = await getOrderSchedule();
  } catch (_err) {
    // If settings are unavailable, allow through to avoid blocking orders.
    next();
    return;
  }

  const cutoffByShift: Record<OrderShift, { hour: number; minute: number }> = {
    MORNING: schedule.morning,
    AFTERNOON: schedule.afternoon,
    NIGHT: schedule.night
  };

  const cutoff = cutoffByShift[shift];
  const now = new Date();
  const deadline = new Date();
  deadline.setHours(cutoff.hour, cutoff.minute + schedule.graceMinutes, 0, 0);

  if (now > deadline) {
    res.status(409).json({
      message: `El plazo de pedido para el turno ${shift} ha cerrado. Cierre: ${deadline.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
    });
    return;
  }

  next();
}

