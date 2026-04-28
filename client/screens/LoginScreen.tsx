import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const QUICK_USERS = [
  { label: "Alumno", email: "student1@cafes.app", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { label: "Padre", email: "parent1@cafes.app", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { label: "Admin", email: "admin1@cafes.app", color: "bg-amber-50 text-amber-700 border-amber-200" },
];

export default function LoginScreen() {
  const { state, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isLoading = state.status === "loading";
  const errorMsg = state.status === "unauthenticated" ? state.error : undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void login(email, password);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-emerald-700 to-emerald-900 px-5">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
          <span className="text-3xl font-black text-white">C</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">CafES</h1>
          <p className="text-sm text-emerald-200/80">Cafetería Escolar Digital</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-bold text-slate-900">Iniciar sesión</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Correo
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student1@cafes.app"
              required
              autoComplete="email"
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contraseña
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          {errorMsg && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(5,150,105,0.35)] transition-colors active:bg-emerald-700 disabled:opacity-60"
          >
            {isLoading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        {/* Quick logins */}
        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="mb-2 text-center text-[11px] text-slate-400">Acceso rápido</p>
          <div className="flex flex-col gap-2">
            {QUICK_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                disabled={isLoading}
                onClick={() => void login(u.email, "demo")}
                className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 ${u.color}`}
              >
                {u.label} — <span className="font-mono opacity-70">{u.email}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Register link */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">¿No tienes cuenta?</p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("switchToRegister"))}
            className="mt-2 font-semibold text-emerald-600 hover:text-emerald-700 text-sm"
          >
            Crear cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
