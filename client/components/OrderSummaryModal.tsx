import React from "react";

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  customizations?: string[];
  kitchenNote?: string;
}

interface OrderSummaryModalProps {
  open: boolean;
  items: OrderItem[];
  total: number;
  feedback: string;
  onClose: () => void;
  onGoToOrders: () => void;
}

const OrderSummaryModal: React.FC<OrderSummaryModalProps> = ({
  open,
  items,
  total,
  feedback,
  onClose,
  onGoToOrders,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-7 flex flex-col">
        <h2 className="font-extrabold text-2xl mb-2 text-#169486 text-center">
          {feedback && feedback.includes("añadido al carrito") ? "Repetir pedido" : "¡Pedido realizado!"}
        </h2>
        {/* Feedback solo si es error, no si es éxito */}
        {feedback && !feedback.includes("✓") && (
          <p className="text-center text-red-500 mb-4">{feedback}</p>
        )}
        <div className="mb-6 mt-2">
          <h3 className="font-semibold mb-3 text-slate-700 text-base">Resumen del pedido</h3>
          {(!items || items.length === 0) ? (
            <div className="text-center text-slate-400 py-4">No hay productos en el pedido.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <li key={idx} className="py-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-800">{item.name} <span className="text-xs text-slate-500">x{item.quantity}</span></span>
                    <span className="text-base font-semibold text-slate-900">{item.unitPrice.toFixed(2)}€</span>
                  </div>
                  {item.customizations && item.customizations.length > 0 && (
                    <ul className="ml-4 mt-1 mb-1 list-disc text-xs text-slate-500">
                      {item.customizations.map((c, i) => {
                        // Limpieza: quitar duplicados de 'Sin ', quitar '+', y trim
                        let text = c.trim();
                        if (text.startsWith('Sin Sin ')) text = text.replace(/^Sin /, '');
                        if (text.startsWith('Sin ')) text = text;
                        if (text.startsWith('+')) text = text.replace(/^\+\s*/, '');
                        return <li key={i} className="leading-tight">{text}</li>;
                      })}
                    </ul>
                  )}
                  {item.kitchenNote && (
                    <div className="text-xs text-slate-400 ml-2">Nota: {item.kitchenNote}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-between mt-6 items-center">
            <span className="text-lg font-bold text-slate-700">Total</span>
            <span className="text-2xl font-extrabold text-#169486">{total.toFixed(2)}€</span>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            className="flex-1 rounded-xl bg-slate-200 py-2 font-semibold text-slate-700 hover:bg-slate-300 transition"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            className="flex-1 rounded-xl bg-#1C9690 py-2 font-semibold text-white hover:bg-#169486 transition"
            onClick={onGoToOrders}
          >
            Ir a pedidos
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryModal;
