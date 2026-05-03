import { createContext, useCallback, useContext, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CartLine = {
  /** product id */
  id: string;
  /** unique key: productId::options::note */
  signature: string;
  name: string;
  price: number;
  qty: number;
  options: string[];
  note: string;
  allergens?: Array<{ id?: string; code?: string; name: string }>;
};

type CartContextValue = {
  cart: CartLine[];
  addLine: (line: Omit<CartLine, "signature">) => void;
  addWithSignature: (line: CartLine) => void;
  updateQty: (signature: string, delta: number) => void;
  clear: () => void;
  total: number;
  itemCount: number;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);

  const addWithSignature = useCallback((line: CartLine) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.signature === line.signature);
      if (existing) {
        return prev.map((l) =>
          l.signature === line.signature ? { ...l, qty: l.qty + line.qty } : l
        );
      }
      return [...prev, line];
    });
  }, []);

  const addLine = useCallback(
    (line: Omit<CartLine, "signature">) => {
      const sig = `${line.id}::${line.options.join("|")}::${line.note}`;
      addWithSignature({ ...line, signature: sig });
    },
    [addWithSignature]
  );

  const updateQty = useCallback((signature: string, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((l) => (l.signature === signature ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0);
      return updated;
    });
  }, []);

  const clear = useCallback(() => setCart([]), []);

  const total = cart.reduce((sum, l) => sum + l.price * l.qty, 0);
  const itemCount = cart.reduce((sum, l) => sum + l.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addLine, addWithSignature, updateQty, clear, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
