import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useApi } from "../hooks/useApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Allergen {
  id: string;
  code: string;
  name: string;
}

// ─── Allergen emoji map ───────────────────────────────────────────────────────

const ALLERGEN_EMOJI: Record<string, string> = {
  GLUTEN:     "🌾",
  LACTOSE:    "🥛",
  NUTS:       "🥜",
  EGGS:       "🥚",
  FISH:       "🐟",
  SHELLFISH:  "🦐",
  SOY:        "🫘",
  SESAME:     "🌿",
  MUSTARD:    "🌭",
  CELERY:     "🥬",
  LUPINS:     "🌸",
  MOLLUSCS:   "🐚",
  SULPHITES:  "🍷",
  PEANUTS:    "🥜",
};

function allergenEmoji(code: string) {
  return ALLERGEN_EMOJI[code.toUpperCase()] ?? "⚠️";
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (newLabel: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AllergenPickerScreen({ open, onClose, onSaved }: Props) {
  const { apiFetch } = useApi();

  const [allAllergens, setAllAllergens] = useState<Allergen[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch("/api/allergens").then((res) => res.json()),
      apiFetch<{ data: Allergen[] }>("/api/me/allergies"),
    ])
      .then(([all, mine]) => {
        setAllAllergens(all.data ?? []);
        setSelected(new Set(mine.data.map((a) => a.id)));
      })
      .catch(() => setError("Error al cargar los alérgenos"))
      .finally(() => setLoading(false));
  }, [apiFetch, open]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/me/allergies", {
        method: "PUT",
        body: JSON.stringify({ allergenIds: [...selected] }),
      });
      const label =
        selected.size === 0
          ? "Sin configurar"
          : allAllergens
              .filter((a) => selected.has(a.id))
              .slice(0, 3)
              .map((a) => a.name)
              .join(", ") + (selected.size > 3 ? ` +${selected.size - 3}` : "");
      onSaved(label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Mis alérgenos</h2>
            <p className="text-xs text-slate-500">Marca los que aplican a ti</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M18.3 5.71a1 1 0 0 0-1.42 0L12 10.59 7.12 5.71A1 1 0 1 0 5.7 7.12L10.59 12l-4.88 4.88a1 1 0 1 0 1.42 1.42L12 13.41l4.88 4.89a1 1 0 0 0 1.42-1.42L13.41 12l4.89-4.88a1 1 0 0 0 0-1.41Z" />
            </svg>
          </button>
        </div>

        <div className="border-b border-slate-200 px-5 py-4">
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Guardar
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          {error && (
            <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                <span>{selected.size === 0 ? "Ninguno seleccionado" : `${selected.size} seleccionado${selected.size !== 1 ? "s" : ""}`}</span>
                {selected.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    className="font-semibold text-red-500 hover:text-red-600"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              <div className="rounded-3xl bg-slate-50 p-1">
                {allAllergens.map((allergen, i) => {
                  const isActive = selected.has(allergen.id);
                  return (
                    <button
                      key={allergen.id}
                      type="button"
                      onClick={() => toggle(allergen.id)}
                      className={`flex w-full items-center gap-3 rounded-3xl px-4 py-4 text-left transition ${
                        isActive ? "bg-emerald-50" : "hover:bg-slate-100"
                      } ${i < allAllergens.length - 1 ? "mb-1" : ""}`}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white text-slate-600 text-sm font-semibold">
                        {allergen.code.slice(0, 2).toUpperCase()}
                      </span>
                      <span className={`flex-1 text-sm font-medium ${isActive ? "text-emerald-700" : "text-slate-700"}`}>
                        {allergen.name}
                      </span>
                      <span className={`h-5 w-5 rounded-full border-2 ${isActive ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"}`} />
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-center text-xs text-slate-400">
                Esta información permite al personal de cocina identificar alérgenos en tus pedidos.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
