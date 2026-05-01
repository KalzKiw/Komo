import { useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";
import { useCart } from "../context/CartContext";
import ProductDetail, { type AddToCartPayload, defaultModifierGroups, resolveAllergenChips } from "../components/ProductDetail";
import { resolveSanitaryInfoReact } from "../lib/sanitary";
import { productCategory } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  allergens?: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  isOfficialMenu?: boolean;
};

type ApiProductsResponse = {
  data: ApiProduct[];
};

type Category = "ALL" | "BOCADILLO" | "BEBIDA" | "SNACK";

const CATEGORIES: Array<{ id: Category; label: string }> = [
  { id: "ALL", label: "Todos" },
  { id: "BOCADILLO", label: "Bocadillos" },
  { id: "BEBIDA", label: "Bebidas" },
  { id: "SNACK", label: "Snacks" },
];

function productImageUrl(productId: string) {
  const seed = productId.slice(0, 8);
  return `https://picsum.photos/seed/${seed}/800/500`;
}

function money(value: number) {
  return value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { apiFetch } = useApi();
  const { addLine } = useCart();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("ALL");
  const [detailProduct, setDetailProduct] = useState<ApiProduct | null>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch<ApiProductsResponse>("/api/products")
      .then((res) => setProducts(res.data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Error al cargar productos")
      )
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const filtered =
    category === "ALL"
      ? products
      : products.filter((p) => productCategory(p) === category);

  function handleAdd(payload: AddToCartPayload, product: ApiProduct) {
    const options = [
      ...payload.exclusions.map((x) => `Sin ${x}`),
      ...payload.extras.map((x) => `+ ${x.label}`),
      ...Object.values(payload.requiredChoices),
    ];
    addLine({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: payload.qty,
      options,
      note: payload.kitchenNote,
    });
    setDetailProduct(null);
  }

  // ── Product detail ────────────────────────────────────────────────────────
  if (detailProduct) {
    const sanitary = resolveSanitaryInfoReact(detailProduct.name);
    return (
      <>
        <ProductDetail
          product={{
            id: detailProduct.id,
            name: detailProduct.name,
            description: detailProduct.description ?? "Menú oficial escolar",
            price: detailProduct.price,
            badge: detailProduct.isOfficialMenu ? "Popular" : undefined,
            imageUrl: productImageUrl(detailProduct.id),
          }}
          allergens={resolveAllergenChips(sanitary.alergenos)}
          modifierGroups={defaultModifierGroups({
            id: detailProduct.id,
            name: detailProduct.name,
            description: detailProduct.description ?? "",
            price: detailProduct.price,
          })}
          onBack={() => setDetailProduct(null)}
          onAdd={(payload) => handleAdd(payload, detailProduct)}
        />
      </>
    );
  }

  // ── Product list ──────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="shrink-0 bg-white px-4 pt-4 pb-3 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <img
              src="/logotipo-transparente.png"
              alt="KOMO"
              className="h-11 w-auto object-contain"
            />
            <p className="mt-1 text-xs font-medium text-slate-400">Cafetería Escolar Digital</p>
          </div>
          <div className="shrink-0 rounded-2xl bg-[#d9f4ee] px-3 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#1C9690]">Cierre</p>
            <p className="text-sm font-bold tabular-nums text-slate-800">09:05</p>
          </div>
        </div>

        <div className="mb-3 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Productos</h1>
            <p className="text-xs text-slate-400">{filtered.length} disponibles</p>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                category === cat.id
                  ? "bg-[#1C9690] text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 [&::-webkit-scrollbar]:hidden">
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl bg-red-50 p-4 text-center text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-2 text-center text-slate-400">
            <span className="text-4xl">🍽️</span>
            <p className="text-sm font-semibold">Sin productos en esta categoría</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-2 items-stretch gap-3">
            {filtered.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => setDetailProduct(product)}
                className="flex h-full min-h-[206px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition-transform active:scale-[0.97]"
              >
                <div className="relative h-28 shrink-0 overflow-hidden bg-gradient-to-br from-[#d9f4ee] to-[#c6efe7]">
                  <img
                    src={productImageUrl(product.id)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {product.isOfficialMenu && (
                    <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      Popular
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="line-clamp-2 min-h-[2.25rem] text-sm font-semibold leading-tight text-slate-800">
                    {product.name}
                  </p>
                  <p className="mt-1 min-h-[1rem] truncate text-xs text-slate-400">
                    {product.description ?? "Producto disponible"}
                  </p>
                  <p className="mt-auto pt-2 text-base font-bold tabular-nums text-[#1C9690]">
                    {money(product.price)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
