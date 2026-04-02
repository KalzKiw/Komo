import { useEffect, useState } from "react";
import { Check, ArrowLeft } from "lucide-react";
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
  onBack: () => void;
  onSaved: (newLabel: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AllergenPickerScreen({ onBack, onSaved }: Props) {
  const { apiFetch } = useApi();

  const [allAllergens, setAllAllergens] = useState<Allergen[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: Allergen[] }>("/api/allergens"),
      apiFetch<{ data: Allergen[] }>("/api/me/allergies"),
    ])
      .then(([all, mine]) => {
        setAllAllergens(all.data);
        setSelected(new Set(mine.data.map((a) => a.id)));
      })
      .catch(() => setError("Error al cargar los alérgenos"))
      .finally(() => setLoading(false));
  }, [apiFetch]);

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

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-slate-500 transition-all active:scale-90 hover:bg-gray-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-slate-900">Mis alérgenos</h2>
          <p className="text-xs text-slate-400">Marca los que aplican a ti</p>
        </div>
        <button
          type="button"
          disabled={saving || loading}
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-60"
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Guardar
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {error && (
          <p className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">{error}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          </div>
        ) : (
          <>
            {/* Selected count badge */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {selected.size === 0 ? "Ninguno seleccionado" : `${selected.size} seleccionado${selected.size !== 1 ? "s" : ""}`}
              </p>
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs font-semibold text-red-400 hover:text-red-500"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {allAllergens.map((allergen, i) => {
                const isActive = selected.has(allergen.id);
                return (
                  <button
                    key={allergen.id}
                    type="button"
                    onClick={() => toggle(allergen.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                      i < allAllergens.length - 1 ? "border-b border-gray-50" : ""
                    } ${isActive ? "bg-emerald-50" : "hover:bg-gray-50"}`}
                  >
                    {/* Emoji */}
                    <span className="w-8 text-center text-xl leading-none">
                      {allergenEmoji(allergen.code)}
                    </span>

                    {/* Name */}
                    <span className={`flex-1 text-sm font-semibold ${isActive ? "text-emerald-800" : "text-slate-700"}`}>
                      {allergen.name}
                    </span>

                    {/* Checkbox */}
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                        isActive
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isActive && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </span>
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
  );
}
