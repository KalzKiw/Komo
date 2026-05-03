import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { allergenVisual } from "../lib/allergens";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AllergenWarning {
  allergenId: string;
  allergenName: string;
  allergenCode: string;
  productNames: string[];
}

interface AllergenWarningModalProps {
  open: boolean;
  warnings: AllergenWarning[];
  userAllergens: Array<{ code: string; name: string }>;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AllergenWarningModal({
  open,
  warnings,
  userAllergens,
  onConfirm,
  onCancel,
  isLoading = false,
}: AllergenWarningModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (!open) {
      setSecondsLeft(5);
      return;
    }

    setSecondsLeft(5);
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [open]);

  if (!open) return null;

  const canContinue = secondsLeft === 0 && !isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[85svh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 bg-amber-50 px-5 py-5 shrink-0">
          <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <div>
            <h2 className="font-bold text-lg text-slate-900">Advertencia de alérgenos</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Algunos productos contienen tus alérgenos
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Tus alérgenos */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-3">
              Tus alérgenos
            </h3>
            <div className="flex flex-wrap gap-2">
              {userAllergens.map((allergen) => {
                const visual = allergenVisual(allergen.name);
                return (
                  <div
                    key={allergen.code}
                    title={allergen.name}
                    className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900"
                  >
                    <span className="text-lg">{visual.icon}</span>
                    <span>{allergen.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Warnings */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-3">
              Detectado en:
            </h3>
            <div className="space-y-3">
              {warnings.map((warning) => {
                const visual = allergenVisual(warning.allergenName);
                return (
                  <div
                    key={warning.allergenId}
                    className="rounded-2xl bg-red-50 border border-red-100 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{visual.icon}</span>
                      <p className="font-semibold text-red-900 text-sm">
                        {warning.allergenName}
                      </p>
                    </div>
                    <div className="pl-9 space-y-1">
                      {warning.productNames.map((productName, idx) => (
                        <p key={idx} className="text-sm text-red-700">
                          • {productName}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info message */}
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 mt-4">
            <p className="text-sm text-blue-900">
              <strong>⚠️ Importante:</strong> Si tienes alergia a estos ingredientes, <strong>no continúes</strong>.
              Si necesitas ayuda, contacta con el personal.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 shrink-0 border-t border-slate-100 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canContinue}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : secondsLeft > 0 ? (
              `Continuar de todas formas (${secondsLeft}s)`
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Continuar de todas formas
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
