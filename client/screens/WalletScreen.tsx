import { useEffect, useState } from "react";
import { ArrowDownCircle, RefreshCw, Eye, ShoppingBag, Coffee, UtensilsCrossed, ArrowLeft, ChevronRight, CreditCard } from "lucide-react";
import { useAuth, type UserRole } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { money } from "../lib/utils";
import BankCardModal from "../components/BankCardModal";

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
  const date = new Date(order.createdAt).toLocaleString("es-ES", {
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

function MovementChart({ orders }: { orders: OrderRow[] }) {
  const recent = sortMovements(orders).slice(0, 7).reverse();
  const values = recent.map((order) => orderToMovement(order).amount);
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));

  if (recent.length === 0) return null;

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-slate-700">Gráfica</h2>
      <div className="flex h-32 items-end gap-2">
        {recent.map((order) => {
          const movement = orderToMovement(order);
          const height = Math.max(8, (Math.abs(movement.amount) / max) * 100);
          return (
            <div key={order.id} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end justify-center rounded-xl bg-slate-50 px-1">
                <div
                  className={`w-full rounded-t-lg ${movement.amount >= 0 ? "bg-[#1C9690]" : "bg-red-500"}`}
                  style={{ height: `${height}%` }}
                  title={amountLabel(movement.amount)}
                />
              </div>
              <span className={`text-[10px] font-bold tabular-nums ${amountColor(movement.amount)}`}>
                {movement.amount >= 0 ? "+" : "-"}
              </span>
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
  const { showToast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [bankCardModalOpen, setBankCardModalOpen] = useState(false);
  const [savedCard, setSavedCard] = useState<{ lastFourDigits: string } | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("10");
  const [toppingUp, setToppingUp] = useState(false);
  const userId = state.status === "authenticated" ? state.user.id : "anonymous";
  const cardStorageKey = `cafes-payment-card-last4:${userId}`;
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
      const localCard = localStorage.getItem(cardStorageKey);
      setSavedCard(profile.paymentCardLast4 || localCard ? { lastFourDigits: profile.paymentCardLast4 ?? localCard! } : null);
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
  const parsedTopUpAmount = Number(topUpAmount.replace(",", "."));
  const canTopUp = Number.isFinite(parsedTopUpAmount) && parsedTopUpAmount > 0 && parsedTopUpAmount <= 200 && !toppingUp;

  function adjustTopUp(delta: number) {
    const current = Number.isFinite(parsedTopUpAmount) ? parsedTopUpAmount : 0;
    setTopUpAmount(String(Math.min(200, Math.max(1, current + delta))));
  }

  async function handleSaveCard(cardData: {
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  }) {
    try {
      const lastFour = cardData.cardNumber.slice(-4);
      try {
        await apiFetch("/api/me", {
          method: "PATCH",
          body: JSON.stringify({ paymentCardLast4: lastFour }),
        });
      } catch {
        localStorage.setItem(cardStorageKey, lastFour);
      }
      setSavedCard({ lastFourDigits: lastFour });
      window.dispatchEvent(new Event("profileChanged"));
    } catch (error) {
      throw new Error("Error al guardar la tarjeta");
    }
  }

  async function handleTopUp() {
    if (!canTopUp) return;
    const amount = Math.round(parsedTopUpAmount * 100) / 100;
    setToppingUp(true);
    try {
      const result = await apiFetch<{ walletBalance: number; amount: number }>("/api/me/wallet/topup", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      setBalance(result.walletBalance);
      showToast(`Has ingresado ${money(result.amount)} al monedero`, "success");
      const localTopup: OrderRow = {
        id: `local-topup-${Date.now()}`,
        shift: "TOPUP",
        scheduledFor: new Date().toISOString(),
        status: "TOPUP",
        total: result.amount,
        creditedToWallet: true,
        createdAt: new Date().toISOString(),
        concept: "Ingreso de saldo",
      };
      writeLocalTopups(topupsStorageKey, [localTopup, ...readLocalTopups(topupsStorageKey)]);
      await loadWalletData();
      setOrders((prev) => sortMovements([localTopup, ...prev.filter((item) => item.id !== localTopup.id)]));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "No se pudo recargar el monedero", "error");
    } finally {
      setToppingUp(false);
    }
  }

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
        <h2 className="mb-3 text-sm font-bold text-slate-700">Recargar saldo</h2>
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
            <button
              type="button"
              onClick={() => adjustTopUp(-1)}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 text-xl font-bold text-slate-600"
              aria-label="Reducir importe"
            >
              -
            </button>
            <input
              inputMode="decimal"
              value={topUpAmount}
              onChange={(event) => setTopUpAmount(event.target.value.replace(/[^\d.,]/g, ""))}
              onBlur={() => {
                if (!Number.isFinite(parsedTopUpAmount) || parsedTopUpAmount <= 0) setTopUpAmount("1");
                else setTopUpAmount(String(Math.round(parsedTopUpAmount * 100) / 100));
              }}
              className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-center text-xl font-bold tabular-nums text-slate-900 outline-none focus:border-[#1C9690] focus:bg-white"
            />
            <button
              type="button"
              onClick={() => adjustTopUp(1)}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 text-xl font-bold text-slate-600"
              aria-label="Aumentar importe"
            >
              +
            </button>
          </div>
          <button
            type="button"
            disabled={!canTopUp}
            onClick={handleTopUp}
            className="rounded-2xl bg-[#1C9690] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#169486] disabled:opacity-50"
          >
            {toppingUp ? "Ingresando…" : "Ingresar saldo"}
          </button>
          <p className="text-xs text-slate-400">El saldo se guarda en tu cuenta y el movimiento queda registrado aquí.</p>
        </div>
      </div>

      <div className="px-4 pb-6">
        <h2 className="mb-3 text-sm font-bold text-slate-700">Métodos de pago</h2>
        <button
          type="button"
          onClick={() => setBankCardModalOpen(true)}
          className="w-full flex items-center gap-3 rounded-2xl bg-white shadow-sm px-4 py-4 text-left transition hover:bg-slate-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">Tarjeta de banco</p>
            <p className="text-xs text-slate-500">
              {savedCard ? `Tarjeta ****${savedCard.lastFourDigits}` : "Agregar tarjeta"}
            </p>
          </div>
          <span className="text-slate-400 text-sm">
            {savedCard ? "Cambiar" : "Agregar"}
          </span>
        </button>
      </div>

      <div className="space-y-4 px-4 pb-6">
        <AnalyticsPanel title="Resumen" orders={orders} />
        <MovementChart orders={orders} />
        <div>
          <h2 className="mb-3 text-sm font-bold text-slate-700">Movimientos</h2>
          <MovementList orders={orders} loading={loadingOrders} />
        </div>
      </div>

      <BankCardModal
        open={bankCardModalOpen}
        onClose={() => setBankCardModalOpen(false)}
        onSave={handleSaveCard}
      />
    </div>
  );
}

// ─── Parent view ──────────────────────────────────────────────────────────────

function ChildOrders({
  child,
  onBack,
}: {
  child: Child;
  onBack: () => void;
}) {
  const { apiFetch } = useApi();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: OrderRow[] }>(`/api/family/children/${child.studentId}/orders`)
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [apiFetch, child.studentId]);

  return (
    <div
      className="h-full overflow-y-auto bg-gray-50 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
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
        <div>
          <p className="font-bold text-slate-900">{child.studentName}</p>
          <p className="text-xs text-slate-400">Saldo: {money(child.walletBalance)}</p>
        </div>
      </div>

      <div className="px-4 py-5">
        <h2 className="mb-3 text-sm font-bold text-slate-700">Últimos movimientos</h2>
        <MovementList orders={orders} loading={loading} />
      </div>
    </div>
  );
}

function ParentWallet() {
  const { apiFetch } = useApi();
  const [children, setChildren] = useState<Child[]>([]);
  const [childMovements, setChildMovements] = useState<Record<string, OrderRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [analyticsChildId, setAnalyticsChildId] = useState<string>("ALL");
  const [recharging, setRecharging] = useState<string | null>(null);
  const [rechargeAmount] = useState(10);

  useEffect(() => {
    apiFetch<{ data: Child[] }>("/api/family/children")
      .then(async (r) => {
        const nextChildren = r.data ?? [];
        setChildren(nextChildren);
        const entries = await Promise.all(
          nextChildren.map(async (child) => {
            try {
              const res = await apiFetch<{ data: OrderRow[] }>(`/api/family/children/${child.studentId}/orders`);
              return [child.studentId, res.data ?? []] as const;
            } catch {
              return [child.studentId, []] as const;
            }
          })
        );
        setChildMovements(Object.fromEntries(entries));
      })
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  async function handleRecharge(child: Child) {
    setRecharging(child.studentId);
    try {
      const res = await apiFetch<{ newBalance: number }>("/api/family/topup", {
        method: "POST",
        body: JSON.stringify({ studentId: child.studentId, amount: rechargeAmount }),
      });
      setChildren((prev) =>
        prev.map((c) =>
          c.studentId === child.studentId ? { ...c, walletBalance: res.newBalance } : c
        )
      );
      setChildMovements((prev) => ({
        ...prev,
        [child.studentId]: [
          {
            id: `family-topup-${Date.now()}`,
            shift: "TOPUP",
            scheduledFor: new Date().toISOString(),
            status: "TOPUP",
            total: rechargeAmount,
            creditedToWallet: true,
            createdAt: new Date().toISOString(),
          },
          ...(prev[child.studentId] ?? []),
        ],
      }));
    } catch {
      // silent – balance stays unchanged
    } finally {
      setRecharging(null);
    }
  }

  if (selectedChild) {
    return (
      <ChildOrders
        child={selectedChild}
        onBack={() => setSelectedChild(null)}
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

  return (
    <div
      className="h-full overflow-y-auto bg-gray-50 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="bg-gradient-to-b from-violet-700 to-violet-500 px-4 pb-20 pt-10">
        <h1 className="text-center text-lg font-bold text-white">Control Familiar</h1>
        <p className="mt-0.5 text-center text-xs font-medium text-violet-200">
          Gestiona el saldo de tus hijos
        </p>
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
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            <button
              type="button"
              onClick={() => setAnalyticsChildId("ALL")}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
                analyticsChildId === "ALL" ? "bg-violet-600 text-white" : "bg-white text-slate-500"
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
                  analyticsChildId === child.studentId ? "bg-violet-600 text-white" : "bg-white text-slate-500"
                }`}
              >
                {child.studentName}
              </button>
            ))}
          </div>
          <AnalyticsPanel title={selectedAnalyticsName} orders={selectedAnalyticsOrders} />
          <MovementChart orders={selectedAnalyticsOrders} />
        </div>

        <h2 className="text-sm font-bold text-slate-700">Hijos vinculados</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="h-7 w-7 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
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
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
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
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-600 transition-all"
                    style={{ width: `${Math.min(100, (child.walletBalance / 20) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2.5 border-t border-gray-50 px-4 py-3">
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
                  Recargar +{rechargeAmount}€
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChild(child)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.97]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver movimientos
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
