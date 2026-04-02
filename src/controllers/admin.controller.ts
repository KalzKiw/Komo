import { NextFunction, Request, Response } from "express";

import {
  assignDelegateRole,
  createProductForAdmin,
  listKdsQueue,
  listProductsForAdmin,
  listStudentsForAdmin,
  updateProductForAdmin
} from "../services/admin.service";
import {
  assignDelegateBodySchema,
  assignDelegateParamsSchema,
  createProductBodySchema,
  updateProductBodySchema,
  updateProductParamsSchema
} from "../validators/admin.validator";

export async function listStudentsAdminController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await listStudentsForAdmin();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function assignDelegateController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { studentId } = assignDelegateParamsSchema.parse(req.params);
    const body = assignDelegateBodySchema.parse(req.body);
    const result = await assignDelegateRole(studentId, body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listKdsQueueController(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listKdsQueue();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listProductsAdminController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await listProductsForAdmin();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function createProductAdminController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = createProductBodySchema.parse(req.body);
    const result = await createProductForAdmin(body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateProductAdminController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productId } = updateProductParamsSchema.parse(req.params);
    const body = updateProductBodySchema.parse(req.body);
    const result = await updateProductForAdmin(productId, body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
