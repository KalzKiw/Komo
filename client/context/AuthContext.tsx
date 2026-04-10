import { createContext, useCallback, useContext, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "STAFF" | "STUDENT" | "DELEGATE" | "PARENT";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isBeneficiary: boolean;
};

type AuthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated"; error?: string };

type AuthContextValue = {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Headers required by mockAuthMiddleware */
  authHeaders: Record<string, string>;
};

// ─── Storage key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "cafes_auth";

function persist(user: AuthUser) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function hydrate(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const saved = hydrate();
    return saved ? { status: "authenticated", user: saved } : { status: "unauthenticated" };
  });

  // Derive auth headers from current user
  const authHeaders: Record<string, string> =
    state.status === "authenticated"
      ? {
          "x-user-id": state.user.id,
          "x-user-role": state.user.role,
          "x-user-beneficiary": state.user.isBeneficiary ? "true" : "false",
        }
      : {};

  const login = useCallback(async (email: string, password: string) => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        const fallbackError =
          res.status === 401
            ? "Credenciales incorrectas"
            : "No se pudo conectar con el backend. Verifica que esté iniciado.";
        setState({
          status: "unauthenticated",
          error: body.message ?? fallbackError,
        });
        return;
      }

      const data = (await res.json()) as { user: AuthUser };
      persist(data.user);
      setState({ status: "authenticated", user: data.user });
    } catch {
      setState({ status: "unauthenticated", error: "Error de red. Inténtalo de nuevo." });
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState({ status: "unauthenticated" });
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
