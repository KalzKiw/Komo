import { Router } from "express";

import {
  chargeSavedFamilyTopUpController,
  confirmFamilyTopUpController,
  confirmProfileCardSetupController,
  createFamilyTopUpIntentController,
  createProfileCardSetupIntentController,
  getStripeConfigController,
  listProfileCardsController,
  removeProfileCardController,
} from "../controllers/payment.controller";
import { mockAuthMiddleware } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/require-role.middleware";

export const paymentRouter = Router();

paymentRouter.get("/payments/config", mockAuthMiddleware, getStripeConfigController);

paymentRouter.post(
  "/payments/profile/card-setup-intent",
  mockAuthMiddleware,
  requireRoles(["PARENT"]),
  createProfileCardSetupIntentController
);

paymentRouter.get(
  "/payments/profile/cards",
  mockAuthMiddleware,
  requireRoles(["PARENT"]),
  listProfileCardsController
);

paymentRouter.post(
  "/payments/profile/card-setup-confirm",
  mockAuthMiddleware,
  requireRoles(["PARENT"]),
  confirmProfileCardSetupController
);

paymentRouter.delete(
  "/payments/profile/cards/:paymentMethodId",
  mockAuthMiddleware,
  requireRoles(["PARENT"]),
  removeProfileCardController
);

paymentRouter.post(
  "/payments/family/topup-saved-card",
  mockAuthMiddleware,
  requireRoles(["PARENT"]),
  chargeSavedFamilyTopUpController
);

paymentRouter.post(
  "/payments/family/topup-intent",
  mockAuthMiddleware,
  requireRoles(["PARENT"]),
  createFamilyTopUpIntentController
);

paymentRouter.post(
  "/payments/family/topup-confirm",
  mockAuthMiddleware,
  requireRoles(["PARENT"]),
  confirmFamilyTopUpController
);
