import { useEffect, useRef, useState } from "react";
import { CheckCircle, ArrowRight, MoreHorizontal, Link2Off } from "lucide-react";
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
  const [actionsParent, setActionsParent] = useState<null | {
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
      setActionsParent(null);
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
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#92dbc8] border-t-[#1C9690]" />
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
      <div className="space-y-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-[#d9f4ee]">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9f4ee] text-[#169486]">
              <CheckCircle className="h-5 w-5" />
            </span>
            <p className="text-sm font-bold text-slate-900">Familiar vinculado</p>
          </div>

          <div className="space-y-3">
            {parents.map((parent) => (
              <div key={parent.linkId} className="flex items-center gap-3 rounded-2xl border border-[#d9f4ee] bg-[#f8fffd] px-3 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[#169486] shadow-sm">
                  {parent.parentName
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{parent.parentName}</p>
                  <p className="text-[11px] font-semibold text-[#169486]">Familiar autorizado</p>
                  <p className="text-[11px] text-slate-400">Puede recargar y supervisar tu monedero.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActionsParent({
                    linkId: parent.linkId,
                    parentName: parent.parentName,
                  })}
                  aria-label={`Opciones de ${parent.parentName}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition active:scale-95 hover:text-slate-600"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {studentBalance !== null && (
          <div className="rounded-3xl bg-[#f0fbf8] border border-[#c6efe7] p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#169486]">Saldo disponible</p>
            <p className="mt-2 font-mono text-2xl font-black tabular-nums text-[#169486]">{money(studentBalance)}</p>
          </div>
        )}

        {error && <p className="text-center text-sm font-semibold text-red-500">{error}</p>}

        <button
          type="button"
          onClick={() => setLinkState({ linked: false })}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 transition-all active:scale-[0.97] hover:bg-slate-200"
        >
          <ArrowRight className="h-4 w-4" />
          Vincular otro familiar
        </button>
      </div>

        {actionsParent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-5 backdrop-blur-[2px]">
            <div className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-2xl">
              <div className="mb-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Opciones</p>
                <h2 className="mt-1 truncate text-base font-black text-slate-900">{actionsParent.parentName}</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingUnlink(actionsParent);
                  setActionsParent(null);
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-left text-sm font-bold text-red-500 transition active:scale-[0.98]"
              >
                <Link2Off className="h-4 w-4" />
                Desvincular familiar
              </button>
              <button
                type="button"
                onClick={() => setActionsParent(null)}
                className="mt-2 w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition active:scale-[0.98]"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {pendingUnlink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-5 backdrop-blur-[2px]">
            <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
              <h2 className="text-lg font-black text-slate-900">Quitar familiar</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Vas a desvincular a <strong className="text-slate-700">{pendingUnlink?.parentName}</strong>.
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
                  onClick={() => pendingUnlink && handleUnlink(pendingUnlink.linkId)}
                  className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition active:scale-[0.98]"
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>
        )}
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
