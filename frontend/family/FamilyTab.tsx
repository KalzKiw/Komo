import { useMemo, useState } from "react";
import type { ReactElement } from "react";

import ParentOrderApprovalCard from "./ParentOrderApprovalCard";
import type { FamilyLink, Order, User } from "./models";

type FamilyTabProps = {
  currentUser: User;
  parentLink: FamilyLink | null;
  linkedChildren: User[];
  pendingApprovalOrders: Array<{ order: Order; childName: string }>;
};

function centsToEur(value: number): string {
  return `${(value / 100).toFixed(2)} EUR`;
}

export default function FamilyTab({
  currentUser,
  parentLink,
  linkedChildren,
  pendingApprovalOrders
}: FamilyTabProps): ReactElement {
  const [localChildren, setLocalChildren] = useState<User[]>(linkedChildren);
  const [orders, setOrders] = useState(pendingApprovalOrders);
  const [tokenInput, setTokenInput] = useState("");
  const [childWallet, setChildWallet] = useState(currentUser.walletBalanceCents);
  const [linkedParentName, setLinkedParentName] = useState<string | null>(
    currentUser.role === "HIJO" && parentLink?.status === "ACTIVE" ? "Carmen Perez" : null
  );

  const isParent = currentUser.role === "PADRE";
  const isChildLinked = currentUser.role === "HIJO" && linkedParentName !== null;

  const pendingCount = useMemo(() => orders.length, [orders]);

  function handleRecharge(childId: string): void {
    setLocalChildren((prev) =>
      prev.map((child) => (child.id === childId ? { ...child, walletBalanceCents: child.walletBalanceCents + 500 } : child))
    );
  }

  function handleApprove(orderId: string): void {
    setOrders((prev) => prev.filter((entry) => entry.order.id !== orderId));
  }

  function handleReject(orderId: string): void {
    setOrders((prev) => prev.filter((entry) => entry.order.id !== orderId));
  }

  function handleLinkSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (tokenInput.trim().length < 6) {
      return;
    }

    setLinkedParentName("Carmen Perez");
    setTokenInput("");
    setChildWallet((wallet) => wallet + 350);
  }

  if (isParent) {
    return (
      <section className="space-y-4 pb-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-500">Token de vinculacion</p>
          <p className="mt-2 inline-flex rounded-lg bg-slate-900 px-3 py-2 font-mono text-sm font-semibold text-slate-100">
            {parentLink?.linkToken ?? "SIN-TOKEN"}
          </p>
          <p className="mt-2 text-xs text-slate-500">Comparte este token con tu hijo para vincular cuentas.</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <h3 className="text-sm font-semibold text-slate-900">Hijos vinculados</h3>
          <div className="mt-3 space-y-2">
            {localChildren.length === 0 ? (
              <p className="text-sm text-slate-500">Todavia no hay hijos vinculados.</p>
            ) : (
              localChildren.map((child) => (
                <div key={child.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{child.fullName}</p>
                    <p className="text-xs text-slate-500">Saldo: {centsToEur(child.walletBalanceCents)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRecharge(child.id)}
                    className="rounded-lg bg-#1C9690 px-3 py-2 text-xs font-semibold text-white hover:bg-#169486"
                  >
                    Recargar +5.00 EUR
                  </button>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Pedidos pendientes de aprobacion</h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{pendingCount}</span>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-slate-500">No hay solicitudes pendientes.</p>
            ) : (
              orders.map((entry) => (
                <ParentOrderApprovalCard
                  key={entry.order.id}
                  childName={entry.childName}
                  order={entry.order}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-4 pb-4">
      {!isChildLinked ? (
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <h3 className="text-sm font-semibold text-slate-900">Vincular con cuenta de padre</h3>
          <p className="mt-1 text-xs text-slate-500">Introduce el token compartido por tu padre.</p>

          <form className="mt-3 space-y-2" onSubmit={handleLinkSubmit}>
            <input
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="Ejemplo: FAM-84JQK1"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-#2da38f focus:ring"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-#1C9690 px-3 py-2 text-sm font-semibold text-white hover:bg-#169486"
            >
              Vincular cuenta
            </button>
          </form>
        </article>
      ) : null}

      {isChildLinked ? (
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <h3 className="text-sm font-semibold text-slate-900">Cuenta familiar vinculada</h3>
          <p className="mt-1 text-sm text-slate-600">Padre vinculado: {linkedParentName}</p>
          <div className="mt-3 rounded-lg bg-#d9f4ee p-3">
            <p className="text-xs text-#169486">Saldo actual del monedero</p>
            <p className="text-2xl font-bold text-#169486">{centsToEur(childWallet)}</p>
          </div>
        </article>
      ) : null}
    </section>
  );
}
