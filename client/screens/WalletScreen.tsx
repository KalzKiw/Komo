import { useEffect, useState } from "react";
import { ArrowDownCircle, RefreshCw, Eye, ShoppingBag, Coffee, UtensilsCrossed, ChevronRight, Copy, Check, Plus, BarChart3, WalletCards } from "lucide-react";
import { useAuth, type UserRole } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { formatNonFutureDateTime, money } from "../lib/utils";
import ChildProfileScreen from "./ChildProfileScreen";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderRow {
  id: string;
  shift: string;
  scheduledFor: string;
  status: string;
  total: number;
  creditedToWallet: boolean;
  createdAt: string;
  concept?: string;
}

interface Child {
  linkId: string;
  studentId: string;
  studentName: string;
  walletBalance: number;
}

interface TokenResponse {
  tokenCode: string;
  expiresAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function orderToMovement(order: OrderRow) {
  const isRefund = order.creditedToWallet || order.status === "TOPUP";
  const amount = isRefund ? order.total : -order.total;
  const concept = order.status === "TOPUP"
    ? order.concept ?? "Ingreso de saldo"
    : isRefund
    ? "Devolución (pedido cancelado)"
    : order.shift === "BREAKFAST"
    ? "Desayuno"
    : "Almuerzo";
  const Icon = order.status === "TOPUP" ? ArrowDownCircle : isRefund ? ArrowDownCircle : order.shift === "BREAKFAST" ? Coffee : UtensilsCrossed;
  const date = formatNonFutureDateTime(order.createdAt, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return { id: order.id, Icon, concept, date, amount };
}

function amountColor(amount: number) {
  return amount >= 0 ? "text-[#1C9690]" : "text-red-500";
}

function amountLabel(amount: number) {
  return `${amount >= 0 ? "+" : "-"}${money(Math.abs(amount))}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function movementStats(orders: OrderRow[]) {
  return orders.reduce(
    (acc, order) => {
      const amount = orderToMovement(order).amount;
      if (amount >= 0) acc.income += amount;
      else acc.expenses += Math.abs(amount);
      acc.net += amount;
      acc.count += 1;
      return acc;
    },
    { income: 0, expenses: 0, net: 0, count: 0 }
  );
}

function sortMovements(orders: OrderRow[]) {
  return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function tokenExpiryLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expirado";
  const min = Math.max(1, Math.floor(ms / 60000));
  return `Caduca en ${min} min si no se usa`;
}

function readLocalTopups(storageKey: string): OrderRow[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? "[]") as OrderRow[];
  } catch {
    return [];
  }
}

function writeLocalTopups(storageKey: string, rows: OrderRow[]) {
  localStorage.setItem(storageKey, JSON.stringify(rows.slice(0, 30)));
}

function familyTopupsStorageKey(parentId: string, studentId: string) {
  return `cafes-family-wallet-topups:${parentId}:${studentId}`;
}

function MovementChart({ orders }: { orders: OrderRow[] }) {
  const recent = sortMovements(orders).slice(0, 7).reverse();
  const values = recent.map((order) => orderToMovement(order).amount);
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));

  if (recent.length === 0) return null;

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-700">Actividad reciente</h2>
          <p className="text-xs text-slate-400">Últimos {recent.length} movimientos</p>
        </div>
        <BarChart3 className="h-4 w-4 text-[#1C9690]" />
      </div>
      <div className="flex h-36 items-end gap-2">
        {recent.map((order) => {
          const movement = orderToMovement(order);
          const height = Math.max(8, (Math.abs(movement.amount) / max) * 100);
          const date = formatNonFutureDateTime(order.createdAt, { day: "2-digit", month: "short" });
          return (
            <div key={order.id} className="flex flex-1 flex-col items-center gap-1">
              <span className={`text-[10px] font-bold tabular-nums ${amountColor(movement.amount)}`}>
                {amountLabel(movement.amount)}
              </span>
              <div className="flex h-24 w-full items-end justify-center rounded-xl bg-slate-50 px-1">
                <div
                  className={`w-full rounded-t-lg transition-all ${movement.amount >= 0 ? "bg-[#1C9690]" : "bg-red-500"}`}
                  style={{ height: `${height}%` }}
                  title={amountLabel(movement.amount)}
                />
              </div>
              <span className="text-[9px] font-semibold text-slate-400">{date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnalyticsPanel({ title, orders }: { title: string; orders: OrderRow[] }) {
  const stats = movementStats(orders);
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-700">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
          {stats.count} mov.
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-[#d9f4ee] p-3">
          <p className="text-[10px] font-bold uppercase text-[#1C9690]">Ingresos</p>
          <p className="mt-1 text-sm font-black tabular-nums text-[#1C9690]">+{money(stats.income)}</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-3">
          <p className="text-[10px] font-bold uppercase text-red-500">Gastos</p>
          <p className="mt-1 text-sm font-black tabular-nums text-red-500">-{money(stats.expenses)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase text-slate-500">Neto</p>
          <p className={`mt-1 text-sm font-black tabular-nums ${stats.net >= 0 ? "text-[#1C9690]" : "text-red-500"}`}>
            {stats.net >= 0 ? "+" : "-"}{money(Math.abs(stats.net))}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChildBreakdownChart({
  children,
  childMovements,
}: {
  children: Child[];
  childMovements: Record<string, OrderRow[]>;
}) {
  const rows = children.map((child) => {
    const stats = movementStats(childMovements[child.studentId] ?? []);
    return { child, stats };
  });
  const maxSpent = Math.max(1, ...rows.map((row) => row.stats.expenses));

  if (children.length === 0) return null;

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-700">Gasto por hijo</h2>
          <p className="text-xs text-slate-400">Comparativa individual</p>
        </div>
        <ShoppingBag className="h-4 w-4 text-red-400" />
      </div>
      <div className="space-y-3">
        {rows.map(({ child, stats }) => (
          <div key={child.studentId}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="truncate text-xs font-bold text-slate-700">{child.studentName}</span>
              <span className="text-xs font-black tabular-nums text-red-500">-{money(stats.expenses)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-red-50">
              <div
                className="h-full rounded-full bg-red-400 transition-all"
                style={{ width: `${Math.max(4, (stats.expenses / maxSpent) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BalanceChart({ children }: { children: Child[] }) {
  const maxBalance = Math.max(1, ...children.map((child) => child.walletBalance));
  if (children.length === 0) return null;

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-700">Saldo disponible</h2>
          <p className="text-xs text-slate-400">Monedero actual por hijo</p>
        </div>
        <WalletCards className="h-4 w-4 text-[#1C9690]" />
      </div>
      <div className="flex h-32 items-end gap-3">
        {children.map((child) => {
          const height = Math.max(8, (child.walletBalance / maxBalance) * 100);
          return (
            <div key={child.studentId} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-black tabular-nums text-[#169486]">{money(child.walletBalance)}</span>
              <div className="flex h-24 w-full items-end rounded-xl bg-[#f0fbf8] px-1.5">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-[#1C9690] to-[#44b6a1]"
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="max-w-full truncate text-[10px] font-semibold text-slate-400">{child.studentName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Movement list (shared) ───────────────────────────────────────────────────

function MovementList({ orders, loading }: { orders: OrderRow[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#92dbc8] border-t-#1C9690" />
      </div>
    );
  }
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-10 text-slate-400">
        <ShoppingBag className="h-7 w-7 opacity-40" />
        <p className="text-sm">Sin movimientos aún</p>
      </div>
    );
  }
  const movements = orders.map(orderToMovement);
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      {movements.map((mv, i) => {
        const Icon = mv.Icon;
        const isTopup = mv.amount >= 0;
        return (
          <div
            key={mv.id}
            className={`flex items-center gap-3 px-4 py-3.5 ${
              i < movements.length - 1 ? "border-b border-gray-50" : ""
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isTopup ? "bg-[#c6efe7] text-[#1C9690]" : "bg-slate-100 text-slate-500"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{mv.concept}</p>
              <p className="text-xs text-slate-400">{mv.date}</p>
            </div>
            <span className={`shrink-0 text-sm font-bold tabular-nums ${amountColor(mv.amount)}`}>
              {amountLabel(mv.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Student view ─────────────────────────────────────────────────────────────

function StudentWallet() {
  const { apiFetch } = useApi();
  const { state } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const userId = state.status === "authenticated" ? state.user.id : "anonymous";
  const topupsStorageKey = `cafes-wallet-topups:${userId}`;

  const loadWalletData = async () => {
    setLoadingBalance(true);
    setLoadingOrders(true);
    try {
      const [profile, history] = await Promise.all([
        apiFetch<{ walletBalance: number; paymentCardLast4?: string | null }>("/api/me"),
        apiFetch<{ data: OrderRow[] }>("/api/me/wallet-movements?limit=30"),
      ]);
      setBalance(profile.walletBalance);
      const localTopups = readLocalTopups(topupsStorageKey);
      const backendIds = new Set((history.data ?? []).map((item) => item.id));
      setOrders(sortMovements([...(history.data ?? []), ...localTopups.filter((item) => !backendIds.has(item.id))]));
    } catch {
      setBalance((prev) => prev ?? 0);
      setOrders((prev) => prev ?? []);
    } finally {
      setLoadingBalance(false);
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadWalletData();
    const onWalletChanged = () => {
      loadWalletData();
    };
    window.addEventListener("walletBalanceChanged", onWalletChanged);
    return () => window.removeEventListener("walletBalanceChanged", onWalletChanged);
  }, [apiFetch, topupsStorageKey]);

  const bal = balance ?? 0;

  return (
    <div
      className="h-full overflow-y-auto bg-gray-50 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="relative w-full bg-white px-4 pb-20 pt-10 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <img src="/logotipo-transparente.png" alt="KOMO" className="h-10 w-auto" />
        </div>
      </div>

      <div className="relative z-10 -mt-12 mx-4 rounded-3xl bg-white p-6 shadow-md">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          Saldo disponible
        </p>
        {loadingBalance ? (
          <div className="mx-auto mt-3 h-12 w-28 animate-pulse rounded-xl bg-gray-100" />
        ) : (
          <p className="mt-2 text-center font-mono text-5xl font-bold tabular-nums text-slate-900">
            {money(bal)}
          </p>
        )}
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#44b6a1] to-[#1C9690] transition-all"
            style={{ width: `${Math.min(100, (bal / 20) * 100)}%` }}
          />
        </div>
        <p className="mt-1.5 text-right text-[10px] text-slate-400">de 20.00€ máximos sugeridos</p>
      </div>

      <div className="mt-6 px-4 pb-6">
        <div className="rounded-3xl border border-[#c6efe7] bg-[#f0fbf8] p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">Monedero escolar</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Las recargas y métodos de pago los gestiona tu familia desde su panel parental.
          </p>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-6">
        <AnalyticsPanel title="Resumen" orders={orders} />
        <MovementChart orders={orders} />
        <div>
          <h2 className="mb-3 text-sm font-bold text-slate-700">Movimientos</h2>
          <MovementList orders={orders} loading={loadingOrders} />
        </div>
      </div>
    </div>
  );
}

// ─── Parent view ──────────────────────────────────────────────────────────────

function ParentWallet() {
  const { apiFetch } = useApi();
  const { showToast } = useToast();
  const { state } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [childMovements, setChildMovements] = useState<Record<string, OrderRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [analyticsChildId, setAnalyticsChildId] = useState<string>("ALL");
  const [recharging, setRecharging] = useState<string | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState("10");
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  async function loadFamilyWallet() {
    const parentId = state.status === "authenticated" ? state.user.id : "anonymous";
    setLoading(true);
    try {
      const r = await apiFetch<{ data: Child[] }>("/api/family/children");
      const nextChildren = r.data ?? [];
      setChildren(nextChildren);
      const entries = await Promise.all(
        nextChildren.map(async (child) => {
          try {
            const res = await apiFetch<{ data: OrderRow[] }>(`/api/family/children/${child.studentId}/orders`);
            const backendRows = res.data ?? [];
            const backendIds = new Set(backendRows.map((item) => item.id));
            const localRows = readLocalTopups(familyTopupsStorageKey(parentId, child.studentId))
              .filter((item) => !backendIds.has(item.id));
            return [child.studentId, sortMovements([...backendRows, ...localRows])] as const;
          } catch {
            return [child.studentId, readLocalTopups(familyTopupsStorageKey(parentId, child.studentId))] as const;
          }
        })
      );
      setChildMovements(Object.fromEntries(entries));
    } catch {
      setChildren([]);
      setChildMovements({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFamilyWallet();
  }, [apiFetch]);

  async function handleRecharge(child: Child) {
    const parentId = state.status === "authenticated" ? state.user.id : "anonymous";
    const amount = Number(rechargeAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) return;
    setRecharging(child.studentId);
    try {
      const res = await apiFetch<{ newBalance: number; movementPersisted?: boolean }>("/api/family/topup", {
        method: "POST",
        body: JSON.stringify({ studentId: child.studentId, amount }),
      });
      setChildren((prev) =>
        prev.map((c) =>
          c.studentId === child.studentId ? { ...c, walletBalance: res.newBalance } : c
        )
      );
      if (res.movementPersisted === false) {
        const storageKey = familyTopupsStorageKey(parentId, child.studentId);
        const localTopup: OrderRow = {
          id: `local-family-topup-${Date.now()}`,
          shift: "TOPUP",
          scheduledFor: new Date().toISOString(),
          status: "TOPUP",
          total: amount,
          creditedToWallet: true,
          createdAt: new Date().toISOString(),
          concept: "Ingreso familiar",
        };
        writeLocalTopups(storageKey, [localTopup, ...readLocalTopups(storageKey)]);
      }
      await loadFamilyWallet();
      showToast(`Ingresados ${money(amount)} a ${child.studentName}`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo recargar el monedero", "error");
    } finally {
      setRecharging(null);
    }
  }

  async function generateToken() {
    setGeneratingToken(true);
    try {
      const res = await apiFetch<TokenResponse>("/api/family/token", { method: "POST" });
      setToken(res);
      setCopiedToken(false);
    } finally {
      setGeneratingToken(false);
    }
  }

  function copyToken() {
    if (!token) return;
    navigator.clipboard.writeText(token.tokenCode).catch(() => {});
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2200);
  }

  if (selectedChild) {
    return (
      <ChildProfileScreen
        studentId={selectedChild.studentId}
        studentName={selectedChild.studentName}
        linkId={selectedChild.linkId}
        onBack={() => setSelectedChild(null)}
        onUnlinked={() => {
          setSelectedChild(null);
          loadFamilyWallet();
        }}
      />
    );
  }

  const totalBalance = children.reduce((acc, c) => acc + c.walletBalance, 0);
  const selectedAnalyticsOrders =
    analyticsChildId === "ALL"
      ? children.flatMap((child) => childMovements[child.studentId] ?? [])
      : childMovements[analyticsChildId] ?? [];
  const selectedAnalyticsName =
    analyticsChildId === "ALL"
      ? "Resumen conjunto"
      : `Resumen de ${children.find((child) => child.studentId === analyticsChildId)?.studentName ?? "alumno"}`;
  const hasLinkedChildren = children.length > 0;

  return (
    <div
      className="h-full overflow-y-auto bg-gray-50 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="bg-gradient-to-b from-[#169486] to-[#44b6a1] px-4 pb-20 pt-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white">Control Familiar</h1>
            <p className="mt-0.5 text-xs font-medium text-[#d9f4ee]">
              Pedidos, monedero, alérgenos y gastos de tus hijos
            </p>
          </div>
          <button
            type="button"
            onClick={generateToken}
            disabled={generatingToken}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/20 transition active:scale-[0.97] hover:bg-white/20 disabled:opacity-60"
          >
            {generatingToken ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Plus className="h-3.5 w-3.5" />}
            Añadir hijo
          </button>
        </div>
      </div>

      <div className="relative z-10 -mt-12 mx-4 rounded-3xl bg-white p-6 shadow-md">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          Saldo total hijos
        </p>
        {loading ? (
          <div className="mx-auto mt-3 h-12 w-28 animate-pulse rounded-xl bg-gray-100" />
        ) : (
          <p className="mt-2 text-center font-mono text-5xl font-bold tabular-nums text-slate-900">
            {money(totalBalance)}
          </p>
        )}
      </div>

      <div className="space-y-4 px-4 py-5">
        {token && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="px-4 pb-3 pt-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1C9690]">Vinculación</p>
              <h2 className="mt-1 text-sm font-bold text-slate-900">Código temporal para tus hijos</h2>
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center justify-center rounded-2xl bg-[#d9f4ee] py-5">
                <span className="select-all font-mono text-3xl font-black tracking-[0.18em] text-[#169486]">
                  {token.tokenCode}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">{tokenExpiryLabel(token.expiresAt)}</span>
                <div className="flex gap-2">
                  <button type="button" onClick={copyToken} className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                    {copiedToken ? <Check className="h-3.5 w-3.5 text-[#1C9690]" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedToken ? "Copiado" : "Copiar"}
                  </button>
                  <button type="button" onClick={generateToken} disabled={generatingToken} className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-50">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Nuevo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!hasLinkedChildren && !token && (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-900">Aún no tienes hijos vinculados</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Usa el botón superior para generar un código temporal.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            <button
              type="button"
              onClick={() => setAnalyticsChildId("ALL")}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
                analyticsChildId === "ALL" ? "bg-[#1C9690] text-white" : "bg-white text-slate-500"
              }`}
            >
              Conjunto
            </button>
            {children.map((child) => (
              <button
                key={child.studentId}
                type="button"
                onClick={() => setAnalyticsChildId(child.studentId)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
                  analyticsChildId === child.studentId ? "bg-[#1C9690] text-white" : "bg-white text-slate-500"
                }`}
              >
                {child.studentName}
              </button>
            ))}
          </div>
          <AnalyticsPanel title={selectedAnalyticsName} orders={selectedAnalyticsOrders} />
          <MovementChart orders={selectedAnalyticsOrders} />
          {analyticsChildId === "ALL" && (
            <>
              <ChildBreakdownChart children={children} childMovements={childMovements} />
              <BalanceChart children={children} />
            </>
          )}
        </div>

        <h2 className="text-sm font-bold text-slate-700">Hijos vinculados</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="h-7 w-7 animate-spin rounded-full border-4 border-[#92dbc8] border-t-[#1C9690]" />
          </div>
        ) : children.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
            <span className="text-3xl">👨‍👧‍👦</span>
            <p className="text-sm">Sin hijos vinculados</p>
          </div>
        ) : (
          children.map((child) => (
            <div key={child.studentId} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center gap-3 px-4 pb-3 pt-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d9f4ee] text-sm font-bold text-[#169486]">
                  {initials(child.studentName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{child.studentName}</p>
                  <p className="text-xs text-slate-400">Alumno vinculado</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xl font-bold tabular-nums text-slate-900">
                    {money(child.walletBalance)}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400">saldo actual</p>
                </div>
              </div>

              <div className="px-4 pb-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#44b6a1] to-[#1C9690] transition-all"
                    style={{ width: `${Math.min(100, (child.walletBalance / 20) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[88px_1fr_1fr] gap-2.5 border-t border-gray-50 px-4 py-3">
                <input
                  inputMode="decimal"
                  value={rechargeAmount}
                  onChange={(event) => setRechargeAmount(event.target.value.replace(/[^\d.,]/g, ""))}
                  className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-bold text-slate-700 outline-none focus:border-[#1C9690]"
                  aria-label="Importe de recarga"
                />
                <button
                  type="button"
                  disabled={recharging === child.studentId}
                  onClick={() => handleRecharge(child)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1C9690] py-2.5 text-xs font-bold text-white transition-all hover:bg-[#169486] active:scale-[0.97] disabled:opacity-60"
                >
                  {recharging === child.studentId ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Recargar
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChild(child)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.97]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Administrar
                  <ChevronRight className="h-3 w-3 opacity-50" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function WalletScreen({ role }: { role: UserRole }) {
  if (role === "PARENT") return <ParentWallet />;
  return <StudentWallet />;
}
