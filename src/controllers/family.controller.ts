import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  generateLinkingToken,
  getLinkedChildren,
  getMyParentLink,
  redeemLinkingToken,
  revokeLink,
  topUpChildWallet,
  getAllFamilyRelationships,
  getChildOrders,
  getChildProfile,
} from "../services/family.service";

// ─── Validators ───────────────────────────────────────────────────────────────

const redeemSchema = z.object({
  tokenCode: z.string().min(6).max(7),
});

const topUpSchema = z.object({
  studentId: z.string().uuid(),
  amount: z.coerce.number().positive().max(200),
});

const revokeLinkParamsSchema = z.object({
  linkId: z.string().uuid(),
});

// ─── Controllers ─────────────────────────────────────────────────────────────

/** POST /api/family/token — parent generates a linking code */
export async function generateTokenController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
  try {
    const result = await generateLinkingToken(req.user);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/** POST /api/family/link — student redeems a token */
export async function redeemTokenController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
  try {
    const { tokenCode } = redeemSchema.parse(req.body);
    const result = await redeemLinkingToken(req.user, tokenCode);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/** GET /api/family/children — parent lists linked children */
export async function getChildrenController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
  try {
    const children = await getLinkedChildren(req.user);
    res.status(200).json({ data: children });
  } catch (error) {
    next(error);
  }
}

/** GET /api/family/my-parent — student gets their parent link */
export async function getMyParentController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
  try {
    const result = await getMyParentLink(req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/** DELETE /api/family/links/:linkId — parent, student or admin revokes */
export async function revokeLinkController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
  try {
    const { linkId } = revokeLinkParamsSchema.parse(req.params);
    await revokeLink(req.user, linkId);
    res.status(200).json({ message: "Vínculo revocado correctamente" });
  } catch (error) {
    next(error);
  }
}

/** POST /api/family/topup — parent tops up a child's wallet */
export async function topUpController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
  try {
    const { studentId, amount } = topUpSchema.parse(req.body);
    const result = await topUpChildWallet(req.user, studentId, amount);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/** GET /api/admin/family — admin overview of all family relationships */
export async function adminFamilyController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
  try {
    const relationships = await getAllFamilyRelationships();
    res.status(200).json({ data: relationships });
  } catch (error) {
    next(error);
  }
}

/** GET /api/family/children/:studentId/orders — parent views a child's orders */
export async function getChildOrdersController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
  try {
    const { studentId } = z.object({ studentId: z.string().uuid() }).parse(req.params);
    const orders = await getChildOrders(req.user, studentId);
    res.status(200).json({ data: orders });
  } catch (error) {
    next(error);
  }
}

/** GET /api/family/children/:studentId/profile — parent views a child's full profile */
export async function getChildProfileController(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
  try {
    const { studentId } = z.object({ studentId: z.string().uuid() }).parse(req.params);
    const profile = await getChildProfile(req.user, studentId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}
