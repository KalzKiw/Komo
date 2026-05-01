import { useEffect, useState } from "react";
import { ArrowDownCircle, RefreshCw, Eye, ShoppingBag, Coffee, UtensilsCrossed, ArrowLeft, ChevronRight, CreditCard } from "lucide-react";
import type { UserRole } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
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
}

interface Child {
  linkId: string;
  studentId: string;
  studentName: string;
  walletBalance: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function orderToMovement(order: OrderRow) {
  const isRefund = order.creditedToWallet;
  const amount = isRefund ? order.total : -order.total;
  const concept = isRefund
    ? "Devolución (pedido cancelado)"
    : order.shift === "BREAKFAST"
    ? "Desayuno"
    : "Almuerzo";
  const Icon = isRefund ? ArrowDownCircle : order.shift === "BREAKFAST" ? Coffee : UtensilsCrossed;
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
  return `${amount >= 0 ? "+" : ""}${money(Math.abs(amount))}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
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
  const [balance, setBalance] = useState<number | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [bankCardModalOpen, setBankCardModalOpen] = useState(false);
  const [savedCard, setSavedCard] = useState<{ lastFourDigits: string } | null>(null);

  useEffect(() => {
    apiFetch<{ walletBalance: number }>("/api/me")
      .then((r) => setBalance(r.walletBalance))
      .catch(() => setBalance(0))
      .finally(() => setLoadingBalance(false));
    apiFetch<{ data: OrderRow[] }>("/api/me/orders?limit=30")
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [apiFetch]);

  const bal = balance ?? 0;

  async function handleSaveCard(cardData: {
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  }) {
    try {
      // In a real app, you would send this to a secure backend endpoint
      // For now, we'll just save the last 4 digits for display
      const lastFour = cardData.cardNumber.slice(-4);
      setSavedCard({ lastFourDigits: lastFour });
    } catch (error) {
      throw new Error("Error al guardar la tarjeta");
    }
  }

  return (
    <div
      className="h-full overflow-y-auto bg-gray-50 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="relative w-full bg-[#1C9690] px-4 pb-20 pt-10">
        <h1 className="text-center text-lg font-bold text-white">Mi Monedero</h1>
        <p className="mt-0.5 text-center text-xs font-medium text-[#92dbc8]">Curso 2025-2026</p>
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
        <h2 className="mb-3 text-sm font-bold text-slate-700">Últimos movimientos</h2>
        <MovementList orders={orders} loading={loadingOrders} />
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
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [recharging, setRecharging] = useState<string | null>(null);
  const [rechargeAmount] = useState(10);

  useEffect(() => {
    apiFetch<{ data: Child[] }>("/api/family/children")
      .then((r) => setChildren(r.data))
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

      <div className="space-y-3 px-4 py-5">
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
