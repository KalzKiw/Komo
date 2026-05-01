import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { allergenVisual } from "../lib/allergens";
import { apiUrl } from "../lib/api";

const QUICK_USERS = [
  { label: "Alumno", email: "student1@cafes.app", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { label: "Padre", email: "parent1@cafes.app", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { label: "Admin", email: "admin1@cafes.app", color: "bg-amber-50 text-amber-700 border-amber-200" },
];

const ACCOUNT_ROLES = [
  { value: "STUDENT", label: "Alumno" },
  { value: "PARENT", label: "Padre" },
] as const;

type RegisterStep = 1 | 2 | 3;

const LoginModern: React.FC = () => {
  const { login, register, state } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof ACCOUNT_ROLES)[number]["value"]>("STUDENT");
  const [allAllergens, setAllAllergens] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(new Set());
  const [loadingAllergens, setLoadingAllergens] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const isLoading = state.status === "loading";
  const errorMsg = localError ?? (state.status === "unauthenticated" ? state.error : undefined);

  useEffect(() => {
    if (mode !== "register" || registerStep !== 3 || allAllergens.length > 0) return;
    setLoadingAllergens(true);
    fetch(apiUrl("/api/allergens"))
      .then((res) => res.json())
      .then((data) => setAllAllergens(data.data ?? []))
      .catch(() => setAllAllergens([]))
      .finally(() => setLoadingAllergens(false));
  }, [allAllergens.length, mode, registerStep]);

  const selectedCount = selectedAllergens.size;
  const buttonLabel = mode === "login" ? "Entrar" : "Crear cuenta";

  function switchMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setRegisterStep(1);
    setLocalError(null);
  }

  function validateCredentialsStep() {
    if (!email.trim()) {
      setLocalError("Introduce un correo válido.");
      return false;
    }
    if (password.length < 6) {
      setLocalError("La contraseña debe tener al menos 6 caracteres.");
      return false;
    }
    if (password !== confirmPassword) {
      setLocalError("Las contraseñas no coinciden.");
      return false;
    }
    setLocalError(null);
    return true;
  }

  function validateProfileStep() {
    if (fullName.trim().length < 3) {
      setLocalError("Introduce tu nombre completo.");
      return false;
    }
    setLocalError(null);
    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "register") {
      if (registerStep === 1) {
        if (validateCredentialsStep()) setRegisterStep(2);
        return;
      }

      if (registerStep === 2) {
        if (validateProfileStep()) setRegisterStep(3);
        return;
      }

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
          <div className="mb-5 flex justify-center">
            <img
              src="/logotipo-transparente.png"
              alt="KOMO"
              className="h-20 w-auto object-contain"
            />
          </div>
          <p className="text-[#2D3748] font-body text-lg leading-relaxed">
            Cafetería Escolar Digital
          </p>
        </header>

        <section className="bg-surface-container-lowest ambient-shadow rounded-[1.5rem] p-8 md:p-12 flex flex-col gap-6" style={{ boxShadow: "0 8px 32px -8px rgba(25,28,27,0.06)" }}>
          <div className="grid grid-cols-2 gap-2 rounded-3xl bg-white p-2 shadow-inner">
            {modeTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchMode(tab.id as "login" | "register")}
                className={`rounded-3xl py-3 text-sm font-semibold transition ${
                  mode === tab.id
                    ? "bg-[#1C9690] text-white"
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
            {mode === "register" && (
              <div className="mb-6 flex items-center justify-center gap-2">
                {[1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={`h-2 rounded-full transition-all ${
                      registerStep === step ? "w-8 bg-[#1C9690]" : "w-2 bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            )}
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              {(mode === "login" || registerStep === 1) && (
                <>
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    Correo
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      placeholder="usuario@colegio.edu"
                      className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#2da38f] focus:ring-2 focus:ring-[#2da38f]/20"
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    Contraseña
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      placeholder="••••••••"
                      className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#2da38f] focus:ring-2 focus:ring-[#2da38f]/20"
                      required
                    />
                  </label>

                  {mode === "register" && (
                    <label className="flex flex-col gap-2 text-sm text-slate-700">
                      Repite la contraseña
                      <input
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        type="password"
                        placeholder="••••••••"
                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#2da38f] focus:ring-2 focus:ring-[#2da38f]/20"
                        required
                      />
                    </label>
                  )}
                </>
              )}

              {mode === "register" && registerStep === 2 && (
                <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                  <label className="mb-4 flex flex-col gap-2 text-sm text-slate-700">
                    Nombre completo
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Ej. Ana Pérez"
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1C9690] focus:ring-2 focus:ring-[#1C9690]/20"
                      required
                    />
                  </label>
                  <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">Tipo de cuenta</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ACCOUNT_ROLES.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setRole(item.value)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          role === item.value
                            ? "border-[#1C9690] bg-[#d9f4ee] text-[#2D3748]"
                            : "border-gray-200 bg-white text-slate-700 hover:border-[#1C9690]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "register" && registerStep === 3 && (
                <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Alérgenos</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      {selectedCount} seleccionados
                    </span>
                  </div>
                  <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
                    {loadingAllergens ? (
                      <div className="rounded-2xl bg-white p-4 text-sm text-slate-500">Cargando alérgenos…</div>
                    ) : (
                      allAllergens.map((allergen) => {
                        const active = selectedAllergens.has(allergen.id);
                        const visual = allergenVisual(allergen.name);
                        return (
                          <button
                            key={allergen.id}
                            type="button"
                            onClick={() => toggleAllergen(allergen.id)}
                            className={`flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                              active ? "border-[#2da38f] bg-[#d9f4ee]" : "border-gray-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <span className="flex min-w-0 flex-1 items-center gap-2">
                              <span className="shrink-0 text-lg">{visual.icon}</span>
                              <span className="truncate">{allergen.name}</span>
                            </span>
                            <span className={`h-5 w-5 shrink-0 rounded-full border-2 ${active ? "border-[#1C9690] bg-[#1C9690]" : "border-gray-300"}`} />
                          </button>
                        );
                      })
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Puedes continuar sin seleccionar ninguno.</p>
                </div>
              )}

              {errorMsg && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{errorMsg}</div>
              )}

              <div className="flex gap-3">
                {mode === "register" && registerStep > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalError(null);
                      setRegisterStep((prev) => (prev === 3 ? 2 : 1));
                    }}
                    className="flex-1 rounded-[1.5rem] border border-slate-200 bg-white py-4 text-lg font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Atrás
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-[1.5rem] bg-[#1C9690] py-4 text-lg font-bold text-white transition hover:bg-[#169486] disabled:opacity-60"
                >
                  {isLoading
                    ? "Procesando…"
                    : mode === "register" && registerStep < 3
                      ? "Siguiente"
                      : buttonLabel}
                </button>
              </div>
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
