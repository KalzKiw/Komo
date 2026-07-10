import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiUrl } from "../lib/api";
import { demoApi } from "../lib/demoApi";

/**
 * Returns a `apiFetch` wrapper that automatically injects auth headers
 * and throws on non-ok responses with the API error message.
 */
export function useApi() {
  const { authHeaders } = useAuth();

  const apiFetch = useCallback(
    async <T>(input: string, init: RequestInit = {}): Promise<T> => {
      if (import.meta.env.VITE_DEMO_MODE === "true") {
        return demoApi<T>(input, init);
      }
      const res = await fetch(apiUrl(input), {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
          ...(init.headers as Record<string, string> | undefined),
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }

      return res.json() as Promise<T>;
    },
    [authHeaders]
  );

  return { apiFetch };
}
