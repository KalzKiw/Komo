import { useState } from "react";
import { Home, Wallet, UserCircle, Clock, ShoppingCart } from "lucide-react";

import { useAuth } from "./context/AuthContext";
import { useCart } from "./context/CartContext";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import OrdersScreen from "./screens/OrdersScreen";
import ProfileScreenWrapper from "./screens/ProfileScreenWrapper";
import AdminScreen from "./screens/AdminScreen";
import WalletScreen from "./screens/WalletScreen";
import CartModal from "./components/CartModal";
import OrderSummaryModal from "./components/OrderSummaryModal";
import type { UserRole } from "./context/AuthContext";

type Tab = "home" | "wallet" | "orders" | "profile";

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
  const { itemCount } = useCart();

  // Estado global para el resumen de pedido
  const [orderSummary, setOrderSummary] = useState<null | {
    items: any[];
    total: number;
    feedback: string;
  }>(null);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  // Función para mostrar el resumen desde CartModal
  function handleShowOrderSummary(summary: { items: any[]; total: number; feedback: string }) {
    if (summary.feedback === "goToOrders") {
      setShowOrderSummary(false);
      setOrderSummary(null);
      setCartOpen(false);
      setTab("orders");
      // Forzar navegación en la URL si no se usa react-router
      if (window.location.pathname !== "/orders") {
        window.history.pushState({}, "", "/orders");
      }
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
    setTab("orders");
  }

  return (
    <div className="h-svh w-full overflow-hidden bg-gray-50">
      {/* ── Screen area ──────────────────────────────────────────── */}
      <div className="h-full w-full overflow-hidden pb-16">
        {tab === "home" && <HomeScreen />}
        {tab === "wallet" && <WalletScreen role={role} />}
        {tab === "orders" && <OrdersScreen onShowOrderSummary={handleShowOrderSummary} />}
        {tab === "profile" && <ProfileScreenWrapper />}
        {/* CartModal solo si está abierto y NO se muestra el resumen */}
        {cartOpen && !showOrderSummary && (
          <CartModal
            onClose={() => setCartOpen(false)}
            onShowOrderSummary={handleShowOrderSummary}
          />
        )}
        {/* Modal de resumen de pedido */}
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

      {/* ── Bottom Nav ───────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-end justify-around border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm">
        {/* Left tabs */}
        {LEFT_NAV.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="flex flex-1 flex-col items-center gap-0.5 pb-2 pt-2 transition-all active:scale-90"
            >
              <Icon className={`h-5 w-5 transition-colors ${active ? "text-emerald-600" : "text-slate-400"}`} />
              <span className={`text-[10px] font-semibold transition-colors ${active ? "text-emerald-600" : "text-slate-400"}`}>
                {label}
              </span>
            </button>
          );
        })}

        {/* Center cart FAB */}
        <div className="flex flex-col items-center" style={{ flex: "0 0 72px" }}>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative -translate-y-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-[0_4px_20px_rgba(5,150,105,0.45)] ring-4 ring-white transition-all active:scale-90 hover:bg-emerald-600"
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
        {RIGHT_NAV.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="flex flex-1 flex-col items-center gap-0.5 pb-2 pt-2 transition-all active:scale-90"
            >
              <Icon className={`h-5 w-5 transition-colors ${active ? "text-emerald-600" : "text-slate-400"}`} />
              <span className={`text-[10px] font-semibold transition-colors ${active ? "text-emerald-600" : "text-slate-400"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Cart modal */}
      {cartOpen && <CartModal onClose={() => setCartOpen(false)} onShowOrderSummary={handleShowOrderSummary} />}

      {/* Modal global de resumen de pedido */}
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

export default function App() {
  const { state } = useAuth();

  if (state.status === "loading") {
    return (
      <div className="flex h-svh items-center justify-center bg-gradient-to-b from-emerald-700 to-emerald-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    );
  }

  if (state.status === "authenticated") {
    return <AuthenticatedApp />;
  }

  return <LoginScreen />;
}
