import { Bell, ChevronDown, LogOut, UserCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import BottomNav, { NavTab } from "./BottomNav";

type LayoutProps = {
  userName?: string;
  userInitials?: string;
  children?: React.ReactNode;
  onLogout?: () => void;
};

function titleForTab(tab: NavTab, userName: string): string {
  if (tab === "home") {
    return `Hola, ${userName} 👋`;
  }

  if (tab === "orders") {
    return "Tus pedidos";
  }

  if (tab === "wallet") {
    return "Tu billetera";
  }

  return "Perfil";
}

export default function Layout({
  userName = "Alumno",
  userInitials = "AL",
  children,
  onLogout
}: LayoutProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const headerTitle = useMemo(() => titleForTab(activeTab, userName), [activeTab, userName]);

  useEffect(() => {
    function handleOutside(event: MouseEvent): void {
      if (!profileRef.current) {
        return;
      }

      if (!profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    }

    window.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleNavChange(tab: NavTab): void {
    setActiveTab(tab);
    if (tab === "profile") {
      setIsProfileOpen(true);
      return;
    }

    setIsProfileOpen(false);
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 text-slate-800">
      <header className="z-50 h-16 shrink-0 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-full w-full max-w-md items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-8 w-8 shrink-0 rounded-xl bg-#1C9690/10 text-#1C9690 grid place-items-center font-bold">
              C
            </div>
            <p className="truncate text-[15px] font-semibold tracking-tight">{headerTitle}</p>
          </div>

          <div ref={profileRef} className="relative flex items-center gap-2">
            <button
              type="button"
              aria-label="Notificaciones"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 active:scale-95"
            >
              <Bell className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-label="Perfil"
              onClick={() => setIsProfileOpen((open) => !open)}
              className="inline-flex h-10 items-center gap-1 rounded-full bg-slate-100 px-2 text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-#1C9690 text-xs font-semibold text-white">
                {userInitials}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>

            {isProfileOpen ? (
              <div className="absolute right-0 top-12 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 transition-all hover:bg-red-50 active:scale-[0.99]"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesion
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full overflow-y-auto bg-gray-50">
        <section className="mx-auto w-full max-w-md px-0">
          {children ?? (
            <div className="grid gap-3 px-4 py-4">
              <article className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Contenido</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-800">Tu cafeteria escolar</h2>
              </article>
            </div>
          )}
        </section>
      </main>

      <BottomNav activeTab={activeTab} onChange={handleNavChange} />

      <button
        type="button"
        onClick={() => setIsProfileOpen((open) => !open)}
        aria-label="Abrir perfil"
        className="sr-only"
      >
        <UserCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
