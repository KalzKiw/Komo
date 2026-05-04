import Stripe from "stripe";

import { env, supabase } from "../config";
import { AppError } from "../errors/app-error";
import { AuthUser } from "../types/domain";
import { roundMoney } from "../utils/money";
import { topUpChildWallet } from "./family.service";

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

function ensureStripe() {
  if (!stripe) {
    throw new AppError("Stripe no está configurado. Añade STRIPE_SECRET_KEY en modo test.", 500);
  }
  return stripe;
}

async function ensureActiveFamilyLink(parent: AuthUser, studentId: string): Promise<void> {
  if (parent.role !== "PARENT") {
    throw new AppError("Solo los padres pueden pagar recargas familiares", 403);
  }

  const { data: link, error } = await supabase
    .from("family_links")
    .select("id")
    .eq("parent_user_id", parent.id)
    .eq("student_user_id", studentId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) {
    throw new AppError("No se pudo validar el vínculo familiar", 500);
  }

  if (!link) {
    throw new AppError("No tienes un hijo vinculado con ese ID", 403);
  }
}

async function studentBalance(studentId: string): Promise<number> {
  const { data, error } = await supabase
    .from("users")
    .select("wallet_balance")
    .eq("id", studentId)
    .single();

  if (error || !data) {
    throw new AppError("No se pudo consultar el saldo del alumno", 500);
  }

  return Number((data as { wallet_balance: number }).wallet_balance ?? 0);
}

async function getOrCreateStripeCustomer(parent: AuthUser): Promise<string> {
  const { data, error } = await supabase
    .from("users")
    .select("email, full_name, stripe_customer_id")
    .eq("id", parent.id)
    .single();

  if (error || !data) {
    throw new AppError("No se pudo preparar el cliente de Stripe", 500);
  }

  const profile = data as {
    email: string;
    full_name: string;
    stripe_customer_id?: string | null;
  };

  if (profile.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const customer = await ensureStripe().customers.create({
    email: profile.email,
    name: profile.full_name,
    metadata: { parentId: parent.id },
  });

  const { error: updateError } = await supabase
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", parent.id);

  if (updateError) {
    throw new AppError("No se pudo guardar el cliente de Stripe", 500);
  }

  return customer.id;
}

export async function createFamilyTopUpIntent(
  parent: AuthUser,
  studentId: string,
  amount: number
): Promise<{ clientSecret: string; paymentIntentId: string; amount: number; currency: string }> {
  await ensureActiveFamilyLink(parent, studentId);

  const topUpAmount = roundMoney(amount);
  if (topUpAmount <= 0 || topUpAmount > 200) {
    throw new AppError("El importe debe estar entre 0.01€ y 200€", 400);
  }

  const paymentIntent = await ensureStripe().paymentIntents.create({
    amount: Math.round(topUpAmount * 100),
    currency: "eur",
    payment_method_types: ["card"],
    metadata: {
      kind: "family_wallet_topup",
      parentId: parent.id,
      studentId,
      amount: String(topUpAmount),
      walletCredited: "false",
    },
  });

  if (!paymentIntent.client_secret) {
    throw new AppError("No se pudo iniciar el pago con Stripe", 500);
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: topUpAmount,
    currency: paymentIntent.currency,
  };
}

export function getStripePublishableKey(): { publishableKey: string } {
  if (!env.VITE_STRIPE_PUBLISHABLE_KEY) {
    throw new AppError("Falta VITE_STRIPE_PUBLISHABLE_KEY en modo test.", 500);
  }

  return { publishableKey: env.VITE_STRIPE_PUBLISHABLE_KEY };
}

export async function createProfileCardSetupIntent(parent: AuthUser): Promise<{
  clientSecret: string;
  setupIntentId: string;
}> {
  if (parent.role !== "PARENT") {
    throw new AppError("Solo los padres pueden guardar métodos de pago", 403);
  }

  const customerId = await getOrCreateStripeCustomer(parent);

  const setupIntent = await ensureStripe().setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    usage: "off_session",
    metadata: {
      kind: "profile_payment_method",
      parentId: parent.id,
    },
  });

  if (!setupIntent.client_secret) {
    throw new AppError("No se pudo iniciar el guardado de tarjeta con Stripe", 500);
  }

  return {
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id,
  };
}

export async function confirmProfileCardSetup(
  parent: AuthUser,
  setupIntentId: string
): Promise<{ lastFourDigits: string }> {
  if (parent.role !== "PARENT") {
    throw new AppError("Solo los padres pueden guardar métodos de pago", 403);
  }

  const setupIntent = await ensureStripe().setupIntents.retrieve(setupIntentId);
  const metadata = setupIntent.metadata ?? {};

  if (metadata.kind !== "profile_payment_method") {
    throw new AppError("La operación no corresponde a un método de pago de perfil", 400);
  }

  if (metadata.parentId !== parent.id) {
    throw new AppError("No tienes permiso para confirmar esta tarjeta", 403);
  }

  if (setupIntent.status !== "succeeded") {
    throw new AppError("La tarjeta todavía no ha sido confirmada por Stripe", 409);
  }

  if (!setupIntent.payment_method || typeof setupIntent.payment_method !== "string") {
    throw new AppError("No se pudo leer el método de pago guardado", 500);
  }

  const paymentMethod = await ensureStripe().paymentMethods.retrieve(setupIntent.payment_method);
  const lastFourDigits = paymentMethod.card?.last4;

  if (!lastFourDigits) {
    throw new AppError("No se pudo leer la tarjeta guardada", 500);
  }

  const { error } = await supabase
    .from("users")
    .update({
      payment_card_last4: lastFourDigits,
      stripe_customer_id: typeof setupIntent.customer === "string" ? setupIntent.customer : null,
      stripe_payment_method_id: setupIntent.payment_method,
    })
    .eq("id", parent.id);

  if (error) {
    throw new AppError("No se pudo guardar la tarjeta en el perfil", 500);
  }

  return { lastFourDigits };
}

export async function listProfileCards(parent: AuthUser): Promise<{
  data: Array<{
    id: string;
    brand: string;
    lastFourDigits: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
  }>;
}> {
  if (parent.role !== "PARENT") {
    throw new AppError("Solo los padres pueden consultar métodos de pago", 403);
  }

  const { data, error } = await supabase
    .from("users")
    .select("stripe_customer_id, stripe_payment_method_id")
    .eq("id", parent.id)
    .single();

  if (error || !data) {
    throw new AppError("No se pudieron consultar tus tarjetas", 500);
  }

  const profile = data as {
    stripe_customer_id?: string | null;
    stripe_payment_method_id?: string | null;
  };

  if (!profile.stripe_customer_id) {
    return { data: [] };
  }

  const paymentMethods = await ensureStripe().paymentMethods.list({
    customer: profile.stripe_customer_id,
    type: "card",
  });

  return {
    data: paymentMethods.data
      .filter((paymentMethod) => paymentMethod.card)
      .map((paymentMethod) => ({
        id: paymentMethod.id,
        brand: paymentMethod.card?.brand ?? "card",
        lastFourDigits: paymentMethod.card?.last4 ?? "0000",
        expMonth: paymentMethod.card?.exp_month ?? 0,
        expYear: paymentMethod.card?.exp_year ?? 0,
        isDefault: paymentMethod.id === profile.stripe_payment_method_id,
      })),
  };
}

export async function removeProfileCard(parent: AuthUser, paymentMethodId?: string): Promise<{ removed: true }> {
  if (parent.role !== "PARENT") {
    throw new AppError("Solo los padres pueden eliminar métodos de pago", 403);
  }

  const { data, error } = await supabase
    .from("users")
    .select("stripe_customer_id, stripe_payment_method_id")
    .eq("id", parent.id)
    .single();

  if (error || !data) {
    throw new AppError("No se pudo consultar tu método de pago", 500);
  }

  const profile = data as {
    stripe_customer_id?: string | null;
    stripe_payment_method_id?: string | null;
  };
  const targetPaymentMethodId = paymentMethodId ?? profile.stripe_payment_method_id;

  if (targetPaymentMethodId) {
    await ensureStripe().paymentMethods.detach(targetPaymentMethodId).catch(() => undefined);
  }

  let nextPaymentMethodId: string | null = profile.stripe_payment_method_id ?? null;
  let nextLastFour: string | null = null;

  if (profile.stripe_customer_id && targetPaymentMethodId === profile.stripe_payment_method_id) {
    const remaining = await ensureStripe().paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: "card",
    });
    const next = remaining.data.find((paymentMethod) => paymentMethod.card) ?? null;
    nextPaymentMethodId = next?.id ?? null;
    nextLastFour = next?.card?.last4 ?? null;
  }

  const updatePayload =
    targetPaymentMethodId === profile.stripe_payment_method_id
      ? {
          payment_card_last4: nextLastFour,
          stripe_payment_method_id: nextPaymentMethodId,
        }
      : {
          stripe_payment_method_id: profile.stripe_payment_method_id,
        };

  const { error: updateError } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", parent.id);

  if (updateError) {
    throw new AppError("No se pudo eliminar la tarjeta del perfil", 500);
  }

  return { removed: true };
}

export async function chargeSavedFamilyTopUp(
  parent: AuthUser,
  studentId: string,
  amount: number
): Promise<{ newBalance: number; amount: number; lastFourDigits: string }> {
  await ensureActiveFamilyLink(parent, studentId);

  const topUpAmount = roundMoney(amount);
  if (topUpAmount <= 0 || topUpAmount > 200) {
    throw new AppError("El importe debe estar entre 0.01€ y 200€", 400);
  }

  const { data, error } = await supabase
    .from("users")
    .select("stripe_customer_id, stripe_payment_method_id, payment_card_last4")
    .eq("id", parent.id)
    .single();

  if (error || !data) {
    throw new AppError("No se pudo consultar tu método de pago", 500);
  }

  const profile = data as {
    stripe_customer_id?: string | null;
    stripe_payment_method_id?: string | null;
    payment_card_last4?: string | null;
  };

  if (!profile.stripe_customer_id || !profile.stripe_payment_method_id || !profile.payment_card_last4) {
    throw new AppError("Guarda primero una tarjeta en tu perfil", 409);
  }

  const paymentIntent = await ensureStripe().paymentIntents.create({
    amount: Math.round(topUpAmount * 100),
    currency: "eur",
    customer: profile.stripe_customer_id,
    payment_method: profile.stripe_payment_method_id,
    payment_method_types: ["card"],
    confirm: true,
    off_session: true,
    metadata: {
      kind: "family_wallet_topup_saved_card",
      parentId: parent.id,
      studentId,
      amount: String(topUpAmount),
    },
  });

  if (paymentIntent.status !== "succeeded") {
    throw new AppError("Stripe no pudo confirmar el pago con la tarjeta guardada", 409);
  }

  const result = await topUpChildWallet(parent, studentId, topUpAmount);

  return {
    newBalance: result.newBalance,
    amount: topUpAmount,
    lastFourDigits: profile.payment_card_last4,
  };
}

export async function confirmFamilyTopUpPayment(
  parent: AuthUser,
  paymentIntentId: string
): Promise<{ newBalance: number; amount: number }> {
  const paymentIntent = await ensureStripe().paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.metadata.kind !== "family_wallet_topup") {
    throw new AppError("El pago no corresponde a una recarga familiar", 400);
  }

  if (paymentIntent.metadata.parentId !== parent.id) {
    throw new AppError("No tienes permiso para confirmar este pago", 403);
  }

  const studentId = paymentIntent.metadata.studentId;
  const amount = roundMoney(Number(paymentIntent.metadata.amount));
  await ensureActiveFamilyLink(parent, studentId);

  if (paymentIntent.status !== "succeeded") {
    throw new AppError("El pago todavía no está confirmado por Stripe", 409);
  }

  if (paymentIntent.metadata.walletCredited === "true") {
    return { newBalance: await studentBalance(studentId), amount };
  }

  const result = await topUpChildWallet(parent, studentId, amount);

  await ensureStripe().paymentIntents.update(paymentIntent.id, {
    metadata: {
      ...paymentIntent.metadata,
      walletCredited: "true",
    },
  });

  return { newBalance: result.newBalance, amount };
}
