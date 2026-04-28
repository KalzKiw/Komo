import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const QUICK_USERS = [
  { label: "Alumno", email: "student1@cafes.app", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { label: "Padre", email: "parent1@cafes.app", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { label: "Admin", email: "admin1@cafes.app", color: "bg-amber-50 text-amber-700 border-amber-200" },
];

const ACCOUNT_ROLES = [
  { value: "STUDENT", label: "Alumno" },
  { value: "PARENT", label: "Padre" },
] as const;

const LoginModern: React.FC = () => {
  const { login, register, state } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof ACCOUNT_ROLES)[number]["value"]>("STUDENT");
  const [allAllergens, setAllAllergens] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(new Set());
  const [loadingAllergens, setLoadingAllergens] = useState(false);
  const isLoading = state.status === "loading";
  const errorMsg = state.status === "unauthenticated" ? state.error : undefined;

  useEffect(() => {
    if (mode !== "register") return;
    setLoadingAllergens(true);
    fetch("/api/allergens")
      .then((res) => res.json())
      .then((data) => setAllAllergens(data.data ?? []))
      .catch(() => setAllAllergens([]))
      .finally(() => setLoadingAllergens(false));
  }, [mode]);

  const selectedCount = selectedAllergens.size;
  const buttonLabel = mode === "login" ? "Entrar" : "Crear cuenta";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "register") {
      await register({
        email,
        password,
        fullName,
        role,
        allergenIds: [...selectedAllergens],
      });
      return;
    }

    await login(email, password);
  }

  function toggleAllergen(id: string) {
    setSelectedAllergens((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const modeTabs = useMemo(
    () => [
      { id: "login", label: "Iniciar" },
      { id: "register", label: "Registro" },
    ],
    []
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-start justify-center p-6 pt-10 font-body relative">
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end">
        {QUICK_USERS.map((u) => (
          <button
            key={u.email}
            type="button"
            disabled={isLoading}
            onClick={() => void login(u.email, "demo")}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold shadow transition-all active:scale-[0.98] disabled:opacity-50 ${u.color}`}
          >
            {u.label} — <span className="font-mono opacity-70">{u.email}</span>
          </button>
        ))}
      </div>

      <main className="w-full max-w-md mt-2">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <h1 className="text-primary font-bold italic text-3xl tracking-tight">CafES</h1>
          </div>
          <p className="text-on-surface-variant font-body text-lg leading-relaxed">
            Cafetería Escolar Digital
          </p>
        </header>

        <section className="bg-surface-container-lowest ambient-shadow rounded-[1.5rem] p-8 md:p-12 flex flex-col gap-6" style={{ boxShadow: "0 8px 32px -8px rgba(25,28,27,0.06)" }}>
          <div className="grid grid-cols-2 gap-2 rounded-3xl bg-white p-2 shadow-inner">
            {modeTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id as "login" | "register")}
                className={`rounded-3xl py-3 text-sm font-semibold transition ${
                  mode === tab.id
                    ? "bg-emerald-600 text-white"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[1.5rem] p-8 md:p-10 shadow-lg" style={{ boxShadow: "0 8px 40px -4px rgba(1,45,29,0.18), 0 1.5px 8px 0 rgba(1,45,29,0.10)" }}>
            <h2 className="text-primary font-headline text-3xl font-bold mb-6 text-center tracking-tight">
              {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
            </h2>
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              {mode === "register" && (
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  Nombre completo
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Ej. Ana Pérez"
                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </label>
              )}

              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Correo
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="usuario@colegio.edu"
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Contraseña
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  placeholder={mode === "login" ? "••••••••" : "Opcional para registro"}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required={mode === "login"}
                />
              </label>

              {mode === "register" && (
                <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                  <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">Tipo de cuenta</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ACCOUNT_ROLES.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setRole(item.value)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          role === item.value
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 bg-white text-slate-700 hover:border-emerald-300"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Alérgenos</p>
                    <div className="grid gap-2">
                      {loadingAllergens ? (
                        <div className="rounded-2xl bg-white p-4 text-sm text-slate-500">Cargando alérgenos…</div>
                      ) : (
                        allAllergens.map((allergen) => {
                          const active = selectedAllergens.has(allergen.id);
                          return (
                            <button
                              key={allergen.id}
                              type="button"
                              onClick={() => toggleAllergen(allergen.id)}
                              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                                active ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white hover:bg-slate-50"
                              }`}
                            >
                              <span>{allergen.name}</span>
                              <span className={`h-5 w-5 rounded-full border-2 ${active ? "border-emerald-600 bg-emerald-600" : "border-gray-300"}`} />
                            </button>
                          );
                        })
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Selecciona los alérgenos que se apliquen a ti.</p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{errorMsg}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-[1.5rem] bg-emerald-600 py-4 text-lg font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {isLoading ? "Procesando…" : buttonLabel}
              </button>
            </form>
          </div>
        </section>
      </main>

      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-fixed/20 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-fixed/20 rounded-full blur-[80px]"></div>
      </div>

      <style>{`.ambient-shadow { box-shadow: 0 12px 40px -12px rgba(25, 28, 27, 0.06); }`}</style>
    </div>
  );
};

export default LoginModern;
