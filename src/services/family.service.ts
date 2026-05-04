import { supabase } from "../config";
import { AppError } from "../errors/app-error";
import { AuthUser } from "../types/domain";
import { roundMoney } from "../utils/money";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FamilyLinkRow {
  id: string;
  parent_user_id: string;
  student_user_id: string;
  relation: string;
  status: string;
  created_at: string;
}

export interface LinkingTokenRow {
  id: string;
  token_code: string;
  parent_id: string;
  used: boolean;
  expires_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generates a random 7-char token: "XXX-XXX" (no O/I/0/1 to avoid confusion). */
function generateTokenCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = () => chars[Math.floor(Math.random() * chars.length)];
  return `${rand()}${rand()}${rand()}-${rand()}${rand()}${rand()}`;
}

// ─── 1) PARENT: generate a linking token ─────────────────────────────────────

export async function generateLinkingToken(parent: AuthUser): Promise<{ tokenCode: string; expiresAt: string }> {
  if (parent.role !== "PARENT") {
    throw new AppError("Solo los padres pueden generar códigos de vinculación", 403);
  }

  const tokenCode = generateTokenCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("linking_tokens")
    .insert({ token_code: tokenCode, parent_id: parent.id, expires_at: expiresAt });

  if (error) {
    throw new AppError("Error al generar el código de vinculación", 500);
  }

  return { tokenCode, expiresAt };
}

// ─── 2) STUDENT: redeem a token → creates family_link ────────────────────────

export async function redeemLinkingToken(student: AuthUser, tokenCode: string): Promise<{ parentId: string; parentName: string }> {
  if (student.role !== "STUDENT") {
    throw new AppError("Solo los alumnos pueden vincular una cuenta familiar", 403);
  }

  // Fetch token
  const { data: tokenRow, error: tokenError } = await supabase
    .from("linking_tokens")
    .select("id, token_code, parent_id, used, expires_at")
    .eq("token_code", tokenCode.toUpperCase())
    .single();

  if (tokenError || !tokenRow) {
    throw new AppError("Código no válido o inexistente", 404);
  }

  const token = tokenRow as LinkingTokenRow;

  if (token.used) {
    throw new AppError("Este código ya ha sido utilizado", 409);
  }
  if (new Date(token.expires_at) < new Date()) {
    throw new AppError("El código ha expirado. Pide uno nuevo.", 410);
  }

  // Check previous relationship with this parent. If it was revoked, the new
  // valid token reactivates it instead of inserting a duplicate row.
  const { data: existingLink } = await supabase
    .from("family_links")
    .select("id, status")
    .eq("parent_user_id", token.parent_id)
    .eq("student_user_id", student.id)
    .maybeSingle();

  if (existingLink?.status === "ACTIVE") {
    throw new AppError("Ya estás vinculado con este familiar", 409);
  }

  const { data: usedToken, error: markUsedError } = await supabase
    .from("linking_tokens")
    .update({ used: true })
    .eq("id", token.id)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .select("id")
    .maybeSingle();

  if (markUsedError || !usedToken) {
    throw new AppError("Error al validar el código", 500);
  }

  const linkMutation = existingLink
    ? supabase
        .from("family_links")
        .update({ status: "ACTIVE" })
        .eq("id", existingLink.id)
    : supabase
        .from("family_links")
        .insert({
          parent_user_id: token.parent_id,
          student_user_id: student.id,
          relation: "PARENT",
          status: "ACTIVE",
        });

  const { error: linkError } = await linkMutation;

  if (linkError) {
    await supabase
      .from("linking_tokens")
      .update({ used: false })
      .eq("id", token.id);
    console.error("family link mutation failed", linkError);
    throw new AppError("Error al crear el vínculo familiar", 500);
  }

  // Fetch parent name for response
  const { data: parentRow } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", token.parent_id)
    .single();

  return {
    parentId: token.parent_id,
    parentName: (parentRow as { full_name: string } | null)?.full_name ?? "Tu familiar",
  };
}

// ─── 3) PARENT: list linked children ─────────────────────────────────────────

export async function getLinkedChildren(parent: AuthUser): Promise<Array<{
  linkId: string;
  studentId: string;
  studentName: string;
  walletBalance: number;
  status: string;
}>> {
  if (parent.role !== "PARENT" && parent.role !== "ADMIN") {
    throw new AppError("Acceso denegado", 403);
  }

  const { data, error } = await supabase
    .from("family_links")
    .select(`
      id,
      status,
      student_user_id,
      users!family_links_student_user_id_fkey (
        full_name,
        wallet_balance
      )
    `)
    .eq("parent_user_id", parent.id)
    .eq("status", "ACTIVE");

  if (error) {
    throw new AppError("Error al obtener los hijos vinculados", 500);
  }

  return (data ?? []).map((row: any) => ({
    linkId: row.id,
    studentId: row.student_user_id,
    studentName: row.users?.full_name ?? "Alumno",
    walletBalance: Number(row.users?.wallet_balance ?? 0),
    status: row.status,
  }));
}

// ─── 4) STUDENT: get my parent link ──────────────────────────────────────────

export async function getMyParentLink(student: AuthUser): Promise<{
  linked: boolean;
  linkId?: string;
  parentId?: string;
  parentName?: string;
  parentWalletBalance?: number;
  parents?: Array<{
    linkId: string;
    parentId: string;
    parentName: string;
    parentWalletBalance: number;
  }>;
} > {
  const { data, error } = await supabase
    .from("family_links")
    .select(`
      id,
      status,
      parent_user_id,
      users!family_links_parent_user_id_fkey (
        full_name,
        wallet_balance
      )
    `)
    .eq("student_user_id", student.id)
    .eq("status", "ACTIVE");

  if (error) {
    throw new AppError("Error al consultar el vínculo familiar", 500);
  }

  const rows = (data ?? []) as any[];
  if (rows.length === 0) {
    return { linked: false, parents: [] };
  }

  const parents = rows.map((row) => ({
    linkId: row.id,
    parentId: row.parent_user_id,
    parentName: row.users?.full_name ?? "Tu familiar",
    parentWalletBalance: Number(row.users?.wallet_balance ?? 0),
  }));
  const firstParent = parents[0];

  return {
    linked: true,
    linkId: firstParent.linkId,
    parentId: firstParent.parentId,
    parentName: firstParent.parentName,
    parentWalletBalance: firstParent.parentWalletBalance,
    parents,
  };
}

// ─── 5) Revoke a link ────────────────────────────────────────────────────────

export async function revokeLink(actor: AuthUser, linkId: string): Promise<void> {
  // Fetch the link first to authorize
  const { data: link, error: fetchError } = await supabase
    .from("family_links")
    .select("id, parent_user_id, student_user_id, status")
    .eq("id", linkId)
    .single();

  if (fetchError || !link) {
    throw new AppError("Vínculo no encontrado", 404);
  }

  const row = link as FamilyLinkRow;

  // Only the parent involved, the student involved, or an admin can revoke
  const isParty = actor.id === row.parent_user_id || actor.id === row.student_user_id;
  if (actor.role !== "ADMIN" && !isParty) {
    throw new AppError("No tienes permiso para revocar este vínculo", 403);
  }

  const { error } = await supabase
    .from("family_links")
    .update({ status: "REVOKED" })
    .eq("id", linkId);

  if (error) {
    throw new AppError("Error al revocar el vínculo", 500);
  }
}

// ─── 6) PARENT: top-up a child's wallet ──────────────────────────────────────

export async function topUpChildWallet(
  parent: AuthUser,
  studentId: string,
  amount: number
): Promise<{ newBalance: number; movementPersisted: true }> {
  if (parent.role !== "PARENT") {
    throw new AppError("Solo los padres pueden recargar el saldo de sus hijos", 403);
  }

  if (amount <= 0 || amount > 200) {
    throw new AppError("El importe debe estar entre 0.01€ y 200€", 400);
  }

  // Verify the link exists
  const { data: link } = await supabase
    .from("family_links")
    .select("id")
    .eq("parent_user_id", parent.id)
    .eq("student_user_id", studentId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!link) {
    throw new AppError("No tienes un hijo vinculado con ese ID", 403);
  }

  const topUpAmount = roundMoney(amount);

  if (topUpAmount <= 0 || topUpAmount > 200) {
    throw new AppError("El importe debe estar entre 0.01€ y 200€", 400);
  }

  const { data: student, error: fetchError } = await supabase
    .from("users")
    .select("wallet_balance, role")
    .eq("id", studentId)
    .single();

  if (fetchError || !student) {
    throw new AppError("Alumno no encontrado", 404);
  }

  if (!["STUDENT", "DELEGATE"].includes((student as { role: string }).role)) {
    throw new AppError("Solo se puede recargar el monedero de alumnos", 409);
  }

  const currentBalance = roundMoney(Number((student as { wallet_balance: number }).wallet_balance));
  const newBalance = roundMoney(currentBalance + topUpAmount);

  const { data: updated, error: updateError } = await supabase
    .from("users")
    .update({ wallet_balance: newBalance })
    .eq("id", studentId)
    .select("wallet_balance")
    .maybeSingle();

  if (updateError) {
    throw new AppError("Error al actualizar el saldo", 500);
  }

  if (!updated) {
    throw new AppError("No se pudo actualizar el saldo del alumno", 500);
  }

  const { error: transactionError } = await supabase
    .from("wallet_transactions")
    .insert({
      user_id: studentId,
      amount: topUpAmount,
      concept: "Ingreso familiar"
    });

  if (transactionError) {
    await supabase
      .from("users")
      .update({ wallet_balance: currentBalance })
      .eq("id", studentId);
    console.error("wallet_transactions insert failed; rolled back family top-up", transactionError);
    throw new AppError(
      "No se pudo registrar el movimiento del monedero. Aplica la migración wallet_profile_persistence.",
      500
    );
  }

  return { newBalance, movementPersisted: true };
}

// ─── 9) PARENT: get a child's profile ───────────────────────────────────────────

export async function getChildProfile(
  parent: AuthUser,
  studentId: string
): Promise<{
  id: string;
  fullName: string;
  email: string;
  walletBalance: number;
  courseName: string | null;
  isBeneficiary: boolean;
  allergens: Array<{ id: string; code: string; name: string }>;
}> {
  // Verify link
  const { data: link } = await supabase
    .from("family_links")
    .select("id")
    .eq("parent_user_id", parent.id)
    .eq("student_user_id", studentId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!link) {
    throw new AppError("No tienes un hijo vinculado con ese ID", 403);
  }

  const { data: student, error: studentError } = await supabase
    .from("users")
    .select("id, full_name, email, wallet_balance, is_beneficiary, course_id, course:courses(name)")
    .eq("id", studentId)
    .single();

  if (studentError || !student) {
    throw new AppError("Alumno no encontrado", 404);
  }

  const s = student as any;

  // Allergens
  const { data: userAllergies } = await supabase
    .from("user_allergies")
    .select("allergen_id")
    .eq("user_id", studentId);

  const allergenIds = (userAllergies ?? []).map((r: any) => r.allergen_id);
  let allergens: Array<{ id: string; code: string; name: string }> = [];

  if (allergenIds.length > 0) {
    const { data: allergenRows } = await supabase
      .from("allergens")
      .select("id, code, name")
      .in("id", allergenIds);
    allergens = (allergenRows ?? []).map((a: any) => ({ id: a.id, code: a.code, name: a.name }));
  }

  return {
    id: s.id,
    fullName: s.full_name,
    email: s.email,
    walletBalance: Number(s.wallet_balance),
    courseName: s.course?.[0]?.name ?? null,
    isBeneficiary: Boolean(s.is_beneficiary),
    allergens,
  };
}

export async function getChildOrders(
  parent: AuthUser,
  studentId: string
): Promise<Array<{
  id: string;
  shift: string;
  scheduledFor: string;
  status: string;
  total: number;
  creditedToWallet: boolean;
  createdAt: string;
}>> {
  // Verify the parent is linked to this student
  const { data: link } = await supabase
    .from("family_links")
    .select("id")
    .eq("parent_user_id", parent.id)
    .eq("student_user_id", studentId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!link) {
    throw new AppError("No tienes un hijo vinculado con ese ID", 403);
  }

  const [ordersResult, transactionsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, shift, scheduled_for, status, total, credited_to_wallet, created_at")
      .eq("user_id", studentId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("wallet_transactions")
      .select("id, amount, concept, created_at")
      .eq("user_id", studentId)
      .order("created_at", { ascending: false })
      .limit(30)
  ]);

  if (ordersResult.error) {
    throw new AppError("Error al obtener los pedidos del alumno", 500);
  }

  const orders = (ordersResult.data ?? []).map((row: any) => ({
    id: row.id,
    shift: row.shift,
    scheduledFor: row.scheduled_for,
    status: row.status,
    total: Number(row.total),
    creditedToWallet: Boolean(row.credited_to_wallet),
    createdAt: row.created_at,
  }));

  const transactions = transactionsResult.error
    ? []
    : (transactionsResult.data ?? []).map((row: any) => ({
        id: row.id,
        shift: "TOPUP",
        scheduledFor: row.created_at,
        status: "TOPUP",
        total: Number(row.amount),
        creditedToWallet: true,
        createdAt: row.created_at,
        concept: row.concept,
      }));

  return [...orders, ...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30);
}

export async function updateChildAllergies(
  parent: AuthUser,
  studentId: string,
  allergenIds: string[]
): Promise<{ success: boolean; count: number }> {
  if (parent.role !== "PARENT") {
    throw new AppError("Solo los padres pueden ajustar los alérgenos de sus hijos", 403);
  }

  const { data: link } = await supabase
    .from("family_links")
    .select("id")
    .eq("parent_user_id", parent.id)
    .eq("student_user_id", studentId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!link) {
    throw new AppError("No tienes un hijo vinculado con ese ID", 403);
  }

  const uniqueIds = [...new Set(allergenIds)];
  const { error: deleteError } = await supabase
    .from("user_allergies")
    .delete()
    .eq("user_id", studentId);

  if (deleteError) {
    throw new AppError("Error al actualizar los alérgenos del alumno", 500);
  }

  if (uniqueIds.length > 0) {
    const rows = uniqueIds.map((allergen_id) => ({ user_id: studentId, allergen_id }));
    const { error: insertError } = await supabase.from("user_allergies").insert(rows);
    if (insertError) {
      throw new AppError("Error al guardar los alérgenos del alumno", 500);
    }
  }

  return { success: true, count: uniqueIds.length };
}

export async function getAllFamilyRelationships(): Promise<Array<{
  linkId: string;
  status: string;
  parentId: string;
  parentName: string;
  parentWallet: number;
  studentId: string;
  studentName: string;
  studentWallet: number;
}>> {
  const { data, error } = await supabase
    .from("family_links")
    .select(`
      id,
      status,
      parent_user_id,
      student_user_id,
      parent:users!family_links_parent_user_id_fkey (full_name, wallet_balance),
      student:users!family_links_student_user_id_fkey (full_name, wallet_balance)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Error al obtener las relaciones familiares", 500);
  }

  return (data ?? []).map((row: any) => ({
    linkId: row.id,
    status: row.status,
    parentId: row.parent_user_id,
    parentName: row.parent?.full_name ?? "Desconocido",
    parentWallet: Number(row.parent?.wallet_balance ?? 0),
    studentId: row.student_user_id,
    studentName: row.student?.full_name ?? "Desconocido",
    studentWallet: Number(row.student?.wallet_balance ?? 0),
  }));
}
