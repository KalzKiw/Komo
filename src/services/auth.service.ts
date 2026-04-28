import { supabase } from "../config";
import { AppError } from "../errors/app-error";
import { UserRole } from "../types/domain";
import { LoginInput, RegisterInput } from "../validators/auth.validator";

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

export async function register(payload: RegisterInput): Promise<Record<string, unknown>> {
  const lowerEmail = payload.email.toLowerCase();
  const { data: existingUser, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("email", lowerEmail)
    .maybeSingle();

  if (existingError) {
    throw new AppError("Error al validar usuario", 500);
  }

  if (existingUser) {
    throw new AppError("El correo ya está registrado", 409);
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: lowerEmail,
      full_name: payload.fullName,
      role: payload.role,
      is_beneficiary: false
    })
    .select("id, email, full_name, role, is_beneficiary")
    .single();

  if (error || !data) {
    throw new AppError("No se pudo crear la cuenta", 500);
  }

  const user = data as UserRow;

  if (payload.allergenIds && payload.allergenIds.length > 0) {
    const rows = payload.allergenIds.map((allergen_id) => ({
      user_id: user.id,
      allergen_id
    }));

    const { error: insertError } = await supabase.from("user_allergies").insert(rows);
    if (insertError) {
      throw new AppError("No se pudieron guardar los alérgenos", 500);
    }
  }

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
