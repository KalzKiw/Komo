import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, XCircle } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { money, formatOrderStatus, formatShiftLabel, statusColor } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderSummary = {
  id: string;
  status: string;
  shift: string;
  total: number;
  createdAt: string;
  productSummary?: string;
  studentName?: string;
};

type OrderItem = {
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  lineTotal?: number;
  price?: number;
  customizations?: string[];
  kitchenNote?: string;
};

type OrderDetail = OrderSummary & {
  items: OrderItem[];
  scheduledFor?: string;
};

type Filter = "ALL" | "IN_PROGRESS" | "DONE" | "CANCELLED";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "ALL", label: "Todos" },
  { id: "IN_PROGRESS", label: "En curso" },
  { id: "DONE", label: "Completados" },
  { id: "CANCELLED", label: "Cancelados" },
];

function isCancellable(status: string) {
  return ["PENDING", "IN_PREPARATION"].includes(status);
}

function applyFilter(orders: OrderSummary[], filter: Filter): OrderSummary[] {
  if (filter === "ALL") return orders;
  if (filter === "IN_PROGRESS") return orders.filter((o) => ["PENDING", "IN_PREPARATION"].includes(o.status));
  if (filter === "DONE") return orders.filter((o) => ["READY", "DELIVERED", "COMPLETED"].includes(o.status));
  if (filter === "CANCELLED") return orders.filter((o) => o.status === "CANCELLED");
  return orders;
}

// ─── Orders Screen ────────────────────────────────────────────────────────────

export default function OrdersScreen() {
  const { apiFetch } = useApi();
  const { addWithSignature } = useCart();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");

  // Detail view
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const refreshRef = useRef<() => void>(() => {});

  async function loadOrders() {
    try {
      const res = await apiFetch<{ data: OrderSummary[] }>("/api/me/orders?limit=50");
      setOrders(res.data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al cargar pedidos", "error");
    } finally {
      setLoading(false);
    }
  }

  refreshRef.current = loadOrders;

  useEffect(() => {
    loadOrders();
  }, [apiFetch]);

  async function openDetail(orderId: string) {
    setDetailLoading(true);
    try {
      const d = await apiFetch<OrderDetail>(`/api/orders/${orderId}`);
      setDetail(d);
    } catch {
      const summary = orders.find((o) => o.id === orderId);
      if (summary) setDetail({ ...summary, items: [] });
    } finally {
      setDetailLoading(false);
    }
  }

  async function cancelOrder(orderId: string) {
    // optimistic
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
    );
    if (detail?.id === orderId) setDetail((d) => d ? { ...d, status: "CANCELLED" } : d);

    try {
      await apiFetch(`/api/orders/${orderId}/cancel`, { method: "PATCH" });
    } catch {
      // revert silently — reload
      await loadOrders();
    }
  }

  async function repeatOrder(orderId: string) {
    try {
      const d = await apiFetch<OrderDetail>(`/api/orders/${orderId}`);
      (d.items ?? []).forEach((item) => {
        const sig = `${item.productId ?? item.name}::${(item.customizations ?? []).join("|")}::${item.kitchenNote ?? ""}`;
        addWithSignature({
          id: item.productId ?? item.name,
          signature: sig,
          name: item.name,
          price: item.price ?? (item.lineTotal ? item.lineTotal / (item.quantity || 1) : 0),
          qty: item.quantity,
          options: item.customizations ?? [],
          note: item.kitchenNote ?? "",
        });
      });
      showToast("Pedido añadido al carrito");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo repetir el pedido", "error");
    }
  }

  const filtered = applyFilter(orders, filter);
  const inProgress = orders.filter((o) => ["PENDING", "IN_PREPARATION"].includes(o.status)).length;

  // ── Detail view ────────────────────────────────────────────────────────────
  if (detail) {
    const d = new Date(detail.createdAt);
    const datePart = d.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
    const timePart = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const formattedDate = `${datePart}, ${timePart}`;
    const cancellable = isCancellable(detail.status);

    return (
      <div
        className="flex h-full flex-col bg-gray-50 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="shrink-0 bg-white px-4 pt-5 pb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDetail(null)}
              aria-label="Volver"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-slate-500 transition-all active:scale-90 hover:bg-gray-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold leading-tight text-slate-900">
                {formatOrderStatus(detail.status)}
              </h1>
              <p className="mt-0.5 text-sm text-slate-400">{formattedDate}</p>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", paddingBottom: cancellable ? "8.5rem" : "5.5rem" }}
        >
          {/* Single ticket card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

            {/* Products section */}
            <div className="space-y-4 px-4 pb-4 pt-4">
              {detail.items.length === 0 && (
                <p className="py-2 text-center text-sm text-slate-400">Sin detalle de productos</p>
              )}
              {detail.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    {item.quantity}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug text-slate-800">{item.name}</p>
                    {(item.customizations ?? []).length > 0 && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.customizations!.join(", ")}
                      </p>
                    )}
                    {item.kitchenNote && (
                      <p className="mt-0.5 text-xs text-amber-500">📝 {item.kitchenNote}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-700">
                    {money(item.lineTotal ?? item.price ?? 0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Dashed divider */}
            <div className="mx-4 border-t border-dashed border-gray-200" />

            {/* Summary rows */}
            <div className="space-y-2 px-4 pb-4 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Turno</span>
                <span className="font-medium text-slate-700">{formatShiftLabel(detail.shift)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-400">Total</span>
                <span className="text-lg font-bold text-slate-900">{money(detail.total)}</span>
              </div>
            </div>

            {/* Solid divider */}
            <div className="mx-4 border-t border-gray-100" />

            {/* Order ID */}
            <div className="px-4 py-3">
              <p className="select-all text-sm text-gray-400">
                ID del pedido: #{detail.id.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* ── Sticky footer ─────────────────────────────────────────── */}
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-white px-4 pb-3 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,0.07)]">
          <button
            type="button"
            onClick={() => repeatOrder(detail.id)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.97]"
          >
            <RotateCcw className="h-4 w-4" />
            Repetir pedido
          </button>
          {cancellable && (
            <button
              type="button"
              onClick={() => cancelOrder(detail.id)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 py-3 font-semibold text-red-500 transition-all active:scale-[0.97]"
            >
              <XCircle className="h-4 w-4" />
              Cancelar pedido
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="shrink-0 bg-white px-4 pt-5 pb-3 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-slate-900">Mis pedidos</h1>
          {inProgress > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {inProgress} en curso
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-3">{orders.length} pedidos en total</p>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-2 text-center text-slate-400">
            <span className="text-4xl">📋</span>
            <p className="text-sm font-semibold">Sin pedidos en este filtro</p>
          </div>
        )}

        {!loading &&
          filtered.map((order) => {
            const date = new Date(order.createdAt).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
            });
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => {
                  if (!detailLoading) openDetail(order.id);
                }}
                className="w-full flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm text-left active:scale-[0.98] transition-transform"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatShiftLabel(order.shift)} · {date}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-2 shrink-0">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(order.status)}`}>
                    {formatOrderStatus(order.status)}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{money(order.total)}</p>
                    <p className="text-xs text-slate-400">›</p>
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
