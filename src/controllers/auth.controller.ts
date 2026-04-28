import { NextFunction, Request, Response } from "express";

import { login, register } from "../services/auth.service";
import { loginSchema, registerSchema } from "../validators/auth.validator";

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await login(payload);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function registerController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await register(payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
