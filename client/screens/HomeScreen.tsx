import { useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";
import { useCart } from "../context/CartContext";
import ProductDetail, { type AddToCartPayload, defaultModifierGroups, resolveAllergenChips } from "../components/ProductDetail";
import { resolveSanitaryInfoReact } from "../lib/sanitary";
import { resolveProductInfo, type ProductInfo } from "../lib/productInfo";
import { productCategory } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl?: string | null;
  productInfo?: ProductInfo | null;
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

function productImageUrl(productId: string, productName: string, imageUrl?: string | null) {
  if (imageUrl?.trim()) return imageUrl.trim();

  const lowerName = productName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (lowerName.includes("zumo") || lowerName.includes("jugo") || lowerName.includes("bebida") || lowerName.includes("agua") || lowerName.includes("refresco")) {
    return "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80";
  }
  if (lowerName.includes("cafe")) {
    return "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80";
  }
  if (lowerName.includes("croissant")) {
    return "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80";
  }
  if (lowerName.includes("sandwich") || lowerName.includes("sándwich")) {
    return "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80";
  }
  if (lowerName.includes("bocadillo")) {
    return "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80";
  }
  if (lowerName.includes("tortilla")) {
    return "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80";
  }
  if (lowerName.includes("galleta") || lowerName.includes("snack")) {
    return "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=800&q=80";
  }
  const fallback = Number.parseInt(productId.slice(0, 2), 16) % 2;
  return fallback === 0
    ? "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80"
    : "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80";
}

function money(value: number) {
  return value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function readableIngredient(value: string) {
  const [main, ...rest] = value.split("(");
  return {
    title: main.trim().replace(/,$/, ""),
    detail: rest.length > 0 ? rest.join("(").replace(/\)+$/, "").trim() : "",
  };
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
  const [showProductInfo, setShowProductInfo] = useState(false);
  const [showCutoffInfo, setShowCutoffInfo] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch<ApiProductsResponse>("/api/products")
      .then((res) => setProducts(res.data.filter((product) => product.isActive !== false)))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Error al cargar productos")
      )
      .finally(() => setLoading(false));
  }, [apiFetch]);

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      if (!event.state?.komoCutoffInfo) setShowCutoffInfo(false);
      if (!event.state?.komoProductInfo) setShowProductInfo(false);
      if (!event.state?.komoProductId) setDetailProduct(null);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function pushMenuState(extraState: Record<string, unknown>) {
    window.history.pushState(
      { ...(window.history.state ?? {}), komoTab: "home", ...extraState },
      "",
      window.location.pathname
    );
  }

  function openProduct(product: ApiProduct) {
    setShowProductInfo(false);
    setDetailProduct(product);
    pushMenuState({ komoProductId: product.id });
  }

  function closeProduct() {
    setShowProductInfo(false);
    if (window.history.state?.komoProductId) {
      window.history.back();
      return;
    }
    setDetailProduct(null);
  }

  function openProductInfo() {
    setShowProductInfo(true);
    pushMenuState({ komoProductId: detailProduct?.id, komoProductInfo: true });
  }

  function closeProductInfo() {
    if (window.history.state?.komoProductInfo) {
      window.history.back();
      return;
    }
    setShowProductInfo(false);
  }

  function openCutoffInfo() {
    setShowCutoffInfo(true);
    pushMenuState({ komoCutoffInfo: true });
  }

  function closeCutoffInfo() {
    if (window.history.state?.komoCutoffInfo) {
      window.history.back();
      return;
    }
    setShowCutoffInfo(false);
  }

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
    const info = product.productInfo ?? resolveProductInfo(product.name);
    const fallbackAllergens = info
      ? [...info.alergenos, ...info.trazas].map((name) => ({ name, code: name }))
      : [];
    addLine({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: payload.qty,
      options,
      note: payload.kitchenNote,
      allergens: product.allergens?.length ? product.allergens : fallbackAllergens,
    });
    closeProduct();
  }

  // ── Product detail ────────────────────────────────────────────────────────
  if (detailProduct) {
    const sanitary = resolveSanitaryInfoReact(detailProduct.name);
    const productInfo = detailProduct.productInfo ?? resolveProductInfo(detailProduct.name);
    const nutrition = productInfo?.informacionNutricional;
    const detailAllergens =
      detailProduct.allergens && detailProduct.allergens.length > 0
        ? detailProduct.allergens.map((allergen) => allergen.name)
        : productInfo
          ? [...productInfo.alergenos, ...productInfo.trazas]
          : sanitary.alergenos;
    return (
      <>
        <ProductDetail
          product={{
            id: detailProduct.id,
            name: detailProduct.name,
            description: detailProduct.description ?? "Menú oficial escolar",
            price: detailProduct.price,
            badge: detailProduct.isOfficialMenu ? "Popular" : undefined,
            imageUrl: productImageUrl(detailProduct.id, detailProduct.name, detailProduct.imageUrl),
          }}
          allergens={resolveAllergenChips(detailAllergens)}
          modifierGroups={defaultModifierGroups({
            id: detailProduct.id,
            name: detailProduct.name,
            description: detailProduct.description ?? "",
            price: detailProduct.price,
          })}
          onBack={closeProduct}
          onInfo={openProductInfo}
          onAdd={(payload) => handleAdd(payload, detailProduct)}
        />

        {showProductInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6" data-gesture-lock="true">
            <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1C9690]">Ficha del producto</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">{productInfo?.nombre ?? detailProduct.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={closeProductInfo}
                  className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                  aria-label="Cerrar información"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Ingredientes</h3>
                  {productInfo ? (
                    <div className="mt-2 space-y-2">
                      {productInfo.ingredientes.map((ingredient) => {
                        const item = readableIngredient(ingredient);
                        return (
                          <div key={ingredient} className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-sm font-semibold capitalize text-slate-800">{item.title}</p>
                            {item.detail && (
                              <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.detail}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{sanitary.ingredientes}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Alérgenos</h3>
                  {(productInfo?.alergenos ?? sanitary.alergenos).length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(productInfo?.alergenos ?? sanitary.alergenos).map((allergen) => (
                        <span key={allergen} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No tiene alérgenos declarados.</p>
                  )}
                </div>
                {productInfo && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700">Trazas</h3>
                    {productInfo.trazas.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {productInfo.trazas.map((trace) => (
                          <span key={trace} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {trace}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">Sin trazas declaradas.</p>
                    )}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Información nutricional</h3>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">Energía</p>
                      <p className="font-bold text-slate-800">{nutrition?.kcal ?? sanitary.nutricion.kcal} kcal</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">Grasas</p>
                      <p className="font-bold text-slate-800">{nutrition?.grasas ?? sanitary.nutricion.grasas} g</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">Hidratos</p>
                      <p className="font-bold text-slate-800">{nutrition?.hidratos ?? sanitary.nutricion.hidratos} g</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">Azúcares</p>
                      <p className="font-bold text-slate-800">{nutrition?.azucares ?? sanitary.nutricion.azucares} g</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">Proteínas</p>
                      <p className="font-bold text-slate-800">{nutrition?.proteinas ?? sanitary.nutricion.proteinas} g</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">Sal</p>
                      <p className="font-bold text-slate-800">{nutrition?.sal ?? sanitary.nutricion.sal} g</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 text-sm text-slate-600">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700">Conservación</h3>
                    <p className="mt-1">{productInfo?.conservacion ?? sanitary.conservacion}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700">Caducidad</h3>
                    <p className="mt-1">{productInfo?.caducidad ?? sanitary.caducidad}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
          </div>
          <button
            type="button"
            onClick={openCutoffInfo}
            className="shrink-0 rounded-2xl bg-[#d9f4ee] px-3 py-2 text-right transition active:scale-[0.98]"
            aria-label="Ver explicación del cierre de pedidos"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#1C9690]">Cierre</p>
            <p className="text-sm font-bold tabular-nums text-slate-800">09:00</p>
          </button>
        </div>

        <div className="mb-3">
          <p className="text-xs font-medium text-slate-400">{filtered.length} disponibles</p>
        </div>

        {/* Category pills */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
          data-gesture-lock="true"
        >
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
                onClick={() => openProduct(product)}
                className="flex h-full min-h-[206px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition-transform active:scale-[0.97]"
              >
                <div className="relative h-28 shrink-0 overflow-hidden bg-gradient-to-br from-[#d9f4ee] to-[#c6efe7]">
                  <img
                    src={productImageUrl(product.id, product.name, product.imageUrl)}
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

      {showCutoffInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" data-gesture-lock="true">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1C9690]">Cortes por turno</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Sistema de tiempos</h2>
              </div>
              <button
                type="button"
                onClick={closeCutoffInfo}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-lg leading-none text-slate-600 transition hover:bg-slate-200"
                aria-label="Cerrar explicación"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-slate-600">
              <p>Las reservas se pueden hacer fuera del horario escolar, pero cada turno tiene una hora máxima.</p>
              <div className="grid gap-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">Turno mañana</p>
                  <p>Pedidos hasta las 09:00.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">Turno tarde</p>
                  <p>Pedidos hasta las 15:00.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">Turno noche</p>
                  <p>Pedidos hasta las 18:00.</p>
                </div>
              </div>
              <p>Los cambios de primera a segunda hora se tratan dentro del margen operativo del centro.</p>
              <p>Si cancelas antes del corte de tu turno, el importe vuelve al monedero. Después del corte, el pedido queda planificado para cocina.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
