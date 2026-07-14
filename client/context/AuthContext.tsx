import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiUrl } from "../lib/api";
import { demoUsers } from "../lib/demoApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "STAFF" | "STUDENT" | "DELEGATE" | "PARENT";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isBeneficiary: boolean;
};

type StoredAuth = {
  user: AuthUser;
  accessToken: string | null;
};

type AuthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated"; error?: string };

type AuthContextValue = {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (options: {
    email: string;
    password?: string;
    fullName: string;
    role: "STUDENT" | "PARENT";
    allergenIds: string[];
  }) => Promise<void>;
  logout: () => void;
  /** Headers required by mockAuthMiddleware */
  authHeaders: Record<string, string>;
};

// ─── Storage key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "cafes_auth";

function persist(auth: StoredAuth) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

function hydrate(): StoredAuth | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser | StoredAuth;
    if ("user" in parsed) return parsed;
    return { user: parsed, accessToken: null };
  } catch {
    return null;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => hydrate()?.accessToken ?? null);
  const [state, setState] = useState<AuthState>(() => {
    const saved = hydrate();
    return saved ? { status: "authenticated", user: saved.user } : { status: "unauthenticated" };
  });

  // Derive auth headers from current user
  const authHeaders: Record<string, string> =
    state.status === "authenticated"
      ? {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          "x-user-id": state.user.id,
          "x-user-role": state.user.role,
          "x-user-beneficiary": state.user.isBeneficiary ? "true" : "false",
        }
      : {};

  const login = useCallback(async (email: string, password: string) => {
    setState({ status: "loading" });
    if (import.meta.env.VITE_DEMO_MODE === "true") {
      const user = demoUsers[email.toLowerCase() as keyof typeof demoUsers];
      if (!user || password !== "demo") {
        setState({ status: "unauthenticated", error: "Selecciona uno de los perfiles de demostración." });
        return;
      }
      persist({ user, accessToken: null });
      setAccessToken(null);
      setState({ status: "authenticated", user });
      return;
    }
    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        const fallbackError =
          res.status === 401
            ? "Credenciales incorrectas"
            : res.status === 404 || res.status === 502 || res.status === 503
              ? "Backend no disponible. Ejecuta `npm run dev:kiosk` en la raíz del proyecto."
              : "No se pudo conectar con el backend. Verifica que esté iniciado.";
        setState({
          status: "unauthenticated",
          error: body.message ?? fallbackError,
        });
        return;
      }

      const data = (await res.json()) as { user: AuthUser; accessToken?: string | null };
      const nextToken = data.accessToken ?? null;
      setAccessToken(nextToken);
      persist({ user: data.user, accessToken: nextToken });
      setState({ status: "authenticated", user: data.user });
    } catch {
      setState({ status: "unauthenticated", error: "Error de red. Inténtalo de nuevo." });
    }
  }, []);

  const register = useCallback(
    async ({ email, password, fullName, role, allergenIds }: {
      email: string;
      password?: string;
      fullName: string;
      role: "STUDENT" | "PARENT";
      allergenIds: string[];
    }) => {
      setState({ status: "loading" });
      try {
        const res = await fetch(apiUrl("/api/auth/register"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName, role, allergenIds }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          setState({
            status: "unauthenticated",
            error: body.message ?? "No se pudo crear la cuenta.",
          });
          return;
        }

        const data = (await res.json()) as { user: AuthUser; accessToken?: string | null };
        const nextToken = data.accessToken ?? null;
        setAccessToken(nextToken);
        persist({ user: data.user, accessToken: nextToken });
        setState({ status: "authenticated", user: data.user });
      } catch {
        setState({ status: "unauthenticated", error: "Error de red. Inténtalo de nuevo." });
      }
    },
    []
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAccessToken(null);
    setState({ status: "unauthenticated" });
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, register, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
