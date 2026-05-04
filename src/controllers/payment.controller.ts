import { NextFunction, Request, Response } from "express";
import { z } from "zod";

import {
  createFamilyTopUpIntent,
  createProfileCardSetupIntent,
  chargeSavedFamilyTopUp,
  confirmProfileCardSetup,
  confirmFamilyTopUpPayment,
  getStripePublishableKey,
  listProfileCards,
  removeProfileCard,
} from "../services/payment.service";

const createFamilyTopUpIntentSchema = z.object({
  studentId: z.string().uuid(),
  amount: z.coerce.number().positive().max(200),
});

const savedFamilyTopUpSchema = createFamilyTopUpIntentSchema;

const confirmFamilyTopUpSchema = z.object({
  paymentIntentId: z.string().min(1),
});

const confirmProfileCardSetupSchema = z.object({
  setupIntentId: z.string().min(1),
});

export async function createFamilyTopUpIntentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { studentId, amount } = createFamilyTopUpIntentSchema.parse(req.body);
    const result = await createFamilyTopUpIntent(req.user, studentId, amount);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getStripeConfigController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.status(200).json(getStripePublishableKey());
  } catch (error) {
    next(error);
  }
}

export async function createProfileCardSetupIntentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const result = await createProfileCardSetupIntent(req.user);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function confirmProfileCardSetupController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { setupIntentId } = confirmProfileCardSetupSchema.parse(req.body);
    const result = await confirmProfileCardSetup(req.user, setupIntentId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listProfileCardsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const result = await listProfileCards(req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function removeProfileCardController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const paymentMethodId = typeof req.params.paymentMethodId === "string" ? req.params.paymentMethodId : undefined;
    const result = await removeProfileCard(req.user, paymentMethodId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function chargeSavedFamilyTopUpController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { studentId, amount } = savedFamilyTopUpSchema.parse(req.body);
    const result = await chargeSavedFamilyTopUp(req.user, studentId, amount);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function confirmFamilyTopUpController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { paymentIntentId } = confirmFamilyTopUpSchema.parse(req.body);
    const result = await confirmFamilyTopUpPayment(req.user, paymentIntentId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
