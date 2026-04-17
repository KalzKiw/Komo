import { useState } from "react";
import OrderSummaryModal from "./OrderSummaryModal";
import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { money } from "../lib/utils";

type Props = {
  onClose: () => void;
  onOrderPlaced?: () => void;
  onShowOrderSummary?: (summary: { items: any[]; total: number; feedback: string }) => void;
};

export default function CartModal({ onClose, onOrderPlaced }: Props) {
  const { cart, updateQty, total, clear } = useCart();
  const { state } = useAuth();
  const { apiFetch } = useApi();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  async function checkout() {
    if (cart.length === 0) return;
    setFeedback("");
    setLoading(true);
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
      setLoading(false);
    }
  }

  function handleCloseSummary() {
    setShowSummary(false);
    setLastOrder(null);
    setFeedback("");
    // Solo cerrar CartModal si el usuario cierra el resumen
    onClose();
  }

  function handleGoToOrders() {
    setShowSummary(false);
    setLastOrder(null);
    setFeedback("");
    if (typeof onShowOrderSummary === "function") {
      // Notifica al padre para cambiar de tab
      onShowOrderSummary({ items: [], total: 0, feedback: "goToOrders" });
    }
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
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
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
                      className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center hover:bg-emerald-200 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 text-emerald-700" />
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
                <p className={`text-sm text-center ${feedback.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>
                  {feedback}
                </p>
              )}
              {role !== "ADMIN" && role !== "STAFF" && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={checkout}
                  className="w-full rounded-2xl bg-emerald-600 py-3.5 text-center font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60"
                >
                  {loading ? "Procesando..." : `Confirmar pedido · ${money(total)}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
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
