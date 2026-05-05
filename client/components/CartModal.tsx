import { useEffect, useState } from "react";
import OrderSummaryModal from "./OrderSummaryModal";
import AllergenWarningModal from "./AllergenWarningModal";
import { X, Minus, Plus, ShoppingCart, Users } from "lucide-react";
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
  productInfo?: {
    alergenos?: string[];
    trazas?: string[];
  } | null;
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

interface LinkedChild {
  studentId: string;
  studentName: string;
  walletBalance: number;
}

interface AllergenWarning {
  allergenId: string;
  allergenName: string;
  allergenCode: string;
  productNames: string[];
}

function productInfoAllergens(product?: ApiProduct): Array<{ name: string; code?: string }> {
  if (!product?.productInfo) return [];
  return [
    ...(product.productInfo.alergenos ?? []),
    ...(product.productInfo.trazas ?? []),
  ]
    .filter(Boolean)
    .map((name) => ({ name, code: name }));
}

export default function CartModal({ onClose, onOrderPlaced, onShowOrderSummary }: Props) {
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
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Load products and user allergies on mount
  const role = state.status === "authenticated" ? state.user.role : "";
  const isParent = role === "PARENT";
  const selectedChild = children.find((child) => child.studentId === selectedStudentId) ?? null;
  const parentNeedsCardPayment = Boolean(isParent && selectedChild && selectedChild.walletBalance < total);

  useEffect(() => {
    apiFetch<{ data: ApiProduct[] }>("/api/products")
      .then((productsRes) => {
        const pMap = new Map(productsRes.data.map((p) => [p.id, p]));
        setProductsMap(pMap);
      })
      .catch(() => {
        // Silently fail, warnings will just not show
      });
  }, [apiFetch]);

  useEffect(() => {
    if (!isParent) {
      apiFetch<{ data: UserAllergen[] }>("/api/me/allergies")
        .then((allergiesRes) => setUserAllergens(allergiesRes.data ?? []))
        .catch(() => setUserAllergens([]));
      return;
    }

    apiFetch<{ data: LinkedChild[] }>("/api/family/children")
      .then((res) => {
        const next = res.data ?? [];
        setChildren(next);
        setSelectedStudentId((current) => current || next[0]?.studentId || "");
      })
      .catch(() => setChildren([]));
  }, [apiFetch, isParent]);

  useEffect(() => {
    if (!isParent || !selectedStudentId) return;
    apiFetch<{ data: UserAllergen[] }>(`/api/family/children/${selectedStudentId}/allergies`)
      .then((allergiesRes) => setUserAllergens(allergiesRes.data ?? []))
      .catch(() => setUserAllergens([]));
  }, [apiFetch, isParent, selectedStudentId]);

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
      const allergens = [
        ...(product?.allergens ?? []),
        ...productInfoAllergens(product),
        ...(line.allergens ?? []),
      ];
      if (allergens.length === 0) continue;

      // Check if product has any user allergens
      for (const allergen of allergens) {
        const allergenKey = normalizedText(allergen.name);
        const allergenCodeKey = allergen.code ? normalizedText(allergen.code) : "";
        const matches =
          (allergen.id && userAllergenIds.has(allergen.id)) ||
          userAllergenKeys.has(allergenKey) ||
          (allergenCodeKey ? userAllergenKeys.has(allergenCodeKey) : false) ||
          [...userAllergenKeys].some((userKey) =>
            (userKey.length > 2 && allergenKey.includes(userKey)) ||
            (allergenKey.length > 2 && userKey.includes(allergenKey)) ||
            (allergenCodeKey.length > 2 && allergenCodeKey.includes(userKey))
          );

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
    if (isParent && !selectedStudentId) {
      setFeedback("Selecciona un hijo para confirmar el pedido");
      return;
    }

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
        ...(isParent ? { studentId: selectedStudentId } : {}),
        ...(parentNeedsCardPayment ? { paymentMethod: "CARD" } : {}),
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
      void res;
      const summary = {
        items: cart.map((line) => ({
          name: line.name,
          quantity: line.qty,
          unitPrice: line.price,
          customizations: line.options,
          kitchenNote: line.note,
        })),
        total,
        feedback: parentNeedsCardPayment
          ? "✓ Pedido pagado con tarjeta y creado correctamente"
          : "✓ Pedido creado correctamente",
      };
      clear();
      setFeedback(summary.feedback);
      window.dispatchEvent(new Event("walletBalanceChanged"));
      if (typeof onShowOrderSummary === "function") {
        onShowOrderSummary(summary);
      } else {
        setLastOrder(summary);
        setShowSummary(true);
      }
      onOrderPlaced?.();
    } catch (err) {
      const summary = {
        items: [],
        total: 0,
        feedback: err instanceof Error ? err.message : "No se pudo procesar el pedido",
      };
      setFeedback(summary.feedback);
      if (typeof onShowOrderSummary === "function") {
        onShowOrderSummary(summary);
      } else {
        setLastOrder(summary);
        setShowSummary(true);
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
            {cart.length > 0 && isParent && (
              <div className="rounded-2xl border border-[#c6efe7] bg-[#f0fbf8] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#1C9690]" />
                  <p className="text-sm font-bold text-slate-800">Pedido para</p>
                </div>
                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  className="w-full rounded-xl border border-[#92dbc8] bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#1C9690]"
                >
                  {children.length === 0 ? (
                    <option value="">Sin hijos vinculados</option>
                  ) : (
                    children.map((child) => (
                      <option key={child.studentId} value={child.studentId}>
                        {child.studentName} · saldo {money(child.walletBalance)}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="px-5 pt-3 pb-6 border-t border-slate-100 shrink-0 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Total</span>
                <span className="text-xl font-bold text-slate-900">{money(total)}</span>
              </div>
              {parentNeedsCardPayment && (
                <p className="rounded-2xl bg-[#f0fbf8] px-4 py-3 text-xs font-semibold leading-5 text-[#169486]">
                  El saldo de {selectedChild?.studentName} no alcanza. Se cobrará este pedido directamente a la tarjeta familiar.
                </p>
              )}
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
                  {loading
                    ? "Procesando..."
                    : parentNeedsCardPayment
                      ? `Pagar con tarjeta · ${money(total)}`
                      : `Confirmar pedido · ${money(total)}`}
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
