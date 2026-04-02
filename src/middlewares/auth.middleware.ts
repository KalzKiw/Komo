import { NextFunction, Request, Response } from "express";

import { UserRole } from "../types/domain";

const roleSet: Set<UserRole> = new Set(["ADMIN", "STAFF", "STUDENT", "DELEGATE", "PARENT"]);

export function mockAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const roleHeader = req.header("x-user-role");

  if (!roleHeader || !roleSet.has(roleHeader as UserRole)) {
    res.status(401).json({
      message: "Unauthorized. Include x-user-role with a valid role."
    });
    return;
  }

  req.user = {
    id: req.header("x-user-id") ?? "00000000-0000-0000-0000-000000000000",
    role: roleHeader as UserRole,
    isBeneficiary: req.header("x-user-beneficiary") === "true"
  };

  next();
}
