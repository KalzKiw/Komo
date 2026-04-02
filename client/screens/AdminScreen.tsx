import { useCallback, useEffect, useRef, useState } from "react";
import { LogOut, RefreshCw, ChevronRight, X, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { money, formatOrderStatus, formatShiftLabel, elapsedFrom, adminProductCategory, statusColor } from "../lib/utils";
import { getDefaultAllergens } from "../lib/allergens";
import AdminFamilyRelationships from "../components/family/AdminFamilyRelationships";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  isOfficialMenu?: boolean;
};

type Student = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isDelegate?: boolean;
};

type KdsItem = {
  name: string;
  quantity: number;
  customizations?: string[];
  kitchenNote?: string;
};

type KdsOrder = {
  id: string;
  status: string;
  shift: string;
  createdAt: string;
  items: KdsItem[];
  studentName?: string;
  total?: number;
  productSummary?: string;
};

type AdminData = {
  students: Student[];
  kds: KdsOrder[];
  products: Product[];
  adminOrders: KdsOrder[];
};

type AdminTab = "FORECAST" | "PRODUCTS" | "KDS" | "ORDERS" | "DELEGATES" | "FAMILIES" | "SETTINGS";

const TABS: Array<{ id: AdminTab; label: string }> = [
  { id: "FORECAST", label: "Previsión" },
  { id: "PRODUCTS", label: "Productos" },
  { id: "KDS", label: "KDS" },
  { id: "ORDERS", label: "Pedidos" },
  { id: "DELEGATES", label: "Delegados" },
  { id: "FAMILIES", label: "Familias" },
  { id: "SETTINGS", label: "Ajustes" },
];

const ADMIN_REFRESH_MS = 8000;

// ─── AdminScreen ──────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const { logout } = useAuth();
  const { apiFetch } = useApi();
  const { showToast } = useToast();

  const [tab, setTab] = useState<AdminTab>("FORECAST");
  const [data, setData] = useState<AdminData>({ students: [], kds: [], products: [], adminOrders: [] });
  const [loading, setLoading] = useState(true);
  const refreshing = useRef(false);

  const loadData = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const [students, kds, products, orders] = await Promise.allSettled([
        apiFetch<{ data: Student[] }>("/api/admin/students"),
        apiFetch<{ data: KdsOrder[] }>("/api/admin/kds"),
        apiFetch<{ data: Product[] }>("/api/admin/products"),
        apiFetch<{ data: KdsOrder[] }>("/api/orders?limit=100"),
      ]);
      setData({
        students: students.status === "fulfilled" ? students.value.data : [],
        kds: kds.status === "fulfilled" ? kds.value.data : [],
        products: products.status === "fulfilled" ? products.value.data : [],
        adminOrders: orders.status === "fulfilled" ? orders.value.data : [],
      });
    } finally {
      refreshing.current = false;
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, ADMIN_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  async function updateOrderStatus(orderId: string, nextStatus: string) {
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo actualizar", "error");
    }
  }

  const tabContent = () => {
    if (loading) {
      return (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        </div>
      );
    }

    switch (tab) {
      case "FORECAST":
        return <ForecastTab kds={data.kds} />;
      case "PRODUCTS":
        return <ProductsTab products={data.products} apiFetch={apiFetch} onRefresh={loadData} showToast={showToast} />;
      case "KDS":
        return <KdsTab orders={data.kds} onStatusChange={updateOrderStatus} />;
      case "ORDERS":
        return <OrdersTab orders={data.adminOrders} onStatusChange={updateOrderStatus} apiFetch={apiFetch} showToast={showToast} />;
      case "DELEGATES":
        return <DelegatesTab students={data.students} apiFetch={apiFetch} onRefresh={loadData} showToast={showToast} />;
      case "FAMILIES":
        return <AdminFamilyRelationships />;
      case "SETTINGS":
        return <SettingsTab apiFetch={apiFetch} showToast={showToast} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* Admin topbar */}
      <div className="shrink-0 bg-emerald-800 px-4 pt-safe-top pb-3">
        <div className="flex items-center justify-between pt-3">
          <div>
            <h1 className="text-base font-bold text-white">Panel de Administración</h1>
            <p className="text-xs text-emerald-300">CafES · Control y Previsión</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="rounded-full p-2 text-emerald-200 hover:bg-emerald-700 active:scale-90 transition-all"
              title="Actualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-full p-2 text-emerald-200 hover:bg-emerald-700 active:scale-90 transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="shrink-0 flex overflow-x-auto bg-white border-b border-slate-200 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">{tabContent()}</div>
    </div>
  );
}

// ─── Forecast Tab ─────────────────────────────────────────────────────────────

function ForecastTab({ kds }: { kds: KdsOrder[] }) {
  const snapshot = buildProductionSnapshot(kds);
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const categoryLabels = ["Bocadillos", "Bebidas", "Snacks", "Fruta", "Menu del día"];

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Date card */}
      <div className="rounded-2xl bg-white p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs text-slate-400">Previsión para</p>
          <p className="font-bold text-slate-900 capitalize">{today}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-700">
          {snapshot.totalUnits} unidades
        </span>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-3 gap-3">
        {categoryLabels.map((label) => (
          <div key={label} className="rounded-2xl bg-white p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-slate-900">{snapshot.totalsByCategory[label] ?? 0}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Production table */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-700">Detalle de Producción</h3>
        </div>
        {snapshot.items.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">Aún no hay pedidos activos.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {snapshot.items.map((item) => (
              <div key={item.name} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.category}</p>
                </div>
                <span className="text-lg font-bold text-slate-900">{item.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function buildProductionSnapshot(kds: KdsOrder[]) {
  const map = new Map<string, { name: string; category: string; quantity: number }>();
  kds.forEach((order) => {
    (order.items ?? []).forEach((item) => {
      const key = item.name ?? "Producto";
      const current = map.get(key) ?? { name: key, category: adminProductCategory(key), quantity: 0 };
      current.quantity += Number(item.quantity ?? 0);
      map.set(key, current);
    });
  });

  const items = Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  const totalsByCategory: Record<string, number> = {};
  items.forEach((item) => {
    totalsByCategory[item.category] = (totalsByCategory[item.category] ?? 0) + item.quantity;
  });
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
  return { items, totalsByCategory, totalUnits };
}

// ─── KDS Tab ──────────────────────────────────────────────────────────────────

function KdsTab({
  orders,
  onStatusChange,
}: {
  orders: KdsOrder[];
  onStatusChange: (id: string, status: string) => void;
}) {
  const active = orders.filter((o) => !["DELIVERED", "COMPLETED", "CANCELLED"].includes(o.status));

  if (active.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
        <span className="text-4xl">👨‍🍳</span>
        <p className="text-sm">Sin pedidos en cocina</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 grid gap-3 sm:grid-cols-2">
      {active.map((order) => (
        <KdsCard key={order.id} order={order} onStatusChange={onStatusChange} />
      ))}
    </div>
  );
}

function KdsCard({
  order,
  onStatusChange,
}: {
  order: KdsOrder;
  onStatusChange: (id: string, status: string) => void;
}) {
  const ticketColor =
    order.status === "READY"
      ? "border-emerald-400 bg-emerald-50"
      : order.status === "IN_PREPARATION"
      ? "border-blue-400 bg-blue-50"
      : "border-amber-300 bg-amber-50";

  return (
    <div className={`rounded-2xl border-2 p-3 ${ticketColor}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-sm text-slate-900">ORD-{order.id.slice(0, 5).toUpperCase()}</p>
          <p className="text-xs text-slate-500">{formatShiftLabel(order.shift)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-slate-500">{elapsedFrom(order.createdAt)}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor(order.status)}`}>
            {formatOrderStatus(order.status)}
          </span>
        </div>
      </div>

      <ul className="space-y-1 mb-3">
        {(order.items ?? []).map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-700 shadow-sm">
              {item.quantity}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800">{item.name}</p>
              {(item.customizations ?? []).length > 0 && (
                <p className="text-[10px] text-slate-400">{item.customizations!.join(", ")}</p>
              )}
              {item.kitchenNote && (
                <p className="text-[10px] text-amber-700">Nota: {item.kitchenNote}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        {order.status === "PENDING" && (
          <>
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "IN_PREPARATION")}
              className="flex-1 rounded-xl bg-blue-600 py-1.5 text-xs font-bold text-white active:scale-95 transition-transform"
            >
              Preparar
            </button>
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "CANCELLED")}
              className="rounded-xl bg-red-100 px-3 py-1.5 text-xs font-bold text-red-600 active:scale-95 transition-transform"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {(order.status === "IN_PREPARATION" || order.status === "READY") && (
          <>
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "DELIVERED")}
              className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-xs font-bold text-white active:scale-95 transition-transform"
            >
              Entregar
            </button>
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "CANCELLED")}
              className="rounded-xl bg-red-100 px-3 py-1.5 text-xs font-bold text-red-600 active:scale-95 transition-transform"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

type OrdersTabProps = {
  orders: KdsOrder[];
  onStatusChange: (id: string, status: string) => void;
  apiFetch: ReturnType<typeof useApi>["apiFetch"];
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
};

function OrdersTab({ orders, onStatusChange, apiFetch, showToast }: OrdersTabProps) {
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<KdsOrder | null>(null);

  const pending = orders.filter((o) => o.status === "PENDING").length;
  const inPrep = orders.filter((o) => o.status === "IN_PREPARATION").length;

  const filtered = orders.filter((order) => {
    const byShift = shiftFilter === "ALL" || order.shift === shiftFilter;
    if (!search.trim()) return byShift;
    const hay = [order.studentName, order.productSummary, order.id, order.shift]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return byShift && hay.includes(search.toLowerCase());
  });

  if (selectedOrder) {
    return (
      <OrderDetailPanel
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        onStatusChange={async (id, status) => {
          await onStatusChange(id, status);
          setSelectedOrder((o) => (o ? { ...o, status } : o));
        }}
      />
    );
  }

  return (
    <div className="px-4 py-4 space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{pending}</p>
          <p className="text-xs text-amber-500">Pendientes</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{inPrep}</p>
          <p className="text-xs text-blue-500">En preparación</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar alumno, producto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
        />
        <select
          value={shiftFilter}
          onChange={(e) => setShiftFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="ALL">Todos los turnos</option>
          <option value="MORNING">Mañana</option>
          <option value="AFTERNOON">Tarde</option>
        </select>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-6">No hay pedidos para este filtro.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const hour = order.createdAt
              ? new Date(order.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
              : "--:--";
            return (
              <div
                key={order.id}
                className="rounded-2xl bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm text-slate-900">{hour} · {formatShiftLabel(order.shift)}</p>
                    <p className="text-xs text-slate-400">{order.studentName ?? "Alumno"}</p>
                    {order.productSummary && (
                      <p className="text-xs text-slate-500 mt-0.5">{order.productSummary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(order.status)}`}>
                      {formatOrderStatus(order.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-slate-700">{money(order.total ?? 0)}</strong>
                  <div className="flex gap-1.5">
                    {order.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onStatusChange(order.id, "IN_PREPARATION")}
                          className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onStatusChange(order.id, "CANCELLED")}
                          className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {(order.status === "IN_PREPARATION" || order.status === "READY") && (
                      <>
                        <button
                          type="button"
                          onClick={() => onStatusChange(order.id, "DELIVERED")}
                          className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onStatusChange(order.id, "CANCELLED")}
                          className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderDetailPanel({
  order,
  onBack,
  onStatusChange,
}: {
  order: KdsOrder;
  onBack: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="px-4 py-4 space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Volver a pedidos
      </button>
      <div className="rounded-2xl bg-white p-4 shadow-sm space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Pedido #{order.id.slice(0, 8).toUpperCase()}</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(order.status)}`}>
            {formatOrderStatus(order.status)}
          </span>
        </div>
        <div className="text-sm text-slate-600 space-y-1">
          <div className="flex justify-between"><span className="text-slate-400">Alumno</span><span>{order.studentName ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Turno</span><span>{formatShiftLabel(order.shift)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Total</span><strong>{money(order.total ?? 0)}</strong></div>
        </div>
      </div>
      {order.items?.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Productos</h4>
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{item.quantity}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                {(item.customizations ?? []).length > 0 && <p className="text-xs text-slate-400">{item.customizations!.join(", ")}</p>}
                {item.kitchenNote && <p className="text-xs text-amber-600">Nota: {item.kitchenNote}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {order.status === "PENDING" && (
          <>
            <button type="button" onClick={() => onStatusChange(order.id, "IN_PREPARATION")} className="w-full rounded-2xl bg-blue-600 py-3 font-bold text-white active:scale-[0.97]">Pasar a preparación</button>
            <button type="button" onClick={() => onStatusChange(order.id, "CANCELLED")} className="w-full rounded-2xl border border-red-200 py-3 font-semibold text-red-500 active:scale-[0.97]">Cancelar pedido</button>
          </>
        )}
        {(order.status === "IN_PREPARATION" || order.status === "READY") && (
          <>
            <button type="button" onClick={() => onStatusChange(order.id, "DELIVERED")} className="w-full rounded-2xl bg-emerald-600 py-3 font-bold text-white active:scale-[0.97]">Marcar como entregado</button>
            <button type="button" onClick={() => onStatusChange(order.id, "CANCELLED")} className="w-full rounded-2xl border border-red-200 py-3 font-semibold text-red-500 active:scale-[0.97]">Cancelar pedido</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

type ProductsTabProps = {
  products: Product[];
  apiFetch: ReturnType<typeof useApi>["apiFetch"];
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
};

function ProductsTab({ products, apiFetch, onRefresh, showToast }: ProductsTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  async function toggleProduct(product: Product) {
    try {
      await apiFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      onRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al actualizar", "error");
    }
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-700">Gestión de productos</h3>
        <button
          type="button"
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white active:scale-95"
        >
          + Añadir
        </button>
      </div>

      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
              <p className="text-xs text-slate-400">{money(p.price)}</p>
            </div>
            <div className="flex items-center gap-2 ml-2 shrink-0">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {p.isActive ? "Activo" : "Inactivo"}
              </span>
              <button
                type="button"
                onClick={() => { setEditing(p); setFormOpen(true); }}
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => toggleProduct(p)}
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
              >
                {p.isActive ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {formOpen && (
        <ProductFormModal
          product={editing}
          apiFetch={apiFetch}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); onRefresh(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function ProductFormModal({
  product,
  apiFetch,
  onClose,
  onSaved,
  showToast,
}: {
  product: Product | null;
  apiFetch: ReturnType<typeof useApi>["apiFetch"];
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setSaving(true);
    try {
      const body = { name: name.trim(), description: description.trim(), price: parseFloat(price) };
      if (product) {
        await apiFetch(`/api/admin/products/${product.id}`, { method: "PATCH", body: JSON.stringify(body) });
        showToast("Producto actualizado");
      } else {
        await apiFetch("/api/admin/products", { method: "POST", body: JSON.stringify({ ...body, isActive: true }) });
        showToast("Producto creado");
      }
      onSaved();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  const allergens = getDefaultAllergens();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 space-y-4 max-h-[80svh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">{product ? "Editar producto" : "Crear producto"}</h2>
          <button type="button" onClick={onClose} className="text-slate-400"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <input
            type="text"
            placeholder="Nombre del producto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
          />
          <input
            type="number"
            placeholder="Precio (€)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.01"
            min="0"
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
          />
          <div>
            <p className="text-xs text-slate-400 mb-2">Alérgenos (informativo)</p>
            <div className="flex flex-wrap gap-2">
              {allergens.map((a) => (
                <span key={a.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{a.name}</span>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-emerald-600 py-3 font-bold text-white disabled:opacity-60 active:scale-[0.97]"
          >
            {saving ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Delegates Tab ────────────────────────────────────────────────────────────

function DelegatesTab({
  students,
  apiFetch,
  onRefresh,
  showToast,
}: {
  students: Student[];
  apiFetch: ReturnType<typeof useApi>["apiFetch"];
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  async function toggleDelegate(student: Student) {
    try {
      await apiFetch(`/api/admin/students/${student.id}/delegate`, {
        method: "PATCH",
        body: JSON.stringify({ isDelegate: !student.isDelegate }),
      });
      onRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al actualizar delegado", "error");
    }
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <h3 className="font-bold text-slate-700">Gestión de Delegados</h3>
      {students.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-6">No hay estudiantes cargados.</p>
      )}
      {students.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{s.fullName}</p>
            <p className="text-xs text-slate-400 truncate">{s.email}</p>
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {s.isDelegate && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Delegado</span>
            )}
            <button
              type="button"
              onClick={() => toggleDelegate(s)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold active:scale-95 ${
                s.isDelegate ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {s.isDelegate ? "Revocar" : "Activar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({
  apiFetch,
  showToast,
}: {
  apiFetch: ReturnType<typeof useApi>["apiFetch"];
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const [morning, setMorning] = useState("09:00");
  const [afternoon, setAfternoon] = useState("13:00");
  const [night, setNight] = useState("20:00");
  const [grace, setGrace] = useState("5");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ morning: { hour: number; minute: number }; afternoon: { hour: number; minute: number }; night: { hour: number; minute: number }; graceMinutes: number }>("/api/admin/settings/schedule")
      .then((s) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        setMorning(`${pad(s.morning.hour)}:${pad(s.morning.minute)}`);
        setAfternoon(`${pad(s.afternoon.hour)}:${pad(s.afternoon.minute)}`);
        setNight(`${pad(s.night.hour)}:${pad(s.night.minute)}`);
        setGrace(String(s.graceMinutes));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [apiFetch]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/api/admin/settings/schedule", {
        method: "PATCH",
        body: JSON.stringify({ morning, afternoon, night, graceMinutes: Number(grace) }),
      });
      showToast("Horarios guardados");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return <div className="flex h-40 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" /></div>;
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-1">Horarios de corte de pedidos</h3>
        <p className="text-xs text-slate-400 mb-4">Los pedidos no se admiten después de la hora de corte + minutos de gracia.</p>
        <form onSubmit={save} className="space-y-3">
          {[
            { label: "Turno mañana", value: morning, onChange: setMorning },
            { label: "Turno tarde", value: afternoon, onChange: setAfternoon },
            { label: "Turno noche", value: night, onChange: setNight },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <label className="text-sm text-slate-600">{row.label}</label>
              <input
                type="time"
                value={row.value}
                onChange={(e) => row.onChange(e.target.value)}
                required
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              />
            </div>
          ))}
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-600">Minutos de gracia</label>
            <input
              type="number"
              value={grace}
              onChange={(e) => setGrace(e.target.value)}
              min="0"
              max="60"
              required
              className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-emerald-600 py-3 font-bold text-white disabled:opacity-60 active:scale-[0.97]"
          >
            {saving ? "Guardando…" : "Guardar horarios"}
          </button>
        </form>
      </div>
    </div>
  );
}


