import { NextFunction, Request, Response } from "express";

import { getMyProfile, listAllAllergens, listMyAllergies, listMyOrders, listProductsForMainApp, updateMyAllergies } from "../services/main-app.service";
import { listMyOrdersQuerySchema, listProductsQuerySchema } from "../validators/main-app.validator";
import { z } from "zod";

export async function getMyProfileController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const profile = await getMyProfile(req.user);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}

export async function listProductsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const query = listProductsQuerySchema.parse(req.query);
    const products = await listProductsForMainApp(req.user, query);
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
}

export async function listMyOrdersController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const query = listMyOrdersQuerySchema.parse(req.query);
    const result = await listMyOrders(req.user, query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listMyAllergiesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const result = await listMyAllergies(req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listAllAllergensController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
  try {
    const result = await listAllAllergens();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateMyAllergiesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
  try {
    const { allergenIds } = z.object({ allergenIds: z.array(z.string().uuid()) }).parse(req.body);
    const result = await updateMyAllergies(req.user, allergenIds);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
