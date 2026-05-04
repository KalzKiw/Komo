import { useEffect, useState } from "react";
import { ArrowDownCircle, RefreshCw, Settings, ShoppingBag, Coffee, UtensilsCrossed, Copy, Check, Plus, BarChart3, WalletCards } from "lucide-react";
import { type UserRole } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { formatNonFutureDateTime, money } from "../lib/utils";
import ChildProfileScreen from "./ChildProfileScreen";
import StripeTopUpModal from "../components/StripeTopUpModal";

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

type ParentWalletView = "children" | "stats";

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

function StatsOverview({
  title,
  orders,
  childrenCount,
}: {
  title: string;
  orders: OrderRow[];
  childrenCount: number;
}) {
  const stats = movementStats(orders);
  const averageExpense = childrenCount > 0 ? stats.expenses / childrenCount : 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black text-slate-900">{title}</h2>
          <p className="text-xs text-slate-400">{stats.count} movimientos</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Neto</p>
          <p className={`font-mono text-base font-black tabular-nums ${stats.net >= 0 ? "text-[#169486]" : "text-red-500"}`}>
            {stats.net >= 0 ? "+" : "-"}{money(Math.abs(stats.net))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#f0fbf8] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#169486]">Ingresos</p>
          <p className="mt-1 font-mono text-sm font-black tabular-nums text-[#169486]">+{money(stats.income)}</p>
        </div>
        <div className="rounded-xl bg-red-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">Gastos</p>
          <p className="mt-1 font-mono text-sm font-black tabular-nums text-red-500">-{money(stats.expenses)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Promedio</p>
          <p className="mt-1 font-mono text-sm font-black tabular-nums text-slate-800">{money(averageExpense)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Hijos</p>
          <p className="mt-1 font-mono text-sm font-black tabular-nums text-slate-800">{childrenCount}</p>
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
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#92dbc8] border-t-[#1C9690]" />
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
  const [balance, setBalance] = useState<number | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const loadWalletData = async () => {
    setLoadingBalance(true);
    setLoadingOrders(true);
    try {
      const [profile, history] = await Promise.all([
        apiFetch<{ walletBalance: number; paymentCardLast4?: string | null }>("/api/me"),
        apiFetch<{ data: OrderRow[] }>("/api/me/wallet-movements?limit=30"),
      ]);
      setBalance(profile.walletBalance);
      setOrders(sortMovements(history.data ?? []));
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
  }, [apiFetch]);

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

function ParentWallet({ view }: { view: ParentWalletView }) {
  const { apiFetch } = useApi();
  const { showToast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [childMovements, setChildMovements] = useState<Record<string, OrderRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [analyticsChildId, setAnalyticsChildId] = useState<string>("ALL");
  const [paymentTopUp, setPaymentTopUp] = useState<{ child: Child; amount: number } | null>(null);
  const [confirmTopUp, setConfirmTopUp] = useState<{ child: Child; amount: number } | null>(null);
  const [customTopUp, setCustomTopUp] = useState<{ child: Child; value: string; error: string | null } | null>(null);
  const [savedCardLast4, setSavedCardLast4] = useState<string | null>(null);
  const [chargingSavedCard, setChargingSavedCard] = useState<string | null>(null);
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  async function loadFamilyWallet() {
    setLoading(true);
    try {
      const [r, profile] = await Promise.all([
        apiFetch<{ data: Child[] }>("/api/family/children"),
        apiFetch<{ paymentCardLast4?: string | null }>("/api/me"),
      ]);
      setSavedCardLast4(profile.paymentCardLast4 ?? null);
      const nextChildren = r.data ?? [];
      setChildren(nextChildren);
      const entries = await Promise.all(
        nextChildren.map(async (child) => {
          try {
            const res = await apiFetch<{ data: OrderRow[] }>(`/api/family/children/${child.studentId}/orders`);
            return [child.studentId, sortMovements(res.data ?? [])] as const;
          } catch {
            return [child.studentId, []] as const;
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

  function requestRecharge(child: Child, amount: number) {
    if (!Number.isFinite(amount) || amount <= 0 || amount > 200) {
      showToast("Introduce un importe entre 0.01€ y 200€", "error");
      return;
    }

    setConfirmTopUp({ child, amount });
  }

  async function handleRecharge(child: Child, amount: number) {
    if (savedCardLast4) {
      setChargingSavedCard(`${child.studentId}:${amount}`);
      try {
        const result = await apiFetch<{ newBalance: number; amount: number; lastFourDigits: string }>(
          "/api/payments/family/topup-saved-card",
          {
            method: "POST",
            body: JSON.stringify({ studentId: child.studentId, amount }),
          }
        );
        setSavedCardLast4(result.lastFourDigits);
        setChildren((prev) =>
          prev.map((c) =>
            c.studentId === child.studentId ? { ...c, walletBalance: result.newBalance } : c
          )
        );
        await loadFamilyWallet();
        showToast(`Ingresados ${money(result.amount)} a ${child.studentName}`, "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "No se pudo recargar con la tarjeta guardada", "error");
      } finally {
        setChargingSavedCard(null);
      }
      return;
    }

    setPaymentTopUp({ child, amount });
  }

  async function handleCustomRecharge() {
    if (!customTopUp) return;

    const amount = Number(customTopUp.value.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 200) {
      setCustomTopUp((prev) =>
        prev ? { ...prev, error: "Introduce un importe entre 0.01€ y 200€" } : prev
      );
      return;
    }

    const child = customTopUp.child;
    setCustomTopUp(null);
    requestRecharge(child, amount);
  }

  async function handleStripePaid(result: { newBalance: number; amount: number }) {
    const child = paymentTopUp?.child;
    if (!child) return;
    setPaymentTopUp(null);
    setChildren((prev) =>
      prev.map((c) =>
        c.studentId === child.studentId ? { ...c, walletBalance: result.newBalance } : c
      )
    );
    await loadFamilyWallet();
    showToast(`Ingresados ${money(result.amount)} a ${child.studentName}`, "success");
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

  async function openTokenModal() {
    setTokenModalOpen(true);
    if (!token) await generateToken();
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
      <header className="sticky top-0 z-30 bg-white px-4 pb-3 pt-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <img src="/logotipo-transparente.png" alt="KOMO" className="h-10 w-auto" />
          <span className="rounded-full bg-[#f0fbf8] px-3 py-1 text-xs font-bold text-[#169486]">
            {view === "stats" ? "Estadísticas" : "Hijos"}
          </span>
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="rounded-2xl border border-[#d9f4ee] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Saldo familiar</p>
              {loading ? (
                <div className="mt-2 h-6 w-24 animate-pulse rounded-lg bg-gray-100" />
              ) : (
                <p className="mt-1 font-mono text-xl font-black tabular-nums text-slate-900">{money(totalBalance)}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-xl bg-[#f0fbf8] px-3 py-2 text-xs font-black text-[#169486]">
                {children.length} {children.length === 1 ? "hijo" : "hijos"}
              </span>
              {view === "children" && (
                <button
                  type="button"
                  onClick={openTokenModal}
                  disabled={generatingToken}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1C9690] text-white shadow-sm transition active:scale-[0.97] hover:bg-[#169486] disabled:opacity-60"
                  aria-label="Añadir hijo"
                >
                  {generatingToken ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Plus className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {view === "stats" && (
          <div className="order-1 space-y-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
              <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
                <button
                  type="button"
                  onClick={() => setAnalyticsChildId("ALL")}
                  className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                    analyticsChildId === "ALL" ? "bg-[#1C9690] text-white shadow-sm" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  Conjunto
                </button>
                {children.map((child) => (
                  <button
                    key={child.studentId}
                    type="button"
                    onClick={() => setAnalyticsChildId(child.studentId)}
                    className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                      analyticsChildId === child.studentId ? "bg-[#1C9690] text-white shadow-sm" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {child.studentName}
                  </button>
                ))}
              </div>
            </div>

            <StatsOverview
              title={selectedAnalyticsName}
              orders={selectedAnalyticsOrders}
              childrenCount={analyticsChildId === "ALL" ? children.length : 1}
            />

            {selectedAnalyticsOrders.length === 0 ? (
                  <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-700">Sin datos todavía</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Cuando haya pedidos o recargas aparecerán aquí los gráficos.
                </p>
              </div>
            ) : (
              <>
                <MovementChart orders={selectedAnalyticsOrders} />
                {analyticsChildId === "ALL" && (
                  <div className="grid gap-3">
                    <ChildBreakdownChart children={children} childMovements={childMovements} />
                    <BalanceChart children={children} />
                  </div>
                )}
                <div>
                  <h2 className="mb-2 px-1 text-sm font-black text-slate-800">Últimos movimientos</h2>
                  <MovementList orders={selectedAnalyticsOrders.slice(0, 8)} loading={loading} />
                </div>
              </>
            )}
          </div>
        )}

        {view === "children" && !hasLinkedChildren && (
          <div className="order-2 rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-900">Aún no tienes hijos vinculados</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Usa Añadir hijo para generar un código temporal sin salir de esta pantalla.
            </p>
          </div>
        )}

        {view === "children" && (
        <div className="order-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="h-7 w-7 animate-spin rounded-full border-4 border-[#92dbc8] border-t-[#1C9690]" />
            </div>
          ) : children.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-white py-10 text-slate-400 shadow-sm">
              <Plus className="h-8 w-8 opacity-50" />
              <p className="text-sm">Sin hijos vinculados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {children.map((child) => (
                <div key={child.studentId} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d9f4ee] text-xs font-black text-[#169486]">
                      {initials(child.studentName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{child.studentName}</p>
                      <p className="font-mono text-sm font-black tabular-nums text-[#169486]">{money(child.walletBalance)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedChild(child)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-[0.98]"
                      aria-label={`Ver pedidos y gestionar a ${child.studentName}`}
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {[5, 10, 20, 50].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        disabled={chargingSavedCard?.startsWith(`${child.studentId}:`)}
                        onClick={() => requestRecharge(child, amount)}
                        className="flex items-center justify-center gap-1 rounded-xl bg-[#1C9690] px-2 py-2.5 text-sm font-black tabular-nums text-white transition-all hover:bg-[#169486] active:scale-[0.97] disabled:opacity-60"
                        aria-label={`Recargar ${money(amount)} a ${child.studentName}`}
                      >
                        {chargingSavedCard === `${child.studentId}:${amount}` ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        ) : (
                          `${amount}€`
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={chargingSavedCard?.startsWith(`${child.studentId}:`)}
                      onClick={() => setCustomTopUp({ child, value: "", error: null })}
                      className="rounded-xl bg-slate-100 px-2 py-2.5 text-sm font-black text-slate-600 transition-all hover:bg-[#d9f4ee] hover:text-[#169486] active:scale-[0.97] disabled:opacity-60"
                      aria-label={`Recargar una cantidad personalizada a ${child.studentName}`}
                    >
                      Otro
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {view === "children" && tokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1C9690]">Vinculación</p>
                <h2 className="mt-1 text-lg font-black text-slate-900">Vincular nuevo hijo</h2>
              </div>
              <button
                type="button"
                onClick={() => setTokenModalOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Dale este código al alumno para asociarlo a tu cuenta familiar. Caduca si no se usa a tiempo.
            </p>

            <div className="mt-4 rounded-3xl bg-[#d9f4ee] px-4 py-6 text-center">
              {generatingToken && !token ? (
                <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-[#92dbc8] border-t-[#1C9690]" />
              ) : token ? (
                <>
                  <span className="select-all font-mono text-4xl font-black tracking-[0.18em] text-[#169486]">
                    {token.tokenCode}
                  </span>
                  <p className="mt-2 text-xs font-bold text-[#169486]">{tokenExpiryLabel(token.expiresAt)}</p>
                </>
              ) : (
                <p className="text-sm font-bold text-[#169486]">No hay código activo</p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={copyToken}
                disabled={!token}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-3 py-3 text-sm font-bold text-slate-600 transition active:scale-[0.97] disabled:opacity-50"
              >
                {copiedToken ? <Check className="h-4 w-4 text-[#1C9690]" /> : <Copy className="h-4 w-4" />}
                {copiedToken ? "Copiado" : "Copiar"}
              </button>
              <button
                type="button"
                onClick={generateToken}
                disabled={generatingToken}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#1C9690] px-3 py-3 text-sm font-bold text-white transition active:scale-[0.97] disabled:opacity-60"
              >
                {generatingToken ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <RefreshCw className="h-4 w-4" />}
                Nuevo
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "children" && customTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1C9690]">Recarga</p>
                <h2 className="mt-1 text-lg font-black text-slate-900">{customTopUp.child.studentName}</h2>
              </div>
              <button
                type="button"
                onClick={() => setCustomTopUp(null)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Importe exacto</span>
              <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-[#1C9690]">
                <input
                  autoFocus
                  inputMode="decimal"
                  value={customTopUp.value}
                  onChange={(event) =>
                    setCustomTopUp((prev) =>
                      prev
                        ? { ...prev, value: event.target.value.replace(/[^\d.,]/g, ""), error: null }
                        : prev
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleCustomRecharge();
                  }}
                  placeholder="3,75"
                  className="min-w-0 flex-1 bg-transparent py-3 text-2xl font-black tabular-nums text-slate-900 outline-none placeholder:text-slate-300"
                  aria-label="Importe personalizado"
                />
                <span className="text-lg font-black text-slate-400">€</span>
              </div>
            </label>

            {customTopUp.error && (
              <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
                {customTopUp.error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleCustomRecharge()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1C9690] py-3 text-sm font-bold text-white transition active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              Recargar importe exacto
            </button>
          </div>
        </div>
      )}

      {view === "children" && confirmTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-black text-slate-900">Confirmar recarga</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Vas a ingresar <strong className="text-slate-800">{money(confirmTopUp.amount)}</strong> en el monedero de{" "}
              <strong className="text-slate-800">{confirmTopUp.child.studentName}</strong>.
              {savedCardLast4 ? ` Se cargará a la tarjeta ****${savedCardLast4}.` : " Se abrirá el pago con tarjeta."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmTopUp(null)}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = confirmTopUp;
                  setConfirmTopUp(null);
                  void handleRecharge(next.child, next.amount);
                }}
                className="rounded-2xl bg-[#1C9690] px-4 py-3 text-sm font-bold text-white transition active:scale-[0.98]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentTopUp && (
        <StripeTopUpModal
          open={Boolean(paymentTopUp)}
          studentId={paymentTopUp.child.studentId}
          studentName={paymentTopUp.child.studentName}
          amount={paymentTopUp.amount}
          onClose={() => setPaymentTopUp(null)}
          onPaid={handleStripePaid}
        />
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function WalletScreen({ role, parentView = "children" }: { role: UserRole; parentView?: ParentWalletView }) {
  if (role === "PARENT") return <ParentWallet view={parentView} />;
  return <StudentWallet />;
}
