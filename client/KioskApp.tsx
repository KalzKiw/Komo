import { useAuth } from "./context/AuthContext";
import KioskScreen from "./screens/KioskScreen";

export function isKioskRoute(): boolean {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/kiosk";
}

export default function KioskApp() {
  const { state } = useAuth();

  if (state.status === "loading") {
    return (
      <div className="flex h-svh w-full items-center justify-center bg-[#1C9690]">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    );
  }

  return (
    <div className="kiosk-root h-svh w-full overflow-hidden bg-slate-100">
      <KioskScreen />
    </div>
  );
}
