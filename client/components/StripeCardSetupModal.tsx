import { useEffect, useMemo, useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCard, X } from "lucide-react";

import { useApi } from "../hooks/useApi";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const initialStripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (card: { lastFourDigits: string }) => void;
};

type SetupIntentResponse = {
  clientSecret: string;
  setupIntentId: string;
};

function CardSetupForm({
  clientSecret,
  setupIntentId,
  onClose,
  onSaved,
}: SetupIntentResponse & Pick<Props, "onClose" | "onSaved">) {
  const stripe = useStripe();
  const elements = useElements();
  const { apiFetch } = useApi();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setSaving(true);
    setError(null);
    try {
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        setError(result.error.message ?? "No se pudo confirmar la tarjeta");
        return;
      }

      if (result.setupIntent?.status !== "succeeded") {
        setError("La tarjeta no se ha guardado todavía");
        return;
      }

      const saved = await apiFetch<{ lastFourDigits: string }>(
        "/api/payments/profile/card-setup-confirm",
        {
          method: "POST",
          body: JSON.stringify({ setupIntentId }),
        }
      );
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la tarjeta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#169486]">Stripe test</p>
          <h2 className="mt-1 text-lg font-black text-slate-900">Guardar tarjeta</h2>
          <p className="mt-1 text-sm text-slate-500">Método de pago del perfil familiar.</p>
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
        fecha futura y cualquier CVC. No se cobrará dinero.
      </div>

      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={!stripe || saving}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1C9690] py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {saving ? "Guardando..." : "Guardar tarjeta"}
      </button>
    </div>
  );
}

export default function StripeCardSetupModal({ open, onClose, onSaved }: Props) {
  const { apiFetch } = useApi();
  const [setupIntent, setSetupIntent] = useState<SetupIntentResponse | null>(null);
  const [stripePromise, setStripePromise] = useState(initialStripePromise);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stripeOptions = useMemo(() => ({ locale: "es" as const }), []);

  useEffect(() => {
    if (!open) return;
    setSetupIntent(null);
    setError(null);
    setLoading(true);

    (async () => {
      let nextStripePromise = stripePromise;
      if (!nextStripePromise) {
        const config = await apiFetch<{ publishableKey: string }>("/api/payments/config");
        nextStripePromise = loadStripe(config.publishableKey);
        setStripePromise(nextStripePromise);
      }

      const nextSetupIntent = await apiFetch<SetupIntentResponse>(
        "/api/payments/profile/card-setup-intent",
        { method: "POST" }
      );
      setSetupIntent(nextSetupIntent);
    })()
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo iniciar Stripe"))
      .finally(() => setLoading(false));
  }, [apiFetch, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-5 backdrop-blur-[2px]">
      <div className="w-full max-w-sm">
        {loading && (
          <div className="rounded-3xl bg-white p-8 text-center shadow-2xl">
            <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-[#92dbc8] border-t-[#1C9690]" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Preparando Stripe...</p>
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

        {!loading && setupIntent && stripePromise && (
          <Elements stripe={stripePromise} options={stripeOptions}>
            <CardSetupForm
              clientSecret={setupIntent.clientSecret}
              setupIntentId={setupIntent.setupIntentId}
              onClose={onClose}
              onSaved={onSaved}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
