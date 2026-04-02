import { Home, ShoppingBag, UserCircle, Wallet } from "lucide-react";

export type NavTab = "home" | "orders" | "wallet" | "profile";

type BottomNavProps = {
  activeTab: NavTab;
  onChange: (tab: NavTab) => void;
};

const baseButtonClass =
  "group inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 active:scale-95";

function iconClass(active: boolean): string {
  return active
    ? "h-7 w-7 text-emerald-600 drop-shadow-[0_2px_6px_rgba(16,185,129,0.35)]"
    : "h-7 w-7 text-slate-400 group-hover:text-slate-500";
}

export default function BottomNav({ activeTab, onChange }: BottomNavProps): JSX.Element {
  return (
    <nav className="z-50 h-20 w-full shrink-0 bg-white/95 shadow-[0_-8px_20px_-10px_rgba(15,23,42,0.25)] backdrop-blur-sm pb-[calc(env(safe-area-inset-bottom)+0.35rem)]">
      <ul className="mx-auto grid h-full w-full max-w-md grid-cols-4 items-center px-4">
        <li className="flex justify-center">
          <button
            type="button"
            aria-label="Inicio"
            onClick={() => onChange("home")}
            className={baseButtonClass}
          >
            <Home className={iconClass(activeTab === "home")} />
          </button>
        </li>

        <li className="flex justify-center">
          <button
            type="button"
            aria-label="Pedidos"
            onClick={() => onChange("orders")}
            className={baseButtonClass}
          >
            <ShoppingBag className={iconClass(activeTab === "orders")} />
          </button>
        </li>

        <li className="flex justify-center">
          <button
            type="button"
            aria-label="Billetera"
            onClick={() => onChange("wallet")}
            className={baseButtonClass}
          >
            <Wallet className={iconClass(activeTab === "wallet")} />
          </button>
        </li>

        <li className="flex justify-center">
          <button
            type="button"
            aria-label="Perfil"
            onClick={() => onChange("profile")}
            className={baseButtonClass}
          >
            <UserCircle className={iconClass(activeTab === "profile")} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
