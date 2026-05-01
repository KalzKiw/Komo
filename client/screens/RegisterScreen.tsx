import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { allergenVisual } from "../lib/allergens";
import { apiUrl } from "../lib/api";

interface Allergen {
  id: string;
  code: string;
  name: string;
}

type Step = 1 | 2 | 3;

export default function RegisterScreen({ onBackToLogin }: { onBackToLogin: () => void }) {
  const { register, state } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"STUDENT" | "PARENT">("STUDENT");
  const [fullName, setFullName] = useState("");
  const [allAllergens, setAllAllergens] = useState<Allergen[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(new Set());
  const [loadingAllergens, setLoadingAllergens] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = state.status === "loading";

  // ─── Step 1: Email + Password (x2) ──────────────────────────────────────

  function validateStep1(): boolean {
    if (!email || !password || !confirmPassword) {
      setError("Todos los campos son requeridos");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    setError(null);
    return true;
  }

  function handleNextStep1() {
    if (validateStep1()) {
      setStep(2);
    }
  }

  // ─── Step 2: Padre/Hijo selector + Nombre ──────────────────────────────────

  function handleNextStep2() {
    if (!fullName.trim()) {
      setError("Por favor ingresa tu nombre");
      return;
    }
    setError(null);
    setStep(3);
    // Load allergens
    setLoadingAllergens(true);
    fetch(apiUrl("/api/allergens"))
      .then((res) => res.json())
      .then((data) => setAllAllergens(data.data ?? []))
      .catch(() => setError("Error al cargar alérgenos"))
      .finally(() => setLoadingAllergens(false));
  }

  // ─── Step 3: Allergen selector ──────────────────────────────────────────

  function toggleAllergen(id: string) {
    setSelectedAllergens((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    try {
      await register({
        email,
        password,
        fullName,
        role,
        allergenIds: [...selectedAllergens],
      });
    } catch {
      // Error is handled by AuthContext
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-slate-900">Correo y contraseña</h2>
        
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Correo</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1] focus:ring-2 focus:ring-[#c6efe7]"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contraseña</span>
          <div className="flex items-center gap-2">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1] focus:ring-2 focus:ring-[#c6efe7]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-500 hover:text-slate-700"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirmar contraseña</span>
          <div className="flex items-center gap-2">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              required
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1] focus:ring-2 focus:ring-[#c6efe7]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-slate-500 hover:text-slate-700"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </label>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <button
          type="button"
          onClick={handleNextStep1}
          disabled={isLoading}
          className="w-full rounded-2xl bg-[#1C9690] py-3 font-bold text-white disabled:opacity-60 active:scale-[0.97] transition"
        >
          Siguiente
        </button>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-slate-900">Cuéntanos sobre ti</h2>
        
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tu nombre</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nombre completo"
            required
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#44b6a1] focus:ring-2 focus:ring-[#c6efe7]"
          />
        </label>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 block mb-3">¿Quién eres?</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRole("STUDENT")}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                role === "STUDENT"
                  ? "bg-[#1C9690] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              🎓 Alumno
            </button>
            <button
              type="button"
              onClick={() => setRole("PARENT")}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                role === "PARENT"
                  ? "bg-[#1C9690] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              👨‍👩‍👧 Padre/Madre
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex-1 rounded-2xl border border-slate-300 py-3 font-bold text-slate-900 disabled:opacity-60 active:scale-[0.97] transition"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={handleNextStep2}
            disabled={isLoading}
            className="flex-1 rounded-2xl bg-[#1C9690] py-3 font-bold text-white disabled:opacity-60 active:scale-[0.97] transition"
          >
            Siguiente
          </button>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-slate-900">Tus alérgenos</h2>
        <p className="text-sm text-slate-600">Ayúdanos a saber qué alimentos no debes comer</p>

        {loadingAllergens ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#92dbc8] border-t-#1C9690" />
          </div>
        ) : (
          <div className="rounded-3xl bg-slate-50 p-1 space-y-1">
            {allAllergens.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No hay alérgenos disponibles</p>
            ) : (
              allAllergens.map((allergen) => {
                const isSelected = selectedAllergens.has(allergen.id);
                const visual = allergenVisual(allergen.name);
                return (
                  <button
                    key={allergen.id}
                    type="button"
                    onClick={() => toggleAllergen(allergen.id)}
                    className={`flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left transition ${
                      isSelected ? "bg-[#d9f4ee]" : "hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-xl">{visual.icon}</span>
                    <span className={`flex-1 text-sm font-medium ${isSelected ? "text-[#169486]" : "text-slate-700"}`}>
                      {allergen.name}
                    </span>
                    <span className={`h-5 w-5 rounded-full border-2 ${isSelected ? "border-[#2da38f] bg-[#2da38f]" : "border-slate-300 bg-white"}`} />
                  </button>
                );
              })
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={isLoading}
            className="flex-1 rounded-2xl border border-slate-300 py-3 font-bold text-slate-900 disabled:opacity-60 active:scale-[0.97] transition"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 rounded-2xl bg-[#1C9690] py-3 font-bold text-white disabled:opacity-60 active:scale-[0.97] transition"
          >
            {isLoading ? "Creando..." : "Crear cuenta"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-[#1C9690] to-[#2D3748] px-5 py-6">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
          <span className="text-3xl font-black text-white">K</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">KOMO</h1>
          <p className="text-sm text-[#d9f4ee]">Crear cuenta</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        {/* Progress indicator */}
        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-[#1C9690]" : "bg-gray-200"
        {/* STEP 1: Email & Password */}
        {step === 1 && (
          <>
            <h2 className="mb-2 text-lg font-bold text-slate-900">Crea tu cuenta</h2>
            <p className="mb-5 text-sm text-slate-500">Correo y contraseña</p>

            {error && (
              <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Correo
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="tu@correo.com"
                  required
                  autoComplete="email"
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#2da38f] focus:ring-2 focus:ring-[#2da38f]/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contraseña
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#2da38f] focus:ring-2 focus:ring-[#2da38f]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Confirmar contraseña
                </span>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#2da38f] focus:ring-2 focus:ring-[#2da38f]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>
            </div>

            <button
              type="button"
              onClick={handleNextStep1}
              className="mt-6 w-full rounded-xl bg-[#1C9690] py-3.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(5,150,105,0.35)] transition-colors active:bg-[#169486] disabled:opacity-60"
            >
              Siguiente
            </button>
          </>
        )}

        {/* STEP 2: Parent/Student selector */}
        {step === 2 && (
          <>
            <h2 className="mb-2 text-lg font-bold text-slate-900">Tipo de cuenta</h2>
            <p className="mb-5 text-sm text-slate-500">¿Eres alumno o padre/madre?</p>

            {error && (
              <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
                {error}
              </p>
            )}

            <label className="mb-4 flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tu nombre
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError(null);
                }}
                placeholder="Tu nombre completo"
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#2da38f] focus:ring-2 focus:ring-[#2da38f]/20"
              />
            </label>

            <div className="mb-6 flex flex-col gap-2">
              {[
                { value: "STUDENT" as const, label: "Alumno", icon: "🎓", color: "sky" },
                { value: "PARENT" as const, label: "Padre/Madre", icon: "👨‍👩‍👧", color: "violet" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setRole(option.value);
                    setError(null);
                  }}
                  className={`rounded-2xl border-2 px-4 py-4 text-left transition ${
                    role === option.value
                      ? `border-${option.color}-500 bg-${option.color}-50`
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-900">{option.label}</p>
                      <p className="text-xs text-slate-500">
                        {option.value === "STUDENT"
                          ? "Hacer pedidos de comida"
                          : "Gestionar pedidos de tus hijos"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
                className="flex-1 rounded-xl border border-gray-200 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-gray-50"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleNextStep2}
                className="flex-1 rounded-xl bg-[#1C9690] py-3.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(5,150,105,0.35)] transition-colors active:bg-[#169486]"
              >
                Siguiente
              </button>
            </div>
          </>
        )}

        {/* STEP 3: Allergen selector */}
        {step === 3 && (
          <>
            <h2 className="mb-2 text-lg font-bold text-slate-900">Tus alérgenos</h2>
            <p className="mb-4 text-sm text-slate-500">
              Marca los que aplican (opcional)
            </p>

            {error && (
              <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
                {error}
              </p>
            )}

            <div className="mb-4 max-h-64 overflow-y-auto rounded-2xl bg-slate-50 p-1">
              {loadingAllergens ? (
                <div className="flex justify-center py-8">
                  <span className="h-6 w-6 animate-spin rounded-full border-4 border-[#92dbc8] border-t-#1C9690" />
                </div>
              ) : allAllergens.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">
                  No se pudieron cargar los alérgenos
                </p>
              ) : (
                <>
                  {allAllergens.map((allergen, i) => {
                    const isActive = selectedAllergens.has(allergen.id);
                    const visual = allergenVisual(allergen.name);
                    return (
                      <button
                        key={allergen.id}
                        type="button"
                        onClick={() => toggleAllergen(allergen.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                          isActive ? "bg-[#d9f4ee]" : "hover:bg-slate-100"
                        } ${i < allAllergens.length - 1 ? "mb-1" : ""}`}
                      >
                        <span className="text-lg">
                          {visual.icon}
                        </span>
                        <span
                          className={`flex-1 text-sm font-medium ${
                            isActive ? "text-[#169486]" : "text-slate-700"
                          }`}
                        >
                          {allergen.name}
                        </span>
                        <div
                          className={`h-5 w-5 rounded-full border-2 transition ${
                            isActive
                              ? "border-[#2da38f] bg-[#2da38f]"
                              : "border-slate-300 bg-white"
                          }`}
                        />
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {selectedAllergens.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedAllergens(new Set())}
                className="mb-4 w-full text-center text-xs font-semibold text-red-500 hover:text-red-600"
              >
                Limpiar selección
              </button>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  setError(null);
                }}
                className="flex-1 rounded-xl border border-gray-200 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-gray-50"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 rounded-xl bg-[#1C9690] py-3.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(5,150,105,0.35)] transition-colors active:bg-[#169486] disabled:opacity-60"
              >
                {isLoading ? "Creando cuenta…" : "Crear cuenta"}
              </button>
            </div>
          </>
        )}

        {/* Back to login link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center justify-center gap-1 text-sm font-semibold text-[#1C9690] hover:text-[#169486]"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver a iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
