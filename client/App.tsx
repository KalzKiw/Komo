import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { Home, Wallet, UserCircle, Clock, ShoppingCart } from "lucide-react";

import { useAuth } from "./context/AuthContext";
import { useCart } from "./context/CartContext";
import LoginModern from "./components/LoginModern";
import HomeScreen from "./screens/HomeScreen";
import OrdersScreen from "./screens/OrdersScreen";
import ProfileScreenWrapper from "./screens/ProfileScreenWrapper";
import AdminScreen from "./screens/AdminScreen";
import WalletScreen from "./screens/WalletScreen";
import CartModal from "./components/CartModal";
import OrderSummaryModal from "./components/OrderSummaryModal";
import type { UserRole } from "./context/AuthContext";

type Tab = "home" | "wallet" | "orders" | "profile";

const TAB_ORDER: Tab[] = ["home", "wallet", "orders", "profile"];

const LEFT_NAV: Array<{ id: Tab; label: string; Icon: typeof Home }> = [
  { id: "home", label: "Inicio", Icon: Home },
  { id: "wallet", label: "Monedero", Icon: Wallet },
];

const RIGHT_NAV: Array<{ id: Tab; label: string; Icon: typeof Home }> = [
  { id: "orders", label: "Pedidos", Icon: Clock },
  { id: "profile", label: "Perfil", Icon: UserCircle },
];

function ConsumerApp({ role }: { role: UserRole }) {
  const [tab, setTab] = useState<Tab>("home");
  const [cartOpen, setCartOpen] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; at: number } | null>(null);
  const { itemCount } = useCart();
  const leftNav = LEFT_NAV.map((item) =>
    role === "PARENT" && item.id === "wallet" ? { ...item, label: "Hijos" } : item
  );
  const rightNav = RIGHT_NAV.map((item) =>
    role === "PARENT" && item.id === "orders" ? { ...item, label: "Estadísticas" } : item
  );

  // Estado global para el resumen de pedido
  const [orderSummary, setOrderSummary] = useState<null | {
    items: any[];
    total: number;
    feedback: string;
  }>(null);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  const navigateToTab = useCallback((nextTab: Tab, pushHistory = true) => {
    setCartOpen(false);
    setShowOrderSummary(false);
    setOrderSummary(null);
    setTab(nextTab);
    if (pushHistory && window.history.state?.komoTab !== nextTab) {
      window.history.pushState({ komoTab: nextTab }, "", window.location.pathname);
    }
  }, []);

  function openCart() {
    setCartOpen(true);
    if (!window.history.state?.komoCart) {
      window.history.pushState({ ...(window.history.state ?? {}), komoCart: true }, "", window.location.pathname);
    }
  }

  function closeCart() {
    if (window.history.state?.komoCart) {
      window.history.back();
      return;
    }
    setCartOpen(false);
  }

  useEffect(() => {
    const currentState = window.history.state ?? {};
    if (!currentState.komoTab) {
      window.history.replaceState({ ...currentState, komoTab: tab }, "", window.location.pathname);
    }

    function handlePopState(event: PopStateEvent) {
      const stateTab = event.state?.komoTab;
      if (!event.state?.komoCart) {
        setCartOpen(false);
      }
      if (stateTab && TAB_ORDER.includes(stateTab)) {
        setShowOrderSummary(false);
        setOrderSummary(null);
        setTab(stateTab);
        return;
      }

      setCartOpen(false);
      setShowOrderSummary(false);
      setOrderSummary(null);
      setTab("home");
      window.history.replaceState({ ...(event.state ?? {}), komoTab: "home" }, "", window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [tab]);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (cartOpen || showOrderSummary) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [role='dialog'], [data-gesture-lock='true']")) return;
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, at: Date.now() };
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || cartOpen || showOrderSummary) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const elapsed = Date.now() - start.at;

    if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.4 || elapsed > 650) return;

    const currentIndex = TAB_ORDER.indexOf(tab);
    const nextIndex = dx < 0
      ? Math.min(TAB_ORDER.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);

    if (nextIndex !== currentIndex) {
      event.preventDefault();
      event.stopPropagation();
      navigateToTab(TAB_ORDER[nextIndex]);
    }
  }

  // Función para mostrar el resumen desde CartModal
  function handleShowOrderSummary(summary: { items: any[]; total: number; feedback: string }) {
    if (summary.feedback === "goToOrders") {
      setShowOrderSummary(false);
      setOrderSummary(null);
      setCartOpen(false);
      navigateToTab(role === "PARENT" ? "wallet" : "orders");
      return;
    }
    setOrderSummary(summary);
    setShowOrderSummary(true);
  }

  function handleCloseOrderSummary() {
    setShowOrderSummary(false);
    setOrderSummary(null);
    setCartOpen(false); // Cierra el carrito al cerrar el resumen
  }

  function handleGoToOrders() {
    setShowOrderSummary(false);
    setOrderSummary(null);
    setCartOpen(false);
    navigateToTab(role === "PARENT" ? "wallet" : "orders");
  }

  return (
    <div
      className="h-svh w-full overflow-hidden bg-gray-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Screen area ──────────────────────────────────────────── */}
      <div className="h-full w-full overflow-hidden pb-16">
        {tab === "home" && <HomeScreen />}
        {tab === "wallet" && <WalletScreen role={role} parentView="children" />}
        {tab === "orders" && (
          role === "PARENT"
            ? <WalletScreen role={role} parentView="stats" />
            : <OrdersScreen onShowOrderSummary={handleShowOrderSummary} />
        )}
        {tab === "profile" && <ProfileScreenWrapper />}
      </div>

      {/* ── Bottom Nav ───────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-end justify-around border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm">
        {/* Left tabs */}
        {leftNav.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigateToTab(id)}
              className="flex flex-1 flex-col items-center gap-0.5 pb-2 pt-2 transition-all active:scale-90"
            >
              <Icon className={`h-5 w-5 transition-colors ${active ? "text-[#1C9690]" : "text-slate-400"}`} />
              <span className={`text-[10px] font-semibold transition-colors ${active ? "text-[#1C9690]" : "text-slate-400"}`}>
                {label}
              </span>
            </button>
          );
        })}

        {/* Center cart FAB */}
        <div className="flex flex-col items-center" style={{ flex: "0 0 72px" }}>
          <button
            type="button"
            onClick={openCart}
            className="relative -translate-y-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1C9690] shadow-[0_4px_20px_rgba(28,150,144,0.45)] ring-4 ring-white transition-all active:scale-90 hover:bg-[#169486]"
          >
            <ShoppingCart className="h-6 w-6 text-white" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Right tabs */}
        {rightNav.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigateToTab(id)}
              className="flex flex-1 flex-col items-center gap-0.5 pb-2 pt-2 transition-all active:scale-90"
            >
              <Icon className={`h-5 w-5 transition-colors ${active ? "text-[#1C9690]" : "text-slate-400"}`} />
              <span className={`text-[10px] font-semibold transition-colors ${active ? "text-[#1C9690]" : "text-slate-400"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Cart modal y resumen de pedido (solo una instancia de cada uno) */}
      {cartOpen && !showOrderSummary && (
        <CartModal
          onClose={closeCart}
          onShowOrderSummary={handleShowOrderSummary}
        />
      )}
      {showOrderSummary && orderSummary && (
        <OrderSummaryModal
          open={showOrderSummary}
          items={orderSummary.items}
          total={orderSummary.total}
          feedback={orderSummary.feedback}
          onClose={handleCloseOrderSummary}
          onGoToOrders={handleGoToOrders}
        />
      )}
    </div>
  );
}

function AuthenticatedApp() {
  const { state } = useAuth();
  const role = state.status === "authenticated" ? state.user.role : "STUDENT";

  if (role === "ADMIN" || role === "STAFF") {
    return <AdminScreen />;
  }

  return <ConsumerApp role={role} />;
}

function AuthScreen() {
  return <LoginModern />;
}

export default function App() {
  const { state } = useAuth();

  if (state.status === "loading") {
    return (
      <div className="flex h-svh items-center justify-center bg-gradient-to-b from-[#169486] to-[#0f4b47]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    );
  }

  if (state.status === "authenticated") {
    return <AuthenticatedApp />;
  }

  return <AuthScreen />;
}
