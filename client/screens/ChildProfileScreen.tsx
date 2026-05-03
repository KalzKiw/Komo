import { useEffect, useState } from "react";
import { ArrowLeft, Wallet, ShoppingBag, Coffee, UtensilsCrossed, ArrowDownCircle, AlertTriangle, GraduationCap, CheckCircle, Link2Off } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { money } from "../lib/utils";
import { allergenVisual } from "../lib/allergens";
import AllergenPickerScreen from "./AllergenPickerScreen";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildProfile {
  id: string;
  fullName: string;
  email: string;
  walletBalance: number;
  courseName: string | null;
  isBeneficiary: boolean;
  allergens: Array<{ id: string; code: string; name: string }>;
}

interface OrderRow {
  id: string;
  shift: string;
  scheduledFor: string;
  status: string;
  total: number;
  creditedToWallet: boolean;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING:        "Pendiente",
  IN_PREPARATION: "En cocina",
  READY:          "Listo",
  DELIVERED:      "Entregado",
  CANCELLED:      "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:        "bg-amber-100 text-amber-700",
  IN_PREPARATION: "bg-blue-100 text-blue-700",
  READY:          "bg-[#c6efe7] text-[#169486]",
  DELIVERED:      "bg-gray-100 text-slate-500",
  CANCELLED:      "bg-red-100 text-red-600",
};

function orderIcon(shift: string, creditedToWallet: boolean) {
  if (creditedToWallet) return ArrowDownCircle;
  return shift === "BREAKFAST" ? Coffee : UtensilsCrossed;
}

function orderConcept(shift: string, creditedToWallet: boolean) {
  if (creditedToWallet) return "Devolución al monedero";
  return shift === "BREAKFAST" ? "Desayuno" : "Almuerzo";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  studentId: string;
  studentName: string;
  linkId?: string;
  onBack: () => void;
  onUnlinked?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChildProfileScreen({ studentId, studentName, linkId, onBack, onUnlinked }: Props) {
  const { apiFetch } = useApi();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [allergyModalOpen, setAllergyModalOpen] = useState(false);
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    apiFetch<ChildProfile>(`/api/family/children/${studentId}/profile`)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false));

    apiFetch<{ data: OrderRow[] }>(`/api/family/children/${studentId}/orders`)
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [apiFetch, studentId]);

  function reloadProfile() {
    apiFetch<ChildProfile>(`/api/family/children/${studentId}/profile`)
      .then(setProfile)
      .catch(() => {});
  }

  async function handleUnlinkChild() {
    if (!linkId) return;
    setUnlinking(true);
    try {
      await apiFetch(`/api/family/links/${linkId}`, { method: "DELETE" });
      showToast("Vínculo familiar eliminado", "success");
      setUnlinkModalOpen(false);
      onUnlinked?.();
      if (!onUnlinked) onBack();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo quitar el vínculo", "error");
    } finally {
      setUnlinking(false);
    }
  }

  const activeOrders = orders.filter((o) =>
    ["PENDING", "IN_PREPARATION", "READY"].includes(o.status)
  ).length;
  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const totalSpent = delivered.reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="flex h-full flex-col bg-gray-50">
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
        <h2 className="min-w-0 flex-1 truncate font-bold text-slate-900">{studentName}</h2>
        {linkId && (
          <button
            type="button"
            onClick={() => setUnlinkModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 transition active:scale-95 hover:bg-red-50 hover:text-red-500"
          >
            <Link2Off className="h-3.5 w-3.5" />
            Quitar vínculo
          </button>
        )}
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 py-5 space-y-4 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {/* ── Profile card ──────────────────────────────────────────── */}
        {loadingProfile ? (
          <div className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
        ) : profile ? (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 px-5 pt-5 pb-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg font-black text-violet-700">
                {initials(profile.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{profile.fullName}</p>
                <p className="text-xs text-slate-400">{profile.email}</p>
                {profile.courseName && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                    <GraduationCap className="h-3 w-3" />
                    {profile.courseName}
                  </span>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-gray-50 border-t border-gray-50">
              <div className="flex flex-col items-center py-3">
                <Wallet className="h-4 w-4 text-[#2da38f]" />
                <p className="mt-1 font-mono text-base font-black tabular-nums text-slate-900">
                  {money(profile.walletBalance)}
                </p>
                <p className="text-[10px] text-slate-400">Saldo</p>
              </div>
              <div className="flex flex-col items-center py-3">
                <ShoppingBag className="h-4 w-4 text-violet-500" />
                <p className="mt-1 font-mono text-base font-black tabular-nums text-slate-900">
                  {money(totalSpent)}
                </p>
                <p className="text-[10px] text-slate-400">Gastado</p>
              </div>
              <div className="flex flex-col items-center py-3">
                <CheckCircle className="h-4 w-4 text-amber-500" />
                <p className="mt-1 font-mono text-base font-black tabular-nums text-slate-900">
                  {orders.length}
                </p>
                <p className="text-[10px] text-slate-400">Pedidos</p>
              </div>
            </div>

            {/* Beneficiary + active orders */}
            {(profile.isBeneficiary || activeOrders > 0) && (
              <div className="flex gap-2 px-4 pb-4 pt-1">
                {profile.isBeneficiary && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#d9f4ee] px-2.5 py-1 text-xs font-semibold text-[#169486]">
                    <CheckCircle className="h-3 w-3" />
                    Beneficiario
                  </span>
                )}
                {activeOrders > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {activeOrders} pedido{activeOrders !== 1 ? "s" : ""} activo{activeOrders !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-white py-8 shadow-sm text-slate-400">
            <p className="text-sm">No se pudo cargar el perfil</p>
          </div>
        )}

        {/* ── Allergens ─────────────────────────────────────────────── */}
        {profile && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-50">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800">Alérgenos</h3>
              <button
                type="button"
                onClick={() => setAllergyModalOpen(true)}
                className="ml-auto rounded-xl bg-[#d9f4ee] px-3 py-1.5 text-xs font-bold text-[#169486] transition active:scale-95"
              >
                Ajustar
              </button>
            </div>
            {profile.allergens.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">Sin alérgenos registrados</p>
            ) : (
              <div className="flex flex-wrap gap-2 px-4 py-3">
                {profile.allergens.map((a) => {
                  const visual = allergenVisual(a.name);
                  return (
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                    >
                      <span>{visual.icon}</span>
                      {a.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Orders ────────────────────────────────────────────────── */}
        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-700">Últimos pedidos</h3>
          {loadingOrders ? (
            <div className="flex justify-center py-6">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-white py-10 shadow-sm text-slate-400">
              <ShoppingBag className="h-7 w-7 opacity-40" />
              <p className="text-sm">Sin pedidos aún</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {orders.map((order, i) => {
                const Icon = orderIcon(order.shift, order.creditedToWallet);
                const concept = orderConcept(order.shift, order.creditedToWallet);
                const isRefund = order.creditedToWallet;
                return (
                  <div
                    key={order.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${
                      i < orders.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isRefund ? "bg-[#c6efe7] text-[#1C9690]" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{concept}</p>
                      <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          isRefund ? "text-[#1C9690]" : "text-red-500"
                        }`}
                      >
                        {isRefund ? "+" : "-"}{money(order.total)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-slate-500"}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AllergenPickerScreen
        open={allergyModalOpen}
        onClose={() => setAllergyModalOpen(false)}
        selectedEndpoint={`/api/family/children/${studentId}/allergies`}
        saveEndpoint={`/api/family/children/${studentId}/allergies`}
        title={`Alérgenos de ${studentName}`}
        subtitle="Esta información la administra la familia"
        onSaved={() => {
          setAllergyModalOpen(false);
          reloadProfile();
        }}
      />

      {unlinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-5 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Link2Off className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-black text-slate-900">Quitar vínculo</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Vas a desvincular a <strong className="text-slate-700">{studentName}</strong> de tu cuenta familiar.
              Dejarás de poder recargar su monedero, ver sus pedidos y administrar sus alérgenos.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUnlinkModalOpen(false)}
                disabled={unlinking}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition active:scale-[0.98] disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUnlinkChild}
                disabled={unlinking}
                className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {unlinking ? "Quitando..." : "Quitar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
