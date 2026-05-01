import { NextFunction, Request, Response } from "express";

import { supabase } from "../config";
import { UserRole } from "../types/domain";

const roleSet: Set<UserRole> = new Set(["ADMIN", "STAFF", "STUDENT", "DELEGATE", "PARENT"]);

function bearerToken(req: Request): string | null {
  const header = req.header("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  return header.slice("bearer ".length).trim();
}

export async function mockAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = bearerToken(req);

  if (token) {
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      res.status(401).json({ message: "Unauthorized. Invalid bearer token." });
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role, is_beneficiary")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      res.status(401).json({ message: "Unauthorized. User profile not found." });
      return;
    }

    req.user = {
      id: profile.id,
      role: profile.role as UserRole,
      isBeneficiary: Boolean(profile.is_beneficiary)
    };

    next();
    return;
  }

  const roleHeader = req.header("x-user-role");

  if (!roleHeader || !roleSet.has(roleHeader as UserRole)) {
    res.status(401).json({
      message: "Unauthorized. Include a bearer token or x-user-role with a valid role."
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
