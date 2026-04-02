import { useEffect, useState } from "react";
import { Copy, Check, RefreshCw, Plus, Users } from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { money } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LinkedChild {
  linkId: string;
  studentId: string;
  studentName: string;
  walletBalance: number;
}

interface TokenResponse {
  tokenCode: string;
  expiresAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tokenExpiryLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expirado";
  const min = Math.floor(ms / 60000);
  return `Expira en ${min} min`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ParentFamilyManager() {
  const { apiFetch } = useApi();

  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rechargeId, setRechargeId] = useState<string | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState("5.00");
  const [recharging, setRecharging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: LinkedChild[] }>("/api/family/children")
      .then((res) => setChildren(res.data))
      .catch(() => setChildren([]))
      .finally(() => setLoadingChildren(false));
  }, [apiFetch]);

  async function generateToken() {
    setGeneratingToken(true);
    setError(null);
    try {
      const res = await apiFetch<TokenResponse>("/api/family/token", { method: "POST" });
      setToken(res);
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar código");
    } finally {
      setGeneratingToken(false);
    }
  }

  function copyToken() {
    if (!token) return;
    navigator.clipboard.writeText(token.tokenCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleRecharge(child: LinkedChild) {
    const amount = parseFloat(rechargeAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setRecharging(true);
    setError(null);
    try {
      const res = await apiFetch<{ newBalance: number }>("/api/family/topup", {
        method: "POST",
        body: JSON.stringify({ studentId: child.studentId, amount }),
      });
      setChildren((prev) =>
        prev.map((c) =>
          c.studentId === child.studentId ? { ...c, walletBalance: res.newBalance } : c
        )
      );
      setRechargeId(null);
      setRechargeAmount("5.00");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al recargar");
    } finally {
      setRecharging(false);
    }
  }

  return (
    <div
      className="flex h-full flex-col overflow-y-auto bg-gray-50 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="space-y-4 px-4 py-5">

        {/* ── Generate linking code ──────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="px-4 pb-2 pt-4">
            <h2 className="text-base font-bold text-slate-900">Código de vinculación</h2>
            <p className="mt-0.5 text-sm text-slate-400">
              Genera un código temporal para que tu hijo lo introduzca en su dispositivo.
            </p>
          </div>

          {error && (
            <p className="px-4 pb-2 text-sm text-red-500">{error}</p>
          )}

          {token ? (
            <div className="px-4 pb-5 pt-3">
              <div className="flex items-center justify-center rounded-2xl bg-emerald-50 py-6">
                <span className="select-all font-mono text-4xl font-black tracking-[0.18em] text-emerald-700">
                  {token.tokenCode}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">{tokenExpiryLabel(token.expiresAt)}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyToken}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition-all active:scale-95 hover:bg-slate-200"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "¡Copiado!" : "Copiar"}
                  </button>
                  <button
                    type="button"
                    onClick={generateToken}
                    disabled={generatingToken}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition-all active:scale-95 hover:bg-slate-200 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Nuevo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-5 pt-3">
              <button
                type="button"
                onClick={generateToken}
                disabled={generatingToken}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-60"
              >
                {generatingToken ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Generar código
              </button>
            </div>
          )}
        </div>

        {/* ── Linked students ─────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <h2 className="text-base font-bold text-slate-900">Hijos vinculados</h2>
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <Users className="h-3 w-3" />
              {children.length}
            </span>
          </div>

          {loadingChildren ? (
            <div className="flex justify-center py-8">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
            </div>
          ) : children.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-400">
              <span className="text-3xl">👨‍👧‍👦</span>
              <p className="text-sm">Aún no tienes hijos vinculados.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 pb-2">
              {children.map((child) => (
                <li key={child.studentId} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{child.studentName}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Saldo:{" "}
                        <span className="font-semibold text-emerald-600">{money(child.walletBalance)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRechargeId(rechargeId === child.studentId ? null : child.studentId)}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all active:scale-95 hover:bg-emerald-100"
                    >
                      Recargar
                    </button>
                  </div>

                  {rechargeId === child.studentId && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                      <span className="text-sm text-slate-500">€</span>
                      <input
                        type="number"
                        min="0.50"
                        step="0.50"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        className="w-24 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        disabled={recharging}
                        onClick={() => handleRecharge(child)}
                        className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-sm font-bold text-white transition-all active:scale-95 hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {recharging ? "..." : "Confirmar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRechargeId(null)}
                        className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm text-slate-500 transition-all active:scale-95 hover:bg-slate-200"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

