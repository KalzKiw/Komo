import { useEffect, useState } from "react";
import { ChevronRight, Unlink, Users, Wallet, Search } from "lucide-react";
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
  const [pendingUnlink, setPendingUnlink] = useState<LinkRow | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: LinkRow[] }>("/api/admin/family")
      .then((res) => setRows(res.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const familyGroups = rows.reduce((map, row) => {
    const current = map.get(row.parentId) ?? {
      parentId: row.parentId,
      parentName: row.parentName,
      parentWallet: row.parentWallet,
      links: [] as LinkRow[],
    };
    current.links.push(row);
    map.set(row.parentId, current);
    return map;
  }, new Map<string, { parentId: string; parentName: string; parentWallet: number; links: LinkRow[] }>());

  const families = Array.from(familyGroups.values()).sort((a, b) => a.parentName.localeCompare(b.parentName));
  const filtered = search.trim()
    ? families.filter((family) => {
        const q = search.toLowerCase();
        return (
          family.parentName.toLowerCase().includes(q) ||
          family.links.some((link) => link.studentName.toLowerCase().includes(q))
        );
      })
    : families;
  const selectedFamily = selectedParentId ? families.find((family) => family.parentId === selectedParentId) ?? null : null;

  async function handleUnlink(linkId: string) {
    setUnlinking(linkId);
    setError(null);
    try {
      await apiFetch(`/api/family/links/${linkId}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.linkId !== linkId));
      setPendingUnlink(null);
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
            <span className="h-7 w-7 animate-spin rounded-full border-4 border-[#92dbc8] border-t-[#1C9690]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
            <Users className="h-8 w-8 opacity-40" />
            <p className="text-sm font-semibold">Sin resultados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((family) => {
              const totalStudentBalance = family.links.reduce((sum, link) => sum + link.studentWallet, 0);
              const activeLinks = family.links.filter((link) => link.status === "ACTIVE").length;
              return (
              <button
                key={family.parentId}
                type="button"
                onClick={() => setSelectedParentId(family.parentId)}
                className="w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm transition active:scale-[0.99] hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3 px-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                        {family.parentName[0]}
                      </div>
                      <p className="truncate text-sm font-bold text-slate-900">{family.parentName}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 pl-10">
                      <span className="inline-flex items-center rounded-full bg-[#d9f4ee] px-2.5 py-1 text-xs font-semibold text-[#169486]">
                        {activeLinks} {activeLinks === 1 ? "hijo" : "hijos"}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-slate-400">
                        <Wallet className="h-3 w-3" />
                        {money(totalStudentBalance)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-slate-300" />
                </div>

                <div className="h-1 w-full bg-[#44b6a1]" />
              </button>
            );})}
          </div>
        )}
      </div>

      {selectedFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-5 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#169486]">Familia</p>
                <h2 className="mt-1 text-lg font-black text-slate-900">{selectedFamily.parentName}</h2>
                <p className="mt-1 text-xs text-slate-400">{selectedFamily.links.length} vínculos familiares</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedParentId(null)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {selectedFamily.links.map((row) => (
                <div key={row.linkId} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{row.studentName}</p>
                      <p className="font-mono text-sm font-black tabular-nums text-[#169486]">{money(row.studentWallet)}</p>
                    </div>
                    <button
                      type="button"
                      disabled={unlinking === row.linkId}
                      onClick={() => setPendingUnlink(row)}
                      className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-500 transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50"
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
              ))}
            </div>
          </div>
        </div>
      )}

      {pendingUnlink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-5 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Unlink className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-black text-slate-900">Desvincular familiar</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Vas a eliminar el vínculo entre{" "}
              <strong className="text-slate-700">{pendingUnlink.parentName}</strong> y{" "}
              <strong className="text-slate-700">{pendingUnlink.studentName}</strong>.
              Esta acción retirará el acceso familiar a pedidos, alérgenos y monedero.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPendingUnlink(null)}
                disabled={unlinking === pendingUnlink.linkId}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition active:scale-[0.98] disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleUnlink(pendingUnlink.linkId)}
                disabled={unlinking === pendingUnlink.linkId}
                className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {unlinking === pendingUnlink.linkId ? "Quitando..." : "Desvincular"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
