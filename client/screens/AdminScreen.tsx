import { useCallback, useEffect, useRef, useState } from "react";
import { LogOut, RefreshCw, ChevronRight, X, Check, ArrowRight, ArrowLeft, Search, UserCheck, Maximize2, Minimize2, Printer, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { apiUrl } from "../lib/api";
import { money, formatOrderStatus, formatShiftLabel, elapsedFrom, adminProductCategory, statusColor, formatNonFutureDateTime } from "../lib/utils";
import AdminFamilyRelationships from "../components/family/AdminFamilyRelationships";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  productInfo?: ProductInfoForm | null;
  allergenIds?: string[];
  price: number;
  isActive: boolean;
  isOfficialMenu?: boolean;
};

type ProductInfoForm = {
  ingredientes: string[];
  alergenos: string[];
  trazas: string[];
  informacionNutricional: {
    kcal?: number;
    grasas?: number;
    hidratos?: number;
    azucares?: number;
    proteinas?: number;
    sal?: number;
  };
  conservacion?: string;
  caducidad?: string;
  fuente: string[];
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

function splitKdsCustomizations(customizations: string[] = []) {
  return customizations.reduce(
    (acc, raw) => {
      const value = raw.trim();
      if (!value) return acc;
      if (/^sin\s+/i.test(value)) {
        acc.removed.push(value.replace(/^sin\s+/i, ""));
      } else if (/^\+\s*/.test(value)) {
        acc.extras.push(value.replace(/^\+\s*/, ""));
      } else {
        acc.choices.push(value);
      }
      return acc;
    },
    { removed: [] as string[], extras: [] as string[], choices: [] as string[] }
  );
}

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
  const [kdsFullscreen, setKdsFullscreen] = useState(false);
  const refreshing = useRef(false);
  const shellRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const onFullscreenChange = () => setKdsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  async function enterKdsMode() {
    setTab("KDS");
    setKdsFullscreen(true);
    try {
      await shellRef.current?.requestFullscreen?.();
      await screen.orientation?.lock?.("landscape").catch(() => undefined);
    } catch {
      // Browsers can deny fullscreen/orientation; the KDS layout still adapts.
    }
  }

  async function exitKdsMode() {
    setKdsFullscreen(false);
    await screen.orientation?.unlock?.();
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    }
  }

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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#92dbc8] border-t-[#1C9690]" />
        </div>
      );
    }

    switch (tab) {
      case "FORECAST":
        return <ForecastTab kds={data.kds} />;
      case "PRODUCTS":
        return <ProductsTab products={data.products} apiFetch={apiFetch} onRefresh={loadData} showToast={showToast} />;
      case "KDS":
        return <KdsTab orders={data.kds} onStatusChange={updateOrderStatus} fullscreen={kdsFullscreen} onExitFullscreen={exitKdsMode} />;
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
    <div ref={shellRef} className={`flex h-full flex-col bg-slate-50 ${tab === "KDS" && kdsFullscreen ? "kds-force-landscape" : ""}`}>
      {/* Admin topbar */}
      {!(tab === "KDS" && kdsFullscreen) && <div className="shrink-0 bg-[#2D3748] px-4 pt-safe-top pb-3">
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 items-center rounded-2xl bg-white px-2.5 shadow-sm">
              <img src="/logotipo-transparente.png" alt="KOMO" className="h-8 w-auto" />
            </span>
            <div>
              <h1 className="text-base font-black text-white">Admin Dashboard</h1>
              <p className="text-xs text-[#d9f4ee]">KOMO · Control y Previsión</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="rounded-full p-2 text-[#92dbc8] hover:bg-[#169486] active:scale-90 transition-all"
              title="Actualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-full p-2 text-[#92dbc8] hover:bg-[#169486] active:scale-90 transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>}

      {/* Tab bar */}
      {!(tab === "KDS" && kdsFullscreen) && <div className="shrink-0 flex overflow-x-auto bg-white border-b border-slate-200 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (t.id === "KDS") void enterKdsMode();
              else setTab(t.id);
            }}
            className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? "border-[#1C9690] text-[#169486]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>}

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

  const categoryLabels = ["Bocadillos", "Bebidas", "Snacks", "Fruta", "Productos"];

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Date card */}
      <div className="rounded-2xl bg-white p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs text-slate-400">Previsión para</p>
          <p className="font-bold text-slate-900 capitalize">{today}</p>
        </div>
        <span className="rounded-full bg-[#c6efe7] px-3 py-1.5 text-sm font-bold text-[#169486]">
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
  fullscreen,
  onExitFullscreen,
}: {
  orders: KdsOrder[];
  onStatusChange: (id: string, status: string) => void;
  fullscreen: boolean;
  onExitFullscreen: () => void;
}) {
  const active = orders.filter((o) => !["DELIVERED", "COMPLETED", "CANCELLED"].includes(o.status));
  const columns = [
    { id: "PENDING", title: "Entrada", subtitle: "Pedidos nuevos", tone: "amber" },
    { id: "IN_PREPARATION", title: "Preparando", subtitle: "En cocina", tone: "blue" },
    { id: "READY", title: "Listos", subtitle: "Para entregar", tone: "mint" },
  ];

  if (active.length === 0) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 bg-[#20242c] text-slate-300">
        <Check className="h-10 w-10 text-[#92dbc8]" />
        <p className="text-sm font-bold">Sin pedidos en cocina</p>
        {fullscreen && (
          <button type="button" onClick={onExitFullscreen} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black text-white">
            Salir de KDS
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${fullscreen ? "h-full" : "min-h-full"} bg-[#20242c] p-2 text-white md:overflow-hidden`}>
      <div className="mb-2 flex items-center justify-between gap-3 rounded-lg bg-[#2b3039] px-3 py-1.5 shadow-sm">
        <div className="flex items-center gap-3">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-slate-200" aria-label="Menú KDS">
            <span className="block h-0.5 w-4 bg-current shadow-[0_5px_0_current,0_-5px_0_current]" />
          </button>
          <div>
            <h2 className="text-base font-black leading-tight">KDS Cocina</h2>
            <p className="text-[11px] text-slate-400">Preparar pedidos, no gestionar entregas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-[#92dbc8]">
            {active.length} activos
          </span>
          <button
            type="button"
            onClick={fullscreen ? onExitFullscreen : () => document.documentElement.requestFullscreen?.()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-slate-200 transition hover:bg-white/15"
            aria-label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className={`${fullscreen ? "h-[calc(100%-3.25rem)] grid-cols-3 overflow-hidden" : "md:h-[calc(100vh-12rem)] md:grid-cols-3 md:overflow-hidden"} grid gap-2`}>
        {columns.map((column) => {
          const columnOrders = active.filter((order) => order.status === column.id || (column.id === "PENDING" && !["IN_PREPARATION", "READY"].includes(order.status)));
          return (
            <section key={column.id} className="flex min-h-[220px] flex-col overflow-hidden rounded-xl bg-slate-100 text-slate-900 shadow-sm md:min-h-0">
              <div className={`flex items-center justify-between px-3 py-2 text-white ${
                column.id === "PENDING" ? "bg-amber-500" : column.id === "IN_PREPARATION" ? "bg-blue-600" : "bg-[#1C9690]"
              }`}>
                <div>
                  <h3 className="text-sm font-black">{column.title}</h3>
                  <p className="text-[11px] font-semibold text-white/75">{column.subtitle}</p>
                </div>
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-black text-white">{columnOrders.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
                {columnOrders.length === 0 ? (
                  <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-xs font-semibold text-slate-300">
                    Vacío
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <KdsCard key={order.id} order={order} onStatusChange={onStatusChange} />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
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
      ? "border-[#44b6a1] bg-white"
      : order.status === "IN_PREPARATION"
      ? "border-blue-400 bg-white"
      : "border-amber-300 bg-white";

  return (
    <div className={`overflow-hidden rounded-lg border-2 shadow-sm ${ticketColor}`}>
      <div className={`flex items-start justify-between px-2.5 py-1.5 ${
        order.status === "READY" ? "bg-[#1C9690] text-white" : order.status === "IN_PREPARATION" ? "bg-blue-600 text-white" : "bg-amber-400 text-slate-900"
      }`}>
        <div>
          <p className="font-black text-sm">#{order.id.slice(0, 5).toUpperCase()}</p>
          <p className={`text-xs font-semibold ${order.status === "PENDING" ? "text-slate-800/70" : "text-white/75"}`}>{order.studentName ?? "Alumno"} · {formatShiftLabel(order.shift)}</p>
        </div>
        <div className="text-right">
          <p className={`text-xs font-mono ${order.status === "PENDING" ? "text-slate-800/70" : "text-white/75"}`}>{elapsedFrom(order.createdAt)}</p>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            {formatOrderStatus(order.status)}
          </span>
        </div>
      </div>

      <ul className="space-y-1.5 p-2.5">
        {(order.items ?? []).map((item, i) => {
          const mods = splitKdsCustomizations(item.customizations);
          return (
            <li key={i} className="flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-700">
                {item.quantity}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-800">{item.name}</p>
                {(mods.removed.length > 0 || mods.extras.length > 0 || mods.choices.length > 0) && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {mods.removed.map((value) => (
                      <span key={`sin-${value}`} className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-red-600">
                        Sin {value}
                      </span>
                    ))}
                    {mods.extras.map((value) => (
                      <span key={`extra-${value}`} className="rounded-md bg-[#d9f4ee] px-1.5 py-0.5 text-[10px] font-black uppercase text-[#169486]">
                        + {value}
                      </span>
                    ))}
                    {mods.choices.map((value) => (
                      <span key={`choice-${value}`} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {value}
                      </span>
                    ))}
                  </div>
                )}
                {item.kitchenNote && (
                  <p className="mt-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-black text-amber-700">Nota: {item.kitchenNote}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2 px-2.5 pb-2.5">
        {order.status === "PENDING" && (
          <>
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "IN_PREPARATION")}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-black text-white active:scale-95 transition-transform"
            >
              Preparar
            </button>
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "CANCELLED")}
              className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-600 active:scale-95 transition-transform"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {order.status === "IN_PREPARATION" && (
          <>
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "READY")}
              className="flex-1 rounded-lg bg-[#1C9690] py-2 text-sm font-black text-white active:scale-95 transition-transform"
            >
              Listo
            </button>
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "CANCELLED")}
              className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-600 active:scale-95 transition-transform"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {order.status === "READY" && (
          <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d9f4ee] py-2 text-sm font-black text-[#169486]">
            <Check className="h-4 w-4" />
            Listo para recoger
          </div>
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
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [selectedOrder, setSelectedOrder] = useState<KdsOrder | null>(null);

  const pending = orders.filter((o) => o.status === "PENDING").length;
  const inPrep = orders.filter((o) => o.status === "IN_PREPARATION").length;
  const ready = orders.filter((o) => o.status === "READY").length;
  const done = orders.filter((o) => ["DELIVERED", "COMPLETED"].includes(o.status)).length;

  const filtered = orders.filter((order) => {
    const byShift = shiftFilter === "ALL" || order.shift === shiftFilter;
    const byStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && !["DELIVERED", "COMPLETED", "CANCELLED"].includes(order.status)) ||
      order.status === statusFilter;
    if (!search.trim()) return byShift && byStatus;
    const hay = [order.studentName, order.productSummary, order.id, order.shift]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return byShift && byStatus && hay.includes(search.toLowerCase());
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
    <div className="px-4 py-4 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Pendientes", value: pending, cls: "bg-amber-50 text-amber-700" },
          { label: "Cocina", value: inPrep, cls: "bg-blue-50 text-blue-700" },
          { label: "Listos", value: ready, cls: "bg-[#f0fbf8] text-[#169486]" },
          { label: "Servidos", value: done, cls: "bg-slate-100 text-slate-600" },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl p-3 text-center ${item.cls}`}>
            <p className="text-xl font-black">{item.value}</p>
            <p className="text-[10px] font-bold">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
            <Search className="h-4 w-4 text-slate-300" />
            <input
              type="text"
              placeholder="Buscar alumno, producto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-slate-300"
            />
          </div>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="ALL">Turnos</option>
            <option value="MORNING">Mañana</option>
            <option value="AFTERNOON">Tarde</option>
          </select>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          {[
            ["ACTIVE", "Activos"],
            ["READY", "Listos"],
            ["DELIVERED", "Servidos"],
            ["ALL", "Todos"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black transition ${
                statusFilter === id ? "bg-[#1C9690] text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-6">No hay pedidos para este filtro.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const hour = order.createdAt
              ? formatNonFutureDateTime(order.createdAt, { hour: "2-digit", minute: "2-digit" })
              : "--:--";
            const activeActions = order.status === "PENDING" || order.status === "READY";
            return (
              <div key={order.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => setSelectedOrder(order)} className="min-w-0 flex-1 text-left">
                    <p className="font-black text-sm text-slate-900">{hour} · {order.studentName ?? "Alumno"}</p>
                    <p className="text-xs font-semibold text-slate-400">{formatShiftLabel(order.shift)} · ORD-{order.id.slice(0, 6).toUpperCase()}</p>
                    {order.productSummary && (
                      <p className="text-xs text-slate-500 mt-0.5">{order.productSummary}</p>
                    )}
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
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
                <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
                  <strong className="text-sm text-slate-700">{money(order.total ?? 0)}</strong>
                  {activeActions && <div className="flex gap-1.5">
                    {order.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onStatusChange(order.id, "IN_PREPARATION")}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white"
                        >
                          Preparar
                        </button>
                        <button
                          type="button"
                          onClick={() => onStatusChange(order.id, "CANCELLED")}
                          className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {order.status === "READY" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onStatusChange(order.id, "DELIVERED")}
                          className="rounded-lg bg-[#1C9690] px-3 py-1.5 text-xs font-bold text-white"
                        >
                          Entregar
                        </button>
                        <button
                          type="button"
                          onClick={() => onStatusChange(order.id, "CANCELLED")}
                          className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>}
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
          {order.items.map((item, i) => {
            const mods = splitKdsCustomizations(item.customizations);
            return (
              <div key={i} className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c6efe7] text-xs font-bold text-[#169486]">{item.quantity}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                  {(mods.removed.length > 0 || mods.extras.length > 0 || mods.choices.length > 0) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {mods.removed.map((value) => (
                        <span key={`sin-${value}`} className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-red-600">Sin {value}</span>
                      ))}
                      {mods.extras.map((value) => (
                        <span key={`extra-${value}`} className="rounded-md bg-[#d9f4ee] px-1.5 py-0.5 text-[10px] font-black uppercase text-[#169486]">+ {value}</span>
                      ))}
                      {mods.choices.map((value) => (
                        <span key={`choice-${value}`} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">{value}</span>
                      ))}
                    </div>
                  )}
                  {item.kitchenNote && <p className="mt-1 text-xs text-amber-600">Nota: {item.kitchenNote}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="space-y-2">
        {order.status === "PENDING" && (
          <>
            <button type="button" onClick={() => onStatusChange(order.id, "IN_PREPARATION")} className="w-full rounded-2xl bg-blue-600 py-3 font-bold text-white active:scale-[0.97]">Pasar a preparación</button>
            <button type="button" onClick={() => onStatusChange(order.id, "CANCELLED")} className="w-full rounded-2xl border border-red-200 py-3 font-semibold text-red-500 active:scale-[0.97]">Cancelar pedido</button>
          </>
        )}
        {order.status === "READY" && (
          <>
            <button type="button" onClick={() => onStatusChange(order.id, "DELIVERED")} className="w-full rounded-2xl bg-[#1C9690] py-3 font-bold text-white active:scale-[0.97]">Marcar como entregado</button>
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
          className="rounded-xl bg-[#1C9690] px-4 py-2 text-xs font-bold text-white active:scale-95"
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
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${p.isActive ? "bg-[#c6efe7] text-[#169486]" : "bg-slate-100 text-slate-500"}`}>
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
  const info = product?.productInfo;
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [ingredients, setIngredients] = useState(info?.ingredientes?.join("\n") ?? "");
  const [traces, setTraces] = useState(info?.trazas?.join(", ") ?? "");
  const [conservation, setConservation] = useState(info?.conservacion ?? "consumo inmediato; refrigeracion entre 0 y 4 oC");
  const [expiration, setExpiration] = useState(info?.caducidad ?? "consumir preferentemente antes de 24 horas");
  const [sources, setSources] = useState(info?.fuente?.join("\n") ?? "");
  const [kcal, setKcal] = useState(info?.informacionNutricional?.kcal?.toString() ?? "");
  const [fat, setFat] = useState(info?.informacionNutricional?.grasas?.toString() ?? "");
  const [carbs, setCarbs] = useState(info?.informacionNutricional?.hidratos?.toString() ?? "");
  const [sugars, setSugars] = useState(info?.informacionNutricional?.azucares?.toString() ?? "");
  const [protein, setProtein] = useState(info?.informacionNutricional?.proteinas?.toString() ?? "");
  const [salt, setSalt] = useState(info?.informacionNutricional?.sal?.toString() ?? "");
  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(new Set(product?.allergenIds ?? []));
  const [saving, setSaving] = useState(false);
  const [allergens, setAllergens] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [loadingAllergens, setLoadingAllergens] = useState(true);

  useEffect(() => {
    apiFetch<{ data: Array<{ id: string; code: string; name: string }> }>("/api/allergens")
      .then((res) => setAllergens(res.data ?? []))
      .catch(() => setAllergens([]))
      .finally(() => setLoadingAllergens(false));
  }, [apiFetch]);

  function splitMultiline(value: string): string[] {
    return value
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function splitComma(value: string): string[] {
    return value
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function numeric(value: string): number | undefined {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function toggleAllergen(id: string) {
    setSelectedAllergens((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setSaving(true);
    try {
      const selectedAllergenRows = allergens.filter((allergen) => selectedAllergens.has(allergen.id));
      const productInfo: ProductInfoForm = {
        ingredientes: splitMultiline(ingredients),
        alergenos: selectedAllergenRows.map((allergen) => allergen.name.toLowerCase()),
        trazas: splitComma(traces),
        informacionNutricional: {
          kcal: numeric(kcal),
          grasas: numeric(fat),
          hidratos: numeric(carbs),
          azucares: numeric(sugars),
          proteinas: numeric(protein),
          sal: numeric(salt),
        },
        conservacion: conservation.trim(),
        caducidad: expiration.trim(),
        fuente: splitMultiline(sources),
      };
      const body = {
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || null,
        price: parseFloat(price),
        allergenIds: [...selectedAllergens],
        productInfo,
      };
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
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1]"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1]"
          />
          <div className="space-y-2">
            <input
              type="url"
              placeholder="URL de imagen"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1]"
            />
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Bocadillo", "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80"],
                ["Sándwich", "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80"],
                ["Croissant", "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80"],
                ["Zumo", "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80"],
              ].map(([label, url]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setImageUrl(url)}
                  className="rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-600"
                >
                  {label}
                </button>
              ))}
            </div>
            {imageUrl.trim() && (
              <img src={imageUrl} alt="" className="h-28 w-full rounded-2xl object-cover" />
            )}
          </div>
          <input
            type="number"
            placeholder="Precio (€)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.01"
            min="0"
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1]"
          />
          <div>
            <p className="text-xs text-slate-400 mb-2">Alérgenos del producto ({selectedAllergens.size})</p>
            {loadingAllergens ? (
              <div className="flex justify-center py-4">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#92dbc8] border-t-[#1C9690]" />
              </div>
            ) : allergens.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No hay alérgenos disponibles</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allergens.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAllergen(a.id)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      selectedAllergens.has(a.id)
                        ? "bg-[#d9f4ee] text-[#1C9690]"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ficha del producto</p>
            <textarea
              placeholder="Ingredientes, uno por línea"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1]"
            />
            <input
              type="text"
              placeholder="Trazas separadas por coma"
              value={traces}
              onChange={(e) => setTraces(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1]"
            />
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Kcal", kcal, setKcal],
                ["Grasas g", fat, setFat],
                ["Hidratos g", carbs, setCarbs],
                ["Azúcares g", sugars, setSugars],
                ["Proteínas g", protein, setProtein],
                ["Sal g", salt, setSalt],
              ].map(([label, value, setter]) => (
                <input
                  key={String(label)}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={String(label)}
                  value={value as string}
                  onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1]"
                />
              ))}
            </div>
            <input
              type="text"
              placeholder="Conservación"
              value={conservation}
              onChange={(e) => setConservation(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1]"
            />
            <input
              type="text"
              placeholder="Caducidad"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1]"
            />
            <textarea
              placeholder="Fuentes, una por línea"
              value={sources}
              onChange={(e) => setSources(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1]"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-[#1C9690] py-3 font-bold text-white disabled:opacity-60 active:scale-[0.97]"
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
  const delegates = students.filter((student) => student.isDelegate);
  const regular = students.filter((student) => !student.isDelegate);

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
    <div className="px-4 py-4 space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f0fbf8] text-[#169486]">
            <UserCheck className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-black text-slate-900">Delegados de aula</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Activa alumnos de confianza para que puedan ayudar con recogidas o gestión operativa cuando el centro lo permita.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#f0fbf8] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#169486]">Activos</p>
            <p className="mt-1 font-mono text-2xl font-black text-[#169486]">{delegates.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Disponibles</p>
            <p className="mt-1 font-mono text-2xl font-black text-slate-900">{regular.length}</p>
          </div>
        </div>
      </div>
      {students.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-6">No hay estudiantes cargados.</p>
      )}
      {students.map((s) => (
        <div key={s.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-800 truncate">{s.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{s.email}</p>
            </div>
            {s.isDelegate ? (
              <span className="shrink-0 rounded-full bg-[#c6efe7] px-2.5 py-1 text-[10px] font-bold text-[#169486]">Delegado</span>
            ) : (
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-400">Alumno</span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-50 pt-3">
            <p className="text-xs text-slate-400">
              {s.isDelegate ? "Puede actuar como delegado operativo." : "Sin permisos de delegado."}
            </p>
            <button
              type="button"
              onClick={() => toggleDelegate(s)}
              className={`rounded-xl px-3 py-2 text-xs font-black active:scale-95 ${
                s.isDelegate ? "bg-red-100 text-red-600" : "bg-[#1C9690] text-white"
              }`}
            >
              {s.isDelegate ? "Revocar permisos" : "Hacer delegado"}
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
  const { authHeaders } = useAuth();
  const [morning, setMorning] = useState("09:00");
  const [afternoon, setAfternoon] = useState("15:00");
  const [night, setNight] = useState("18:00");
  const [grace, setGrace] = useState("0");
  const [cutoffDisabled, setCutoffDisabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printingTest, setPrintingTest] = useState(false);
  const [openingPreview, setOpeningPreview] = useState(false);

  useEffect(() => {
    apiFetch<{ morning: { hour: number; minute: number }; afternoon: { hour: number; minute: number }; night: { hour: number; minute: number }; graceMinutes: number; disabled: boolean }>("/api/admin/settings/schedule")
      .then((s) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        setMorning(`${pad(s.morning.hour)}:${pad(s.morning.minute)}`);
        setAfternoon(`${pad(s.afternoon.hour)}:${pad(s.afternoon.minute)}`);
        setNight(`${pad(s.night.hour)}:${pad(s.night.minute)}`);
        setGrace(String(s.graceMinutes));
        setCutoffDisabled(s.disabled);
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
        body: JSON.stringify({ morning, afternoon, night, graceMinutes: Number(grace), disabled: cutoffDisabled }),
      });
      showToast("Horarios guardados");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  async function printTestTicket() {
    setPrintingTest(true);
    try {
      await apiFetch("/api/admin/print-test-ticket", { method: "POST" });
      showToast("Ticket de prueba enviado");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo imprimir el ticket", "error");
    } finally {
      setPrintingTest(false);
    }
  }

  async function openTicketPreview() {
    setOpeningPreview(true);
    try {
      const res = await fetch(apiUrl("/api/admin/print-test-ticket/preview"), {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo abrir el PDF", "error");
    } finally {
      setOpeningPreview(false);
    }
  }

  if (!loaded) {
    return <div className="flex h-40 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-[#92dbc8] border-t-[#1C9690]" /></div>;
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-1">Horarios de corte de pedidos</h3>
        <p className="text-xs text-slate-400 mb-4">Los pedidos se admiten fuera del horario escolar hasta el límite de cada turno.</p>
        <form onSubmit={save} className="space-y-3">
          <label className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-amber-900">Desactivar límites temporalmente</p>
              <p className="text-xs text-amber-700">Úsalo solo para pruebas: permitirá pedidos a cualquier hora.</p>
            </div>
            <input
              type="checkbox"
              checked={cutoffDisabled}
              onChange={(e) => setCutoffDisabled(e.target.checked)}
              className="h-5 w-5 accent-[#1C9690]"
            />
          </label>
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
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#44b6a1]"
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
              className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#44b6a1]"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-[#1C9690] py-3 font-bold text-white disabled:opacity-60 active:scale-[0.97]"
          >
            {saving ? "Guardando…" : "Guardar horarios"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <Printer className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900">Depuración de impresora</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Envía un ticket de prueba a la AVP-TC300 configurada en 192.168.30.10:9100.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={openTicketPreview}
            disabled={openingPreview}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#c6efe7] bg-[#f0fbf8] py-3 text-sm font-black text-[#169486] transition active:scale-[0.97] disabled:opacity-60"
          >
            {openingPreview ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#92dbc8] border-t-[#1C9690]" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Ver PDF
          </button>
          <button
            type="button"
            onClick={printTestTicket}
            disabled={printingTest}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-black text-slate-700 transition active:scale-[0.97] disabled:opacity-60"
          >
            {printingTest ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#1C9690]" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Imprimir prueba
          </button>
        </div>
      </div>
    </div>
  );
}
