import { useEffect, useState } from "react";
import OrderSummaryModal from "./OrderSummaryModal";
import AllergenWarningModal from "./AllergenWarningModal";
import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { money, normalizedText } from "../lib/utils";

type Props = {
  onClose: () => void;
  onOrderPlaced?: () => void;
  onShowOrderSummary?: (summary: { items: any[]; total: number; feedback: string }) => void;
};

interface ApiProduct {
  id: string;
  name: string;
  allergens?: Array<{
    id: string;
    code: string;
    name: string;
  }>;
}

interface UserAllergen {
  id: string;
  code: string;
  name: string;
}

interface AllergenWarning {
  allergenId: string;
  allergenName: string;
  allergenCode: string;
  productNames: string[];
}

export default function CartModal({ onClose, onOrderPlaced }: Props) {
  const { cart, updateQty, total, clear } = useCart();
  const { state } = useAuth();
  const { apiFetch } = useApi();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  // Allergen warning state
  const [showAllergenWarning, setShowAllergenWarning] = useState(false);
  const [allergenWarnings, setAllergenWarnings] = useState<AllergenWarning[]>([]);
  const [userAllergens, setUserAllergens] = useState<UserAllergen[]>([]);
  const [confirmedWarning, setConfirmedWarning] = useState(false);
  const [productsMap, setProductsMap] = useState<Map<string, ApiProduct>>(new Map());

  // Load products and user allergies on mount
  useEffect(() => {
    Promise.all([
      apiFetch<{ data: ApiProduct[] }>("/api/products"),
      apiFetch<{ data: UserAllergen[] }>("/api/me/allergies"),
    ])
      .then(([productsRes, allergiesRes]) => {
        const pMap = new Map(productsRes.data.map((p) => [p.id, p]));
        setProductsMap(pMap);
        setUserAllergens(allergiesRes.data ?? []);
      })
      .catch(() => {
        // Silently fail, warnings will just not show
      });
  }, [apiFetch]);

  function detectAllergenWarnings(): AllergenWarning[] {
    if (userAllergens.length === 0) return [];

    const userAllergenIds = new Set(userAllergens.map((a) => a.id));
    const userAllergenKeys = new Set(
      userAllergens.flatMap((a) => [a.code, a.name].filter(Boolean).map((value) => normalizedText(value)))
    );
    const warningMap = new Map<string, AllergenWarning>();

    // Check each product in cart
    for (const line of cart) {
      const product = productsMap.get(line.id);
      const allergens = product?.allergens?.length ? product.allergens : line.allergens ?? [];
      if (allergens.length === 0) continue;

      // Check if product has any user allergens
      for (const allergen of allergens) {
        const allergenKey = normalizedText(allergen.name);
        const matches =
          (allergen.id && userAllergenIds.has(allergen.id)) ||
          userAllergenKeys.has(allergenKey) ||
          (allergen.code ? userAllergenKeys.has(normalizedText(allergen.code)) : false);

        if (matches) {
          const key = allergen.id ?? allergenKey;
          if (!warningMap.has(key)) {
            warningMap.set(key, {
              allergenId: key,
              allergenName: allergen.name,
              allergenCode: allergen.code ?? allergen.name,
              productNames: [],
            });
          }
          const warning = warningMap.get(key)!;
          if (!warning.productNames.includes(line.name)) {
            warning.productNames.push(line.name);
          }
        }
      }
    }

    return Array.from(warningMap.values());
  }

  async function handleCheckoutClick() {
    const warnings = detectAllergenWarnings();

    if (warnings.length > 0 && !confirmedWarning) {
      setAllergenWarnings(warnings);
      setShowAllergenWarning(true);
      return;
    }

    // Proceed with checkout
    await checkout(confirmedWarning);
  }

  async function checkout(acknowledgedAllergenWarning = false) {
    if (cart.length === 0) return;
    setFeedback("");
    setLoading(true);
    setShowAllergenWarning(false);
    try {
      const payload = {
        shift: "MORNING",
        scheduledFor: new Date().toISOString().slice(0, 10),
        items: cart.map((line) => ({
          productId: line.id,
          quantity: line.qty,
          customizations: line.options ?? [],
          kitchenNote: line.note || undefined,
        })),
        acknowledgedAllergenWarning,
      };
      const res = await apiFetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
      const summary = {
        items: cart.map((line) => ({
          name: line.name,
          quantity: line.qty,
          unitPrice: line.price,
          customizations: line.options,
          kitchenNote: line.note,
        })),
        total,
        feedback: "✓ Pedido creado correctamente",
      };
      clear();
      setLastOrder(summary);
      setFeedback(summary.feedback);
      setShowSummary(true);
      window.dispatchEvent(new Event("walletBalanceChanged"));
      console.log("RESUMEN (success)", summary);
      if (typeof onShowOrderSummary === "function") {
        onShowOrderSummary(summary);
      }
      onOrderPlaced?.();
    } catch (err) {
      const summary = {
        items: [],
        total: 0,
        feedback: err instanceof Error ? err.message : "No se pudo procesar el pedido",
      };
      setFeedback(summary.feedback);
      setLastOrder(summary);
      setShowSummary(true);
      console.log("RESUMEN (error)", summary);
      if (typeof onShowOrderSummary === "function") {
        onShowOrderSummary(summary);
      }
    } finally {
      setConfirmedWarning(false);
      setLoading(false);
    }
  }

  function handleCloseSummary() {
    setShowSummary(false);
    setLastOrder(null);
    setFeedback("");
    onClose(); // Cierra el modal inmediatamente
  }

  function handleGoToOrders() {
    setShowSummary(false);
    setLastOrder(null);
    setFeedback("");
    if (typeof onShowOrderSummary === "function") {
      onShowOrderSummary({ items: [], total: 0, feedback: "goToOrders" });
    }
    onClose(); // Cierra el modal inmediatamente
  }

  const role = state.status === "authenticated" ? state.user.role : "";

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-lg rounded-t-3xl bg-white shadow-2xl flex flex-col max-h-[85svh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#1C9690]" />
              <h2 className="font-bold text-lg text-slate-900">Tu carrito</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-3">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Tu carrito está vacío</p>
              </div>
            ) : (
              cart.map((line) => (
                <div key={line.signature} className="flex items-center gap-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{line.name}</p>
                    <p className="text-xs text-slate-500">{money(line.price)}</p>
                    {(line.options.length > 0 || line.note) && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {[...line.options, line.note ? `Nota: ${line.note}` : ""]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQty(line.signature, -1)}
                      className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5 text-slate-600" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(line.signature, 1)}
                      className="h-7 w-7 rounded-full bg-[#c6efe7] flex items-center justify-center hover:bg-[#92dbc8] transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#169486]" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-slate-900 w-14 text-right shrink-0">
                    {money(line.price * line.qty)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="px-5 pt-3 pb-6 border-t border-slate-100 shrink-0 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Total</span>
                <span className="text-xl font-bold text-slate-900">{money(total)}</span>
              </div>
              {feedback && !showSummary && (
                <p className={`text-sm text-center ${feedback.startsWith("✓") ? "text-[#1C9690]" : "text-red-500"}`}>
                  {feedback}
                </p>
              )}
              {role !== "ADMIN" && role !== "STAFF" && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCheckoutClick}
                  className="w-full rounded-2xl bg-[#1C9690] py-3.5 text-center font-bold text-white shadow-lg shadow-[#92dbc8] hover:bg-[#169486] active:scale-95 transition-all disabled:opacity-60"
                >
                  {loading ? "Procesando..." : `Confirmar pedido · ${money(total)}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Allergen Warning Modal */}
      <AllergenWarningModal
        open={showAllergenWarning}
        warnings={allergenWarnings}
        userAllergens={userAllergens}
        onConfirm={() => {
          setConfirmedWarning(true);
          setShowAllergenWarning(false);
          // Call checkout after confirming
          checkout(true);
        }}
        onCancel={() => {
          setShowAllergenWarning(false);
          setConfirmedWarning(false);
        }}
        isLoading={loading}
      />

      {/* Modal de resumen SIEMPRE por encima */}
      {showSummary && lastOrder && (
        <div style={{ zIndex: 9999, position: 'fixed', inset: 0 }}>
          <OrderSummaryModal
            open={showSummary}
            items={lastOrder.items}
            total={lastOrder.total}
            feedback={lastOrder.feedback}
            onClose={handleCloseSummary}
            onGoToOrders={handleGoToOrders}
          />
        </div>
      )}
    </>
  );
}
