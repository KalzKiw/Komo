import { NextFunction, Request, Response } from "express";

import { login } from "../services/auth.service";
import { loginSchema } from "../validators/auth.validator";

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await login(payload);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
