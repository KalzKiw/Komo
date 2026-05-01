import type { Order } from "./models";
import type { ReactElement } from "react";

type ParentOrderApprovalCardProps = {
  childName: string;
  order: Order;
  onApprove: (orderId: string) => void;
  onReject: (orderId: string) => void;
};

function centsToEur(value: number): string {
  return `${(value / 100).toFixed(2)} EUR`;
}

function renderAllergens(allergens: string[]): ReactElement {
  if (allergens.length === 0) {
    return <span className="text-xs text-#169486">Sin alergenos declarados</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-amber-700">Contiene:</span>
      {allergens.map((allergen) => (
        <span
          key={allergen}
          className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800"
        >
          {allergen}
        </span>
      ))}
    </div>
  );
}

export default function ParentOrderApprovalCard({
  childName,
  order,
  onApprove,
  onReject
}: ParentOrderApprovalCardProps): ReactElement {
  const firstItem = order.items[0];
  const itemCount = order.items.length;
  const title = itemCount > 1 ? `${firstItem.productName} + ${itemCount - 1} mas` : firstItem.productName;

  return (
    <article className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-md">
      <header className="mb-3">
        <p className="text-sm font-semibold text-slate-800">Nueva solicitud de {childName}</p>
        <p className="text-xs text-slate-500">{order.scheduledBreakLabel} · {new Date(order.requestedAt).toLocaleTimeString()}</p>
      </header>

      <div className="mb-4 flex gap-3">
        <img
          src={firstItem.thumbnailUrl}
          alt={firstItem.productName}
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-900">{title}</h3>
          <div className="mt-2">{renderAllergens(firstItem.allergens)}</div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{centsToEur(order.totalCents)}</p>
        </div>
      </div>

      <footer className="grid grid-cols-10 gap-2">
        <button
          type="button"
          onClick={() => onApprove(order.id)}
          className="col-span-7 rounded-lg bg-#1C9690 px-3 py-3 text-sm font-semibold text-white transition hover:bg-#169486 active:scale-[0.99]"
        >
          Aprobar y pagar ({centsToEur(order.totalCents)})
        </button>

        <button
          type="button"
          onClick={() => onReject(order.id)}
          className="col-span-3 rounded-lg border border-rose-300 bg-transparent px-3 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 active:scale-[0.99]"
        >
          Rechazar
        </button>
      </footer>
    </article>
  );
}
