import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, XCircle } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { money, formatOrderStatus, formatShiftLabel, statusColor } from "../lib/utils";
import { ChefHat, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Icono de bandeja alternativo (SVG inline)
function TrayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="17" width="18" height="2" rx="1" />
      <path d="M4 17V7a8 8 0 0 1 16 0v10" />
    </svg>
  );
}

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
  { id: "IN_PROGRESS", label: "Pendientes" },
  { id: "DONE", label: "Completados" },
];

function isCancellable(status: string) {
  return ["PENDING", "IN_PREPARATION"].includes(status);
}

function applyFilter(orders: OrderSummary[], filter: Filter): OrderSummary[] {
  if (filter === "IN_PROGRESS") return orders.filter((o) => ["PENDING", "IN_PREPARATION"].includes(o.status));
  if (filter === "DONE") return orders.filter((o) => ["READY", "DELIVERED", "COMPLETED"].includes(o.status));
  return orders;
}

// ─── Orders Screen ────────────────────────────────────────────────────────────

export default function OrdersScreen({ onShowOrderSummary }: { onShowOrderSummary?: (summary: { items: any[]; total: number; feedback: string }) => void }) {
  const { apiFetch } = useApi();
  const { addWithSignature, cart, total } = useCart();
  const { showToast } = useToast();
  const { state: authState } = useAuth();

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
      showToast("Pedido cancelado correctamente", "success");
    } catch (err) {
      // revert silently — reload
      await loadOrders();
      let msg = "No se pudo cancelar el pedido. Intenta de nuevo o contacta soporte.";
      if (err instanceof Error && err.message && !err.message.startsWith("HTTP ")) {
        msg = err.message;
      }
      showToast(msg, "error");
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
      // Abrir resumen del pedido automáticamente
      if (onShowOrderSummary) {
        // Esperar un tick para que el carrito se actualice
        setTimeout(() => {
          onShowOrderSummary({
            items: (d.items ?? []).map((item) => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.price ?? (item.lineTotal ? item.lineTotal / (item.quantity || 1) : 0),
              customizations: item.customizations,
              kitchenNote: item.kitchenNote,
            })),
            total: d.total,
            feedback: "✓ Pedido añadido al carrito",
          });
        }, 0);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo repetir el pedido", "error");
    }
  }

  // Estado para upsell bebida
  const [loadingDrink, setLoadingDrink] = useState<string | null>(null);

  async function onQuickAddDrink(drinkId: string) {
    if (!detail) return;
    setLoadingDrink(drinkId);
    try {
      // PATCH a /api/orders/{orderId}/add-item
      await apiFetch(`/api/orders/${detail.id}/add-item`, {
        method: "PATCH",
        body: JSON.stringify({ item: drinkId }),
        headers: { "Content-Type": "application/json" },
      });
      showToast("Bebida añadida al pedido", "success");
      await loadOrders();
    } catch (e) {
      showToast("No se pudo añadir la bebida", "error");
    } finally {
      setLoadingDrink(null);
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
    const cancellable = isCancellable(detail.status) && detail.status !== "CANCELLED";


    // --- NUEVO DISEÑO DETALLE DE PEDIDO ---
    return (
      <div className="h-full w-full bg-gray-50 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {/* Header visual con botón de volver */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-2 pt-2 pb-1 shadow-sm">
          <div className="flex items-center h-14">
            <button
              type="button"
              onClick={() => setDetail(null)}
              aria-label="Volver"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-slate-500 transition-all active:scale-90 hover:bg-gray-200 shadow"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <span className="flex-1 text-center text-lg font-bold text-slate-800 tracking-wide">Detalle del Pedido</span>
            <span className={`rounded-full px-4 py-1 text-base font-semibold ml-auto ${detail.status === "PENDING" ? "bg-amber-100 text-amber-700" : detail.status === "CANCELLED" ? "bg-rose-100 text-rose-500" : "bg-#c6efe7 text-#169486"}`}>{formatOrderStatus(detail.status)}</span>
          </div>
        </div>
        {/* Header tipo tarjeta grande */}
        <div className="px-2 pt-2 pb-4">
          <div className="rounded-3xl bg-white shadow-lg px-6 py-6 flex flex-col items-center relative">
            {/* Número grande */}
            <span className="text-6xl font-extrabold text-#169486 tracking-widest mt-2 mb-2">{Number((detail as any).pickupNumber) || (100 + (parseInt(detail.id, 36) % 900))}</span>
            {/* Fecha y hora */}
            <span className="text-base text-slate-500 mb-1">{d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}, {d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
            {/* Turno debajo de la fecha */}
            <span className="flex items-center gap-1 text-sm text-slate-500 mb-3">
              <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 7v5l3 2" /></svg> {formatShiftLabel(detail.shift)}
            </span>
            {/* Icono central */}
            <span className="flex items-center justify-center rounded-full bg-#d9f4ee p-3 mb-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="4" fill="#d1fae5" stroke="#059669" />
                <path d="M12 8v4l2 2" stroke="#059669" />
                <circle cx="12" cy="12" r="9.5" stroke="#059669" fill="none" />
              </svg>
            </span>
          </div>
        </div>

        {/* Detalle de productos y totales mejorado */}
        <div className="px-2 pb-2">
          <div className="rounded-2xl bg-white shadow-sm mb-4 px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-lg text-slate-900">Detalle de Productos</span>
              <span className="text-xs text-slate-400 font-semibold">{detail.items.length} ITEM{detail.items.length !== 1 ? 'S' : ''}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {detail.items.length === 0 && (
                <p className="py-2 text-center text-sm text-slate-400">Sin detalle de productos</p>
              )}
              {detail.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-#c6efe7 text-xs font-bold text-#169486">
                    {item.quantity}x
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-base font-bold leading-snug text-#169486">{item.name}</span>
                    {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                    {(item.customizations ?? []).length > 0 && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.customizations!.join(", ")}
                      </p>
                    )}
                    {item.kitchenNote && (
                      <p className="mt-0.5 text-xs text-amber-500">📝 {item.kitchenNote}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-base font-bold text-slate-900">
                    {money(item.lineTotal ?? item.price ?? 0)}
                  </span>
                </div>
              ))}
            </div>
            {/* Totales */}
            <div className="border-t border-dashed border-gray-200 pt-3 mt-2">
              <div className="flex justify-between text-base mb-1">
                <span className="text-slate-500">Total del Pedido</span>
                <span className="font-bold text-#169486">{money(detail.total)}</span>
              </div>
              <span className="text-xs text-slate-400">IVA INCLUIDO</span>
            </div>
          </div>
          {/* Nota de recogida */}
          <div className="text-center text-xs text-slate-400 mt-2 mb-4">
            Muestra este número (<span className="font-bold text-#169486">{Number((detail as any).pickupNumber) || (100 + (parseInt(detail.id, 36) % 900))}</span>) en el mostrador del comedor durante el turno seleccionado para recoger tu pedido.
          </div>
        </div>

        {/* ── Sticky footer ─────────────────────────────────────────── */}
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-white px-4 pb-3 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,0.07)]">
          {/* Solo mostrar 'Repetir pedido' si el pedido está COMPLETADO */}
          {["READY", "DELIVERED", "COMPLETED"].includes(detail.status) && (
            <button
              type="button"
              onClick={() => repeatOrder(detail.id)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-#1C9690 py-3.5 font-bold text-white transition-all hover:bg-#169486 active:scale-[0.97]"
            >
              <RotateCcw className="h-4 w-4" />
              Repetir pedido
            </button>
          )}
          {/* El botón de cancelar pedido solo lo ven ADMIN/STAFF y si es cancelable */}
          {(authState.status === "authenticated" && (authState.user.role === "ADMIN" || authState.user.role === "STAFF") && cancellable) && (
            <button
              type="button"
              onClick={async () => {
                await cancelOrder(detail.id);
                await loadOrders(); // Forzar refresco tras cancelar
              }}
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
                  ? "bg-#1C9690 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        {loading && (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
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
            // Icono SVG según estado
            let icon = null;
            if (order.status === "PENDING") {
              icon = (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e42" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" stroke="#f59e42" fill="#fef3c7" />
                  <path d="M12 7v5l3 2" stroke="#f59e42" />
                </svg>
              );
            } else if (order.status === "CANCELLED") {
              icon = (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" stroke="#ef4444" fill="#fee2e2" />
                  <line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" />
                  <line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" />
                </svg>
              );
            } else {
              icon = (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" stroke="#22c55e" fill="#dcfce7" />
                  <polyline points="9 12 12 15 16 10" stroke="#22c55e" />
                </svg>
              );
            }
            const date = new Date(order.createdAt).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            // Estado visual
            let statusLabel = "";
            let statusColorClass = "";
            if (order.status === "PENDING") {
              statusLabel = "PENDIENTE";
              statusColorClass = "bg-amber-100 text-amber-700";
            } else if (order.status === "CANCELLED") {
              statusLabel = "CANCELADO";
              statusColorClass = "bg-rose-100 text-rose-500";
            } else {
              statusLabel = formatOrderStatus(order.status);
              statusColorClass = "bg-#c6efe7 text-#169486";
            }
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => {
                  if (!detailLoading) openDetail(order.id);
                }}
                className="w-full flex items-center rounded-2xl bg-white px-4 py-3 shadow-sm text-left active:scale-[0.98] transition-transform border border-slate-100"
                style={{ minHeight: 90 }}
              >
                {/* Icono de estado */}
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-slate-50 mr-3">
                  {icon}
                </div>
                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-800 text-base flex items-center gap-1">
                      <span className="text-xs text-slate-400 font-semibold">ID</span>
                      {Number((order as any).pickupNumber) || (100 + (parseInt(order.id, 36) % 900))}
                    </span>
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${statusColorClass}`}>{statusLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{date}</span>
                  </div>
                </div>
                {/* Precio */}
                <div className="flex flex-col items-end ml-2">
                  <span className={`text-lg font-bold ${order.status === "CANCELLED" ? "line-through text-slate-400" : "text-#169486"}`}>{money(order.total)}</span>
                </div>
              </button>
            );
          })}

        {/* Bloque de upsell fijo abajo */}
        {filter === "IN_PROGRESS" && (
          <div className="mt-4 mb-2 rounded-2xl bg-#169486 p-5 text-white shadow-lg flex flex-col items-start">
            <span className="text-xs font-semibold mb-1 opacity-80">¿Olvidaste algo?</span>
            <span className="text-lg font-bold leading-tight mb-3">Pide tu snack ahora<br />y recíbelo en el recreo.</span>
            <button className="rounded-lg bg-white text-#169486 font-bold px-4 py-2 text-sm shadow hover:bg-#d9f4ee transition">Ver Menú</button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- COMPONENTES NUEVOS SOLO PARA PENDIENTE ---

function OrderStepper({ status }: { status: string }) {
  // Solo 3 pasos fijos
  return (
    <div className="flex items-center justify-center gap-6 py-4">
      <div className="flex flex-col items-center">
        <CheckCircle className="h-7 w-7" color="#22c55e" fill="#22c55e" />
        <span className="text-xs mt-1 text-#1C9690 font-bold">Recibido</span>
      </div>
      <div className="h-0.5 w-8 bg-gray-300" />
      <div className="flex flex-col items-center">
        <TrayIcon className="h-7 w-7" />
        <span className="text-xs mt-1 text-gray-400 font-bold">En preparación</span>
      </div>
      <div className="h-0.5 w-8 bg-gray-300" />
      <div className="flex flex-col items-center">
        <TrayIcon className="h-7 w-7" />
        <span className="text-xs mt-1 text-gray-400 font-bold">Listo</span>
      </div>
    </div>
  );
}

function PickupNumber({ pickupNumber }: { pickupNumber: number }) {
  return (
    <div className="flex flex-col items-center py-2">
      <span className="text-sm text-gray-400 font-semibold">Tu nº de recogida es:</span>
      <span className="text-5xl font-extrabold text-slate-900 tracking-widest mt-1" style={{fontSize: '3.5rem', letterSpacing: '0.1em'}}>{pickupNumber}</span>
    </div>
  );
}


// Ejemplo de productos para upsell (puedes reemplazar por fetch dinámico)
const UPSELL_PRODUCTS = [
  { id: "water", label: "Agua", icon: "💧", price: 0.6 },
  { id: "cola", label: "Cola", icon: "🥤", price: 1.2 },
  { id: "juice", label: "Zumo", icon: "🧃", price: 1.0 },
  { id: "brownie", label: "Brownie", icon: "🍫", price: 1.5 },
  { id: "fries", label: "Patatas", icon: "🍟", price: 1.0 },
  { id: "cookie", label: "Cookie", icon: "🍪", price: 0.8 },
];

function UpsellExtras({ onQuickAdd, loading, excludeIds }: { onQuickAdd: (id: string) => void, loading: string | null, excludeIds?: (string | undefined)[] }) {
  // Excluir productos ya añadidos
  const suggestions = UPSELL_PRODUCTS.filter(p => !excludeIds?.includes(p.id));
  if (suggestions.length === 0) return null;
  return (
    <div className="flex flex-col items-start py-2 mb-4">
      <span className="text-base font-semibold text-slate-700 mb-2 ml-1">¿Te olvidaste de algo?</span>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {suggestions.map((d) => (
          <button
            key={d.id}
            disabled={loading === d.id}
            onClick={() => onQuickAdd(d.id)}
            className={`flex flex-col items-center min-w-[90px] rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium bg-white shadow-sm hover:bg-#d9f4ee active:scale-95 transition-all ${loading === d.id ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <span className="text-2xl mb-1">{d.icon}</span>
            <span className="font-semibold text-slate-800 mb-0.5">{d.label}</span>
            <span className="text-#1C9690 font-bold">{d.price.toFixed(2)}€</span>
            <span className="mt-1 text-xs text-#169486">Añadir</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Order Detail Minimal UX ───────────────────────────────────────────────

import React from "react";

interface Order {
  id: string;
  items: OrderItem[];
  totalPrice: number;
  status: "PENDIENTE" | "EN_PREPARACION" | "LISTO";
}

interface OrderDetailProps {
  order: Order;
  onCancel?: () => void;
}

const STATUS_COLORS: Record<Order["status"], string> = {
  PENDIENTE: "text-slate-600 bg-slate-100",
  EN_PREPARACION: "text-amber-700 bg-amber-100",
  LISTO: "text-green-700 bg-green-100",
};

export const OrderDetailMinimal: React.FC<OrderDetailProps> = ({ order, onCancel }) => {
  // Render blocks for each status
  const renderByStatus: Record<Order["status"], React.ReactNode> = {
    PENDIENTE: (
      <>
        <div className="mb-4">
          <h2 className={`text-lg font-bold mb-2 ${STATUS_COLORS[order.status]} px-3 py-1 rounded-full inline-block`}>Pedido pendiente</h2>
          <ul className="divide-y divide-gray-100 bg-white rounded-xl shadow p-4">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between py-2">
                <span className="font-medium text-slate-800">{item.name}</span>
                <span className="text-slate-500">x{item.quantity}</span>
                <span className="font-semibold text-slate-700">{(item.price ?? 0).toFixed(2)}€</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between mt-4 text-base font-bold text-slate-900">
            <span>Total</span>
            <span>{order.totalPrice.toFixed(2)}€</span>
          </div>
        </div>
        <button
          className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-lg shadow hover:bg-red-600 transition disabled:opacity-50"
          onClick={onCancel}
        >
          Cancelar pedido
        </button>
        <div className="mt-10 flex flex-col items-center">
          <span className="text-sm text-slate-400 animate-pulse">Esperando confirmación de cocina...</span>
        </div>
      </>
    ),
    EN_PREPARACION: (
      <>
        <div className="mb-4">
          <h2 className={`text-lg font-bold mb-2 ${STATUS_COLORS[order.status]} px-3 py-1 rounded-full inline-block`}>En preparación</h2>
          <ul className="divide-y divide-gray-100 bg-white rounded-xl shadow p-4 opacity-60">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between py-2">
                <span className="font-medium text-slate-800">{item.name}</span>
                <span className="text-slate-500">x{item.quantity}</span>
                <span className="font-semibold text-slate-700">{(item.price ?? 0).toFixed(2)}€</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between mt-4 text-base font-bold text-slate-900 opacity-60">
            <span>Total</span>
            <span>{order.totalPrice.toFixed(2)}€</span>
          </div>
        </div>
        {/* Botón de cancelar oculto/deshabilitado */}
        <button
          className="w-full py-3 rounded-xl bg-gray-300 text-gray-400 font-bold text-lg shadow cursor-not-allowed"
          disabled
        >
          Cancelar pedido
        </button>
        <div className="mt-10 flex flex-col items-center">
          <span className="text-sm text-amber-500 animate-pulse">Cocina está preparando tu pedido</span>
        </div>
      </>
    ),
    LISTO: (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
        <div className="mb-8" />
        <div className="bg-green-100 rounded-3xl shadow-lg px-8 py-10 flex flex-col items-center">
          <span className="text-lg font-semibold text-green-700 mb-2">¡Tu pedido está listo!</span>
          <span className="text-2xl text-slate-700 mb-4">Tu número de recogida:</span>
          <span className="text-6xl md:text-7xl font-extrabold text-green-600 tracking-widest select-all drop-shadow-lg">
            {order.id}
          </span>
        </div>
      </div>
    ),
  };

  return (
    <section className="w-full max-w-md mx-auto px-4 py-6">
      {renderByStatus[order.status]}
    </section>
  );
};
