import { NextFunction, Request, Response } from "express";

import {
  getMyProfile,
  listAllAllergens,
  listMyAllergies,
  listMyOrders,
  listMyWalletMovements,
  listProductsForMainApp,
  topUpMyWallet,
  updateMyAllergies,
  updateMyProfile
} from "../services/main-app.service";
import {
  listMyOrdersQuerySchema,
  listProductsQuerySchema,
  topUpMyWalletBodySchema,
  updateMyProfileBodySchema
} from "../validators/main-app.validator";
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

export async function updateMyProfileController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const body = updateMyProfileBodySchema.parse(req.body);
    const profile = await updateMyProfile(req.user, body);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}

export async function topUpMyWalletController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { amount } = topUpMyWalletBodySchema.parse(req.body);
    const result = await topUpMyWallet(req.user, amount);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listMyWalletMovementsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { limit } = z.object({ limit: z.coerce.number().int().min(1).max(100).optional() }).parse(req.query);
    const result = await listMyWalletMovements(req.user, limit ?? 30);
    res.status(200).json(result);
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
