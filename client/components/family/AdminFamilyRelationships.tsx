import { useEffect, useState } from "react";
import { Unlink, Users, Wallet, Search } from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { money } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LinkRow {
  linkId: string;
  status: string;
  parentId: string;
  parentName: string;
  parentWallet: number;
  studentId: string;
  studentName: string;
  studentWallet: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminFamilyRelationships() {
  const { apiFetch } = useApi();
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: LinkRow[] }>("/api/admin/family")
      .then((res) => setRows(res.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const filtered = search.trim()
    ? rows.filter((r) => {
        const q = search.toLowerCase();
        return (
          r.parentName.toLowerCase().includes(q) ||
          r.studentName.toLowerCase().includes(q)
        );
      })
    : rows;

  async function handleUnlink(linkId: string) {
    setUnlinking(linkId);
    setError(null);
    try {
      await apiFetch(`/api/family/links/${linkId}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.linkId !== linkId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desvincular");
    } finally {
      setUnlinking(null);
    }
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  const activeRows = rows.filter((r) => r.status === "ACTIVE");
  const uniqueParents = new Set(rows.map((r) => r.parentId)).size;
  const totalBalance = rows.reduce((acc, r) => acc + r.studentWallet, 0);

  return (
    <div
      className="flex h-full flex-col overflow-y-auto bg-gray-50 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="space-y-4 px-4 py-5">

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Familias", value: String(uniqueParents), icon: "🏠" },
            { label: "Vínculos", value: String(activeRows.length), icon: "🎒" },
            { label: "Saldo total", value: money(totalBalance), icon: "💳" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center rounded-2xl bg-white py-3 shadow-sm">
              <span className="text-xl">{stat.icon}</span>
              <span className="mt-1 text-base font-black tabular-nums text-slate-900">{stat.value}</span>
              <span className="text-[10px] font-semibold text-slate-400">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* ── Search ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-slate-300" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre de padre o alumno…"
            className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
          />
        </div>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        {/* ── List ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="h-7 w-7 animate-spin rounded-full border-4 border-[#92dbc8] border-t-#1C9690" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
            <Users className="h-8 w-8 opacity-40" />
            <p className="text-sm font-semibold">Sin resultados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((row) => (
              <div
                key={row.linkId}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 px-4 py-4">
                  {/* Parent + Student */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                        {row.parentName[0]}
                      </div>
                      <p className="truncate text-sm font-bold text-slate-900">{row.parentName}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2 pl-10">
                      <span className="inline-flex items-center rounded-full bg-[#d9f4ee] px-2.5 py-1 text-xs font-semibold text-[#169486]">
                        {row.studentName}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-slate-400">
                        <Wallet className="h-3 w-3" />
                        {money(row.studentWallet)}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <button
                      type="button"
                      disabled={unlinking === row.linkId}
                      onClick={() => handleUnlink(row.linkId)}
                      className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50"
                    >
                      {unlinking === row.linkId ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300 border-t-red-500" />
                      ) : (
                        <Unlink className="h-3 w-3" />
                      )}
                      Desvincular
                    </button>
                  </div>
                </div>

                {/* Status stripe */}
                <div
                  className={`h-1 w-full ${
                    row.status === "ACTIVE"
                      ? "bg-[#44b6a1]"
                      : "bg-red-300"
                  }`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
