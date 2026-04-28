import { useState } from "react";
import { X, CreditCard } from "lucide-react";

interface BankCardModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (cardData: {
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  }) => Promise<void>;
}

export default function BankCardModal({ open, onClose, onSave }: BankCardModalProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);

  function formatCardNumber(value: string): string {
    const cleaned = value.replace(/\D/g, "");
    const formatted = cleaned
      .slice(0, 16)
      .replace(/(\d{4})/g, "$1 ")
      .trim();
    return formatted;
  }

  function formatCVV(value: string): string {
    return value.replace(/\D/g, "").slice(0, 4);
  }

  async function handleSave() {
    setError(null);

    // Validate
    if (!cardNumber.trim()) {
      setError("Número de tarjeta requerido");
      return;
    }
    if (!cardholderName.trim()) {
      setError("Nombre del titular requerido");
      return;
    }
    if (!expiryMonth || !expiryYear) {
      setError("Fecha de expiración requerida");
      return;
    }
    if (!cvv.trim()) {
      setError("CVV requerido");
      return;
    }

    const cleanedNumber = cardNumber.replace(/\s/g, "");
    if (cleanedNumber.length !== 16) {
      setError("Número de tarjeta inválido (16 dígitos)");
      return;
    }
    if (cvv.length < 3) {
      setError("CVV inválido");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        cardNumber: cleanedNumber,
        cardholderName,
        expiryMonth,
        expiryYear,
        cvv,
      });
      // Reset form on success
      setCardNumber("");
      setCardholderName("");
      setExpiryMonth("");
      setExpiryYear("");
      setCvv("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la tarjeta");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tarjeta de banco</h2>
              <p className="text-xs text-slate-500">Información de pago</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-6 overflow-y-auto max-h-[calc(100vh-180px)]">
          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Card Preview */}
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-lg">
            <div className="mb-12 flex items-center justify-between">
              <span className="text-sm font-semibold opacity-75">VISA</span>
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="mb-4 text-lg font-mono tracking-wider">
              {cardNumber ? (
                <>
                  {cardNumber.split("").map((char, i) => (
                    <span key={i} className={char === " " ? "mx-1" : ""}>
                      {char === " " ? "" : char}
                    </span>
                  ))}
                </>
              ) : (
                "•••• •••• •••• ••••"
              )}
            </div>
            <div className="flex justify-between">
              <div>
                <p className="text-xs opacity-75">TITULAR</p>
                <p className="font-semibold uppercase">
                  {cardholderName || "Nombre del titular"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-75">VENCE</p>
                <p className="font-semibold">
                  {expiryMonth ? `${expiryMonth}/${expiryYear}` : "MM/YY"}
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-4">
            {/* Cardholder Name */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nombre del titular
              </span>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => {
                  setCardholderName(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="Juan García López"
                maxLength={26}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>

            {/* Card Number */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Número de tarjeta
              </span>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => {
                  setCardNumber(formatCardNumber(e.target.value));
                  setError(null);
                }}
                placeholder="1234 5678 9101 1121"
                maxLength={19}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mes
                </span>
                <select
                  value={expiryMonth}
                  onChange={(e) => {
                    setExpiryMonth(e.target.value);
                    setError(null);
                  }}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">MM</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = String(i + 1).padStart(2, "0");
                    return (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Año
                </span>
                <select
                  value={expiryYear}
                  onChange={(e) => {
                    setExpiryYear(e.target.value);
                    setError(null);
                  }}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">YY</option>
                  {years.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  CVV
                </span>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => {
                    setCvv(formatCVV(e.target.value));
                    setError(null);
                  }}
                  placeholder="123"
                  maxLength={4}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
            </div>

            {/* Info note */}
            <p className="text-xs text-slate-500 pt-2">
              💳 Tus datos de pago son seguros y encriptados. Nunca compartimos tu información con terceros.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 py-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-slate-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar tarjeta"}
          </button>
        </div>
      </div>
    </div>
  );
}
