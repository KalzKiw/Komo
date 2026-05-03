import { Router } from "express";
import { mockAuthMiddleware } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/require-role.middleware";
import {
  generateTokenController,
  redeemTokenController,
  getChildrenController,
  getMyParentController,
  revokeLinkController,
  topUpController,
  adminFamilyController,
  getChildOrdersController,
  getChildProfileController,
} from "../controllers/family.controller";

export const familyRouter = Router();

// All family routes require authentication.
familyRouter.use(["/family", "/admin/family"], mockAuthMiddleware);

/** Parent generates a short-lived linking token */
familyRouter.post("/family/token", requireRoles(["PARENT"]), generateTokenController);

/** Student redeems a token to link with a parent */
familyRouter.post("/family/link", requireRoles(["STUDENT"]), redeemTokenController);

/** Parent lists their linked children (with balances) */
familyRouter.get("/family/children", requireRoles(["PARENT"]), getChildrenController);

/** Student gets their parent link status */
familyRouter.get("/family/my-parent", requireRoles(["STUDENT", "PARENT"]), getMyParentController);

/** Revoke a family link (parent, student, or admin) */
familyRouter.delete("/family/links/:linkId", revokeLinkController);

/** Parent tops up a child's wallet balance */
familyRouter.post("/family/topup", requireRoles(["PARENT"]), topUpController);

/** Admin: full list of family relationships */
familyRouter.get("/admin/family", requireRoles(["ADMIN"]), adminFamilyController);

/** Parent: recent orders of a linked child */
familyRouter.get("/family/children/:studentId/orders", requireRoles(["PARENT"]), getChildOrdersController);

/** Parent: full profile of a linked child */
familyRouter.get("/family/children/:studentId/profile", requireRoles(["PARENT"]), getChildProfileController);
