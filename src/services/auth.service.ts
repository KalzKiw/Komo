import { supabase } from "../config";
import { AppError } from "../errors/app-error";
import { UserRole } from "../types/domain";
import { LoginInput } from "../validators/auth.validator";

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_beneficiary: boolean;
}

export async function login(payload: LoginInput): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, is_beneficiary")
    .eq("email", payload.email.toLowerCase())
    .single();

  if (error || !data) {
    throw new AppError("Credenciales invalidas", 401);
  }

  const user = data as UserRow;

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      isBeneficiary: user.is_beneficiary
    },
    authHeaders: {
      "x-user-id": user.id,
      "x-user-role": user.role,
      "x-user-beneficiary": user.is_beneficiary ? "true" : "false"
    }
  };
}
