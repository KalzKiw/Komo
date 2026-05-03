import { useEffect, useRef, useState } from "react";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { money } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LinkedState {
  linked: true;
  linkId: string;
  parentName: string;
  parentWalletBalance: number;
  parents?: Array<{
    linkId: string;
    parentId: string;
    parentName: string;
    parentWalletBalance: number;
  }>;
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
  const [pendingUnlink, setPendingUnlink] = useState<null | {
    linkId: string;
    parentName: string;
  }>(null);

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

  async function handleUnlink(linkId?: string) {
    if (!linkState?.linked) return;
    try {
      await apiFetch(`/api/family/links/${linkId ?? linkState.linkId}`, { method: "DELETE" });
      const updated = await apiFetch<ParentLinkResponse>("/api/family/my-parent");
      setLinkState(updated);
      setPendingUnlink(null);
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desvincular");
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingStatus) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#92dbc8] border-t-#1C9690" />
      </div>
    );
  }

  // ── Linked state ─────────────────────────────────────────────────────────
  if (linkState?.linked) {
    const parents = linkState.parents?.length
      ? linkState.parents
      : [{
          linkId: linkState.linkId,
          parentId: "",
          parentName: linkState.parentName,
          parentWalletBalance: linkState.parentWalletBalance,
        }];

    return (
      <div className="bg-gray-50">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="space-y-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9f4ee] text-[#169486]">
                <CheckCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">Cuenta familiar vinculada</p>
                <p className="truncate text-xs text-slate-400">
                  {parents.length} familiar{parents.length !== 1 ? "es" : ""} asociado{parents.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {parents.map((parent) => (
                <div key={parent.linkId} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-700">{parent.parentName}</p>
                    <p className="text-[11px] text-slate-400">Puede recargar y supervisar tu monedero.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingUnlink({
                      linkId: parent.linkId,
                      parentName: parent.parentName,
                    })}
                    className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-white hover:text-red-500"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>

            {studentBalance !== null && (
              <p className="rounded-xl bg-[#f0fbf8] px-3 py-2 text-xs font-semibold text-slate-500">
                Saldo disponible: <span className="font-black tabular-nums text-[#169486]">{money(studentBalance)}</span>
              </p>
            )}

            {error && <p className="text-center text-sm text-red-500">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLinkState({ linked: false })}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 transition-all active:scale-[0.97] hover:bg-slate-200"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Añadir otro familiar
              </button>
            </div>
          </div>
        </div>

        {pendingUnlink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-5 backdrop-blur-[2px]">
            <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
              <h2 className="text-lg font-black text-slate-900">Quitar familiar</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Vas a desvincular a <strong className="text-slate-700">{pendingUnlink.parentName}</strong>.
                Ya no podrá supervisar ni recargar tu monedero desde su panel.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPendingUnlink(null)}
                  className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleUnlink(pendingUnlink.linkId)}
                  className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition active:scale-[0.98]"
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Unlinked state — PIN entry ────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col items-center justify-start bg-gray-50 px-6 pt-10">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#c6efe7]">
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
                  : "border-transparent focus:border-[#44b6a1]"
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1C9690] py-3.5 font-bold text-white transition-all hover:bg-[#169486] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
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
