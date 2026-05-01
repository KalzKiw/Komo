import { useEffect, useRef, useState } from "react";
import { CheckCircle, ArrowRight, Unlink } from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { money } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LinkedState {
  linked: true;
  linkId: string;
  parentName: string;
  parentWalletBalance: number;
}

interface UnlinkedState {
  linked: false;
}

type ParentLinkResponse = LinkedState | UnlinkedState;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatToken(raw: string): string {
  const clean = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

function rawFromFormatted(formatted: string): string {
  return formatted.replace("-", "");
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function StudentFamilyLink() {
  const { apiFetch } = useApi();
  const inputRef = useRef<HTMLInputElement>(null);

  const [linkState, setLinkState] = useState<ParentLinkResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [studentBalance, setStudentBalance] = useState<number | null>(null);

  // Load current link status + student balance on mount
  useEffect(() => {
    Promise.all([
      apiFetch<ParentLinkResponse>("/api/family/my-parent"),
      apiFetch<{ walletBalance: number }>("/api/me"),
    ])
      .then(([link, me]) => {
        setLinkState(link);
        setStudentBalance(me.walletBalance);
      })
      .catch(() => setLinkState({ linked: false }))
      .finally(() => setLoadingStatus(false));
  }, [apiFetch]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6);
    setInput(formatToken(raw));
    setError(null);
  }

  async function handleSubmit() {
    const raw = rawFromFormatted(input);
    if (raw.length < 6) {
      setError("El código debe tener 6 caracteres.");
      inputRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiFetch<{ parentId: string; parentName: string }>("/api/family/link", {
        method: "POST",
        body: JSON.stringify({ tokenCode: input }),
      });
      // Re-fetch link state to get the linkId
      const updated = await apiFetch<ParentLinkResponse>("/api/family/my-parent");
      setLinkState(updated);
      void result; // used for side-effect
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código no válido o expirado.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnlink() {
    if (!linkState?.linked) return;
    try {
      await apiFetch(`/api/family/links/${linkState.linkId}`, { method: "DELETE" });
      setLinkState({ linked: false });
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desvincular");
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingStatus) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-#92dbc8 border-t-#1C9690" />
      </div>
    );
  }

  // ── Linked state ─────────────────────────────────────────────────────────
  if (linkState?.linked) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50 px-6 py-8">
        <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-sm">
          {/* Green header */}
          <div className="flex flex-col items-center bg-#1C9690 px-6 pb-8 pt-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-3 text-xl font-bold text-white">Cuenta vinculada</h2>
            <p className="mt-1 text-sm text-#c6efe7">La vinculación familiar está activa</p>
          </div>

          {/* Details */}
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vinculado con</p>
              <p className="mt-1 text-base font-bold text-slate-900">{linkState.parentName}</p>
            </div>

            {studentBalance !== null && (
              <div className="rounded-xl bg-#d9f4ee px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Saldo disponible</p>
                <p className="mt-1 text-2xl font-black tabular-nums text-#169486">
                  {money(studentBalance)}
                </p>
              </div>
            )}

            {error && <p className="text-center text-sm text-red-500">{error}</p>}

            <button
              type="button"
              onClick={handleUnlink}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 py-3 text-sm font-semibold text-red-400 transition-all active:scale-[0.97] hover:bg-red-50"
            >
              <Unlink className="h-4 w-4" />
              Desvincular cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Unlinked state — PIN entry ────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col items-center justify-start bg-gray-50 px-6 pt-10">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-#c6efe7">
            <span className="text-3xl">👨‍👧</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Vincula tu cuenta</h1>
          <p className="mt-2 text-sm text-slate-400">
            Introduce el código de 6 caracteres que te ha enviado tu padre o madre.
          </p>
        </div>

        {/* PIN input */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="px-5 pb-5 pt-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Código de vinculación
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              value={input}
              onChange={handleInput}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="XXX-XXX"
              maxLength={7}
              className={`mt-3 w-full rounded-2xl border-2 bg-gray-50 px-5 py-4 text-center font-mono text-3xl font-black tracking-[0.25em] text-slate-900 outline-none transition-colors placeholder:text-slate-300 focus:bg-white ${
                error
                  ? "border-red-300 focus:border-red-400"
                  : "border-transparent focus:border-#44b6a1"
              }`}
            />
            {error && (
              <p className="mt-2 text-center text-sm font-medium text-red-500">{error}</p>
            )}
          </div>

          {/* Submit */}
          <div className="px-5 pb-5">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || rawFromFormatted(input).length < 6}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-#1C9690 py-3.5 font-bold text-white transition-all hover:bg-#169486 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  <span>Vincular cuenta</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          El código es válido durante <strong>15 minutos</strong>. Pide uno nuevo si expira.
        </p>
      </div>
    </div>
  );
}
