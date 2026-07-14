import { useEffect, useMemo, useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCard, X } from "lucide-react";

import { useApi } from "../hooks/useApi";
import { money } from "../lib/utils";

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === "true";
const publishableKey = IS_DEMO
  ? undefined
  : (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined);
const initialStripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Props = {
  open: boolean;
  studentId: string;
  studentName: string;
  amount: number;
  onClose: () => void;
  onPaid: (result: { newBalance: number; amount: number }) => void;
};

type IntentResponse = {
  clientSecret: string;
  paymentIntentId: string;
};

function StripeTopUpForm({
  clientSecret,
  paymentIntentId,
  amount,
  studentName,
  onClose,
  onPaid,
}: {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  studentName: string;
  onClose: () => void;
  onPaid: Props["onPaid"];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { apiFetch } = useApi();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setPaying(true);
    setError(null);
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        setError(result.error.message ?? "No se pudo confirmar el pago");
        return;
      }

      if (result.paymentIntent?.status !== "succeeded") {
        setError("El pago no se ha completado todavía");
        return;
      }

      const topUp = await apiFetch<{ newBalance: number; amount: number }>(
        "/api/payments/family/topup-confirm",
        {
          method: "POST",
          body: JSON.stringify({ paymentIntentId }),
        }
      );
      onPaid(topUp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar el pago");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#169486]">Stripe test</p>
          <h2 className="mt-1 text-lg font-black text-slate-900">Recargar monedero</h2>
          <p className="mt-1 text-sm text-slate-500">
            {money(amount)} para <strong className="text-slate-700">{studentName}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition active:scale-95"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: "16px",
                color: "#0f172a",
                "::placeholder": { color: "#94a3b8" },
              },
            },
          }}
        />
      </div>

      <div className="mt-3 rounded-2xl bg-[#f0fbf8] px-4 py-3 text-xs leading-5 text-slate-500">
        Prueba con <strong className="font-mono text-slate-700">4242 4242 4242 4242</strong>,
        fecha futura y cualquier CVC.
      </div>

      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handlePay}
        disabled={!stripe || paying}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1C9690] py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
      >
        {paying ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {paying ? "Procesando..." : `Pagar ${money(amount)}`}
      </button>
    </div>
  );
}

export default function StripeTopUpModal({
  open,
  studentId,
  studentName,
  amount,
  onClose,
  onPaid,
}: Props) {
  const { apiFetch } = useApi();
  const [intent, setIntent] = useState<IntentResponse | null>(null);
  const [stripePromise, setStripePromise] = useState(initialStripePromise);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stripeOptions = useMemo(() => ({ locale: "es" as const }), []);

  useEffect(() => {
    if (!open) return;
    setIntent(null);
    setError(null);

    setLoading(true);
    (async () => {
      let nextStripePromise = stripePromise;
      if (!nextStripePromise) {
        const config = await apiFetch<{ publishableKey: string }>("/api/payments/config");
        nextStripePromise = loadStripe(config.publishableKey);
        setStripePromise(nextStripePromise);
      }

      const nextIntent = await apiFetch<IntentResponse>("/api/payments/family/topup-intent", {
        method: "POST",
        body: JSON.stringify({ studentId, amount }),
      });
      setIntent(nextIntent);
    })()
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo iniciar Stripe"))
      .finally(() => setLoading(false));
  }, [amount, apiFetch, open, studentId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-5 backdrop-blur-[2px]">
      <div className="w-full max-w-sm">
        {loading && (
          <div className="rounded-3xl bg-white p-8 text-center shadow-2xl">
            <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-[#92dbc8] border-t-[#1C9690]" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Preparando pago seguro...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-black text-slate-900">No se pudo abrir Stripe</h2>
            <p className="mt-2 text-sm leading-6 text-red-500">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
            >
              Cerrar
            </button>
          </div>
        )}

        {!loading && intent && stripePromise && (
          <Elements stripe={stripePromise} options={stripeOptions}>
            <StripeTopUpForm
              clientSecret={intent.clientSecret}
              paymentIntentId={intent.paymentIntentId}
              amount={amount}
              studentName={studentName}
              onClose={onClose}
              onPaid={onPaid}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
