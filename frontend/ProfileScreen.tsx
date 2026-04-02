import {
  AlertTriangle,
  Bell,
  ChevronRight,
  CreditCard,
  Link2,
  LogOut,
  Phone,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import type { ReactElement } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileUser = {
  fullName: string;
  initials: string;
  course?: string;
  walletBalanceCents: number;
  phone?: string;
  allergensLabel?: string;
  totalOrders: number;
  activeOrders: number;
  totalSpentCents: number;
};

export type FamilyState =
  | { status: "UNLINKED" }
  | { status: "PENDING"; token: string }
  | { status: "LINKED"; parentName: string; parentWalletCents: number };

type Props = {
  user: ProfileUser;
  family?: FamilyState;
  cutoffLabel?: string;
  cutoffCountdown?: string;
  onEditPhone?: () => void;
  onEditAllergens?: () => void;
  onEditPayment?: () => void;
  onLinkFamily?: () => void;
  onManageFamily?: () => void;
  onNotifications?: () => void;
  onLogout?: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function centsToEur(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Fila de lista estilo iOS Settings */
function SettingsRow({
  icon,
  label,
  value,
  chevron = false,
  onClick,
  danger = false,
}: {
  icon: ReactElement;
  label: string;
  value?: string;
  chevron?: boolean;
  onClick?: () => void;
  danger?: boolean;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={[
        "flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left",
        "last:border-0",
        "transition-colors",
        onClick ? "active:bg-gray-50 cursor-pointer" : "cursor-default",
        danger ? "text-red-500" : "text-slate-800",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Icon container */}
      <span
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          danger ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500",
        ].join(" ")}
      >
        {icon}
      </span>

      {/* Label */}
      <span className={["flex-1 text-sm font-medium", danger ? "text-red-500" : "text-slate-800"].join(" ")}>
        {label}
      </span>

      {/* Value + optional chevron */}
      <span className="flex shrink-0 items-center gap-1">
        {value && (
          <span className="text-sm font-semibold text-slate-500">{value}</span>
        )}
        {chevron && <ChevronRight className="h-4 w-4 text-slate-300" />}
      </span>
    </button>
  );
}

/** Bloque de sección con título flotante */
function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}): ReactElement {
  return (
    <div>
      {title && (
        <p className="mb-1.5 px-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          {title}
        </p>
      )}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfileScreen({
  user,
  family = { status: "UNLINKED" },
  cutoffLabel,
  cutoffCountdown,
  onEditPhone,
  onEditAllergens,
  onEditPayment,
  onLinkFamily,
  onManageFamily,
  onNotifications,
  onLogout,
}: Props): ReactElement {
  const initials = user.initials || user.fullName.slice(0, 2).toUpperCase();

  return (
    <div
      className="h-screen overflow-y-scroll bg-gray-50 pb-24 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {/* ── 1. Cutoff Banner ─────────────────────────────────────────────────── */}
      {(cutoffLabel || cutoffCountdown) && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2.5 border-b border-amber-100">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <p className="text-xs font-semibold text-amber-800">
            {cutoffLabel && <span>{cutoffLabel}</span>}
            {cutoffCountdown && (
              <span className="ml-1.5 text-amber-600 tabular-nums">· {cutoffCountdown}</span>
            )}
          </p>
        </div>
      )}

      {/* ── 2. Hero Header ───────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-emerald-700 to-emerald-900 px-4 pb-8 pt-10">
        {/* Notifications shortcut */}
        {onNotifications && (
          <button
            type="button"
            aria-label="Notificaciones"
            onClick={onNotifications}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-opacity active:opacity-70"
          >
            <Bell className="h-5 w-5" />
          </button>
        )}

        {/* Avatar */}
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-3xl font-bold text-white shadow-lg">
          {initials}
        </div>

        {/* Name + course */}
        <div className="text-center">
          <p className="text-lg font-bold leading-tight text-white">{user.fullName}</p>
          <p className="mt-0.5 text-sm text-emerald-200/70">
            {user.course ?? "Curso sin asignar"}
          </p>
        </div>

        {/* Balance */}
        <p className="mt-4 text-center font-mono text-4xl font-bold tabular-nums text-white">
          {centsToEur(user.walletBalanceCents)}
        </p>
        <p className="mt-0.5 text-center text-xs font-medium text-emerald-200/60 uppercase tracking-widest">
          Saldo disponible
        </p>

        {/* Decorative circles */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[-60px] top-[-60px] h-52 w-52 rounded-full bg-white/5"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-40px] right-[-40px] h-40 w-40 rounded-full bg-white/5"
        />
      </section>

      {/* ── 3. Stats Grid ────────────────────────────────────────────────────── */}
      <div className="mx-4 -mt-6 relative z-10">
        <div className="grid grid-cols-3 divide-x divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-md">
          <div className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              {user.totalOrders}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Pedidos
            </span>
          </div>
          <div className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              {user.activeOrders}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              En curso
            </span>
          </div>
          <div className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold tabular-nums text-emerald-600">
              {centsToEur(user.totalSpentCents)}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Gastado
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Content body ──────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col gap-5 px-4">

        {/* Personal data */}
        <Section title="Cuenta">
          <SettingsRow
            icon={<Phone className="h-4 w-4" />}
            label="Teléfono"
            value={user.phone ?? "Sin añadir"}
            chevron={!!onEditPhone}
            onClick={onEditPhone}
          />
          <SettingsRow
            icon={<CreditCard className="h-4 w-4" />}
            label="Métodos de pago"
            value="Monedero"
            chevron={!!onEditPayment}
            onClick={onEditPayment}
          />
          <SettingsRow
            icon={<ShieldAlert className="h-4 w-4" />}
            label="Mis alérgenos"
            value={user.allergensLabel ?? "Sin configurar"}
            chevron={!!onEditAllergens}
            onClick={onEditAllergens}
          />
        </Section>

        {/* Family */}
        <Section title="Familia">
          {family.status === "UNLINKED" && (
            /* CTA Banner — cuenta sin vincular */
            <div className="flex items-center gap-3 px-4 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Users className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">Cuenta familiar</p>
                <p className="text-xs text-slate-400 leading-snug mt-0.5">
                  Vincúlate con un padre o tutor para pagos y aprobaciones.
                </p>
              </div>
              <button
                type="button"
                onClick={onLinkFamily}
                className="shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors active:bg-emerald-700"
              >
                Vincular
              </button>
            </div>
          )}

          {family.status === "PENDING" && (
            <div className="flex items-center gap-3 px-4 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <Link2 className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">Vinculación pendiente</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Token:{" "}
                  <span className="font-mono font-semibold text-slate-700">
                    {family.token}
                  </span>
                </p>
              </div>
            </div>
          )}

          {family.status === "LINKED" && (
            <>
              <SettingsRow
                icon={<Users className="h-4 w-4" />}
                label="Cuenta vinculada"
                value={family.parentName}
                chevron={!!onManageFamily}
                onClick={onManageFamily}
              />
              {/* Sub-metric: parent wallet */}
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Wallet className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                  <span className="text-xs text-slate-400">Monedero familiar</span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-slate-600">
                  {centsToEur(family.parentWalletCents)}
                </span>
              </div>
            </>
          )}
        </Section>

        {/* Logout — fuera de listas, al final */}
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 py-4 text-sm font-semibold text-red-500 transition-opacity active:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>

      </div>
    </div>
  );
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

export function ProfileScreenDemo(): ReactElement {
  const [family, setFamily] = useState<FamilyState>({ status: "UNLINKED" });

  return (
    <ProfileScreen
      user={{
        fullName: "Alumno Uno",
        initials: "AU",
        course: "3º ESO A",
        walletBalanceCents: 500,
        phone: "+34 612 345 678",
        allergensLabel: "Gluten, Huevo",
        totalOrders: 14,
        activeOrders: 1,
        totalSpentCents: 3250,
      }}
      family={family}
      cutoffLabel="Cierre a las 09:05"
      cutoffCountdown="19h 39m"
      onEditPhone={() => alert("✏️ editar teléfono")}
      onEditAllergens={() => alert("✏️ editar alérgenos")}
      onEditPayment={() => alert("💳 métodos de pago")}
      onNotifications={() => alert("🔔 notificaciones")}
      onLinkFamily={() =>
        setFamily({ status: "LINKED", parentName: "Carmen Pérez", parentWalletCents: 1200 })
      }
      onManageFamily={() => alert("👨‍👩‍👧 gestionar familia")}
      onLogout={() => alert("👋 cerrar sesión")}
    />
  );
}
