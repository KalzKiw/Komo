import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Hand,
  LogOut,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  User,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useApi } from "../hooks/useApi";
import ProductDetail, {
  type AddToCartPayload,
  defaultModifierGroups,
  resolveAllergenChips,
} from "../components/ProductDetail";
import AllergenWarningModal from "../components/AllergenWarningModal";
import {
  CATEGORIES,
  filterProductsByCategory,
  isStandaloneCatalogProduct,
  productImageUrl,
  type ApiProduct,
  type Category,
} from "../lib/catalog";
import { resolveSanitaryInfoReact } from "../lib/sanitary";
import { resolveProductInfo } from "../lib/productInfo";
import { money, normalizedText } from "../lib/utils";

type KioskPhase = "idle" | "login" | "menu" | "success";

const IDLE_RESET_MS = 20_000;
const QUICK_USERS = [
  { label: "Alumno demo", email: "student1@cafes.app" },
  { label: "Padre demo", email: "parent1@cafes.app" },
];

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === "true";

interface LinkedChild {
  studentId: string;
  studentName: string;
  walletBalance: number;
}

interface AllergenWarning {
  allergenId: string;
  allergenName: string;
  allergenCode: string;
  productNames: string[];
}

interface UserAllergen {
  id: string;
  code: string;
  name: string;
}

function productInfoAllergens(product?: ApiProduct): Array<{ name: string; code?: string }> {
  if (!product?.productInfo) return [];
  return [...(product.productInfo.alergenos ?? []), ...(product.productInfo.trazas ?? [])]
    .filter(Boolean)
    .map((name) => ({ name, code: name }));
}

function isAllergenConflictMessage(message: string): boolean {
  return normalizedText(message).includes("contiene alergenos");
}

function warningFromBackendMessage(message: string): AllergenWarning {
  const [, productNamesText] = message.split(/:\s*/, 2);
  const productNames = productNamesText?.trim() ? [productNamesText.trim()] : ["Producto del pedido"];
  return {
    allergenId: "backend-allergen-warning",
    allergenName: "Alérgenos configurados",
    allergenCode: "alergenos-configurados",
    productNames,
  };
}

export default function KioskScreen() {
  const { state, login, logout } = useAuth();
  const { cart, addLine, updateQty, clear, total, itemCount } = useCart();
  const { apiFetch } = useApi();

  const [phase, setPhase] = useState<KioskPhase>("idle");
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("ALL");
  const [detailProduct, setDetailProduct] = useState<ApiProduct | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("demo");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutFeedback, setCheckoutFeedback] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const [productsMap, setProductsMap] = useState<Map<string, ApiProduct>>(new Map());
  const [userAllergens, setUserAllergens] = useState<UserAllergen[]>([]);
  const [allergenWarnings, setAllergenWarnings] = useState<AllergenWarning[]>([]);
  const [showAllergenWarning, setShowAllergenWarning] = useState(false);
  const [confirmedWarning, setConfirmedWarning] = useState(false);
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const role = state.status === "authenticated" ? state.user.role : "";
  const isAuthenticated = state.status === "authenticated";
  const isParent = role === "PARENT";
  const isConsumer = role === "STUDENT" || role === "DELEGATE" || role === "PARENT";
  const selectedChild = children.find((c) => c.studentId === selectedStudentId) ?? null;
  const parentNeedsCardPayment = Boolean(isParent && selectedChild && selectedChild.walletBalance < total);

  const filtered = filterProductsByCategory(products, category);

  const scheduleReset = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      clear();
      setDetailProduct(null);
      setCheckoutFeedback("");
      setOrderNumber(null);
      setPhase("idle");
      logout();
    }, IDLE_RESET_MS);
  }, [clear, logout]);

  const loadProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<{ data: ApiProduct[] }>("/api/products")
      .then((res) => {
        const catalog = res.data.filter(isStandaloneCatalogProduct);
        setProducts(catalog);
        setProductsMap(new Map(catalog.map((p) => [p.id, p])));
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Error al cargar productos")
      )
      .finally(() => setLoading(false));
  }, [apiFetch]);

  useEffect(() => {
    if (phase === "menu" && isAuthenticated) {
      loadProducts();
    }
  }, [phase, isAuthenticated, loadProducts]);

  useEffect(() => {
    if (!isAuthenticated || phase !== "menu") return;

    if (isParent) {
      apiFetch<{ data: LinkedChild[] }>("/api/family/children")
        .then((res) => {
          const next = res.data ?? [];
          setChildren(next);
          setSelectedStudentId((current) => current || next[0]?.studentId || "");
        })
        .catch(() => setChildren([]));
      return;
    }

    apiFetch<{ data: UserAllergen[] }>("/api/me/allergies")
      .then((res) => setUserAllergens(res.data ?? []))
      .catch(() => setUserAllergens([]));
  }, [apiFetch, isAuthenticated, isParent, phase]);

  useEffect(() => {
    if (!isParent || !selectedStudentId || phase !== "menu") return;
    apiFetch<{ data: UserAllergen[] }>(`/api/family/children/${selectedStudentId}/allergies`)
      .then((res) => setUserAllergens(res.data ?? []))
      .catch(() => setUserAllergens([]));
  }, [apiFetch, isParent, selectedStudentId, phase]);

  useEffect(() => {
    setConfirmedWarning(false);
  }, [cart, selectedStudentId, userAllergens]);

  useEffect(() => {
    if (phase === "success") scheduleReset();
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [phase, scheduleReset]);

  function handleStart() {
    if (isAuthenticated) {
      if (role === "ADMIN" || role === "STAFF") {
        logout();
        setPhase("login");
        setLoginError("El kiosko es solo para alumnos y familias.");
        return;
      }
      if (isConsumer) {
        setPhase("menu");
        return;
      }
    }
    setPhase("login");
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    await login(email.trim(), password);
    setLoginLoading(false);
  }

  useEffect(() => {
    if (phase !== "login" || loginLoading) return;
    if (state.status === "authenticated") {
      const userRole = state.user.role;
      if (userRole === "ADMIN" || userRole === "STAFF") {
        setLoginError("El kiosko es solo para alumnos y familias. Usa el panel de administración.");
        logout();
        return;
      }
      setPhase("menu");
      return;
    }
    if (state.status === "unauthenticated" && state.error) {
      setLoginError(state.error);
    }
  }, [phase, loginLoading, state, logout]);

  function handleAdd(payload: AddToCartPayload, product: ApiProduct) {
    const options = [
      ...payload.exclusions,
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
    setDetailProduct(null);
  }

  function detectAllergenWarnings(): AllergenWarning[] {
    if (userAllergens.length === 0) return [];

    const userAllergenIds = new Set(userAllergens.map((a) => a.id));
    const userAllergenKeys = new Set(
      userAllergens.flatMap((a) => [a.code, a.name].filter(Boolean).map((value) => normalizedText(value)))
    );
    const warningMap = new Map<string, AllergenWarning>();

    for (const line of cart) {
      const product = productsMap.get(line.id);
      const allergens = [
        ...(product?.allergens ?? []),
        ...productInfoAllergens(product),
        ...(line.allergens ?? []),
      ];
      if (allergens.length === 0) continue;

      for (const allergen of allergens) {
        const allergenKey = normalizedText(allergen.name);
        const allergenCodeKey = allergen.code ? normalizedText(allergen.code) : "";
        const matches =
          (allergen.id && userAllergenIds.has(allergen.id)) ||
          userAllergenKeys.has(allergenKey) ||
          (allergenCodeKey ? userAllergenKeys.has(allergenCodeKey) : false) ||
          [...userAllergenKeys].some(
            (userKey) =>
              (userKey.length > 2 && allergenKey.includes(userKey)) ||
              (allergenKey.length > 2 && userKey.includes(allergenKey)) ||
              (allergenCodeKey.length > 2 && allergenCodeKey.includes(userKey))
          );

        if (matches) {
          const key = allergen.id ?? allergenKey;
          if (!warningMap.has(key)) {
            warningMap.set(key, {
              allergenId: key,
              allergenName: allergen.name,
              allergenCode: allergen.code ?? allergen.name,
              productNames: [],
            });
          }
          const warning = warningMap.get(key)!;
          if (!warning.productNames.includes(line.name)) {
            warning.productNames.push(line.name);
          }
        }
      }
    }

    return Array.from(warningMap.values());
  }

  async function checkout(acknowledgedAllergenWarning = false) {
    if (cart.length === 0) return;
    if (isParent && !selectedStudentId) {
      setCheckoutFeedback("Selecciona un hijo para confirmar el pedido");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutFeedback("");
    try {
      const payload = {
        ...(isParent ? { studentId: selectedStudentId } : {}),
        ...(parentNeedsCardPayment ? { paymentMethod: "CARD" } : {}),
        shift: "MORNING",
        scheduledFor: new Date().toISOString().slice(0, 10),
        items: cart.map((line) => ({
          productId: line.id,
          quantity: line.qty,
          customizations: line.options ?? [],
          kitchenNote: line.note || undefined,
        })),
        acknowledgedAllergenWarning,
      };
      const res = await apiFetch<{ data?: { id?: string; pickupNumber?: number } }>("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const orderId = res.data?.id ?? "";
      const pickup =
        res.data?.pickupNumber ??
        (orderId ? 100 + (Number.parseInt(orderId.slice(0, 8), 36) % 900) : Math.floor(Math.random() * 90) + 100);
      setOrderNumber(String(pickup));
      clear();
      setShowAllergenWarning(false);
      setConfirmedWarning(false);
      setPhase("success");
      window.dispatchEvent(new Event("walletBalanceChanged"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo procesar el pedido";
      if (!acknowledgedAllergenWarning && isAllergenConflictMessage(message)) {
        const warnings = detectAllergenWarnings();
        setAllergenWarnings(warnings.length > 0 ? warnings : [warningFromBackendMessage(message)]);
        setShowAllergenWarning(true);
        setConfirmedWarning(false);
        return;
      }
      setCheckoutFeedback(message);
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleCheckoutClick() {
    const warnings = detectAllergenWarnings();
    if (warnings.length > 0 && !confirmedWarning) {
      setAllergenWarnings(warnings);
      setShowAllergenWarning(true);
      return;
    }
    await checkout(confirmedWarning);
  }

  function handleCancelSession() {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    clear();
    setDetailProduct(null);
    setCheckoutFeedback("");
    setOrderNumber(null);
    logout();
    setPhase("idle");
  }

  // ── Idle splash ────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <button
        type="button"
        onClick={handleStart}
        className="kiosk-idle relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f4b47] via-[#169486] to-[#1C9690] text-white outline-none"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-[#92dbc8]/20 blur-3xl" />
        </div>
        <img
          src="/logotipo-transparente.png"
          alt="KOMO"
          className="relative mb-10 h-24 w-auto brightness-0 invert drop-shadow-lg"
        />
        <h1 className="relative text-center font-[family-name:var(--font-headline)] text-5xl font-black tracking-tight md:text-7xl">
          ¿Listo para pedir?
        </h1>
        <p className="relative mt-4 text-xl font-medium text-white/80 md:text-2xl">
          Toca la pantalla para comenzar
        </p>
        <div className="relative mt-16 flex animate-bounce items-center gap-3 rounded-full bg-white/15 px-8 py-4 backdrop-blur-sm">
          <Hand className="h-8 w-8" />
          <span className="text-lg font-bold">Toca aquí</span>
        </div>
      </button>
    );
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  if (phase === "login") {
    return (
      <div className="flex h-full w-full bg-gradient-to-br from-slate-50 to-[#d9f4ee]">
        <div className="flex flex-1 flex-col items-center justify-center px-8">
          <img src="/logotipo-transparente.png" alt="KOMO" className="mb-8 h-16 w-auto" />
          <h2 className="mb-2 text-center font-[family-name:var(--font-headline)] text-4xl font-black text-slate-900">
            Identifícate
          </h2>
          <p className="mb-10 text-center text-lg text-slate-500">
            Introduce tus credenciales para realizar tu pedido
          </p>

          <form onSubmit={handleLogin} className="w-full max-w-lg space-y-5">
            <div>
              <label htmlFor="kiosk-email" className="mb-2 block text-sm font-semibold text-slate-600">
                Correo electrónico
              </label>
              <input
                id="kiosk-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-lg outline-none transition focus:border-[#1C9690]"
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="kiosk-password" className="mb-2 block text-sm font-semibold text-slate-600">
                Contraseña
              </label>
              <input
                id="kiosk-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-lg outline-none transition focus:border-[#1C9690]"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {loginError && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-2xl bg-[#1C9690] py-5 text-xl font-bold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60"
            >
              {loginLoading ? "Entrando..." : "Continuar al menú"}
            </button>
          </form>

          {IS_DEMO && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {QUICK_USERS.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => {
                    setEmail(user.email);
                    setPassword("demo");
                  }}
                  className="rounded-full border-2 border-[#92dbc8] bg-white px-5 py-2.5 text-sm font-semibold text-[#169486] transition hover:bg-[#f0fbf8]"
                >
                  {user.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setPhase("idle")}
            className="mt-8 text-sm font-semibold text-slate-400 transition hover:text-slate-600"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0f4b47] to-[#1C9690] text-white">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/20">
          <ShoppingBag className="h-12 w-12" />
        </div>
        <h2 className="font-[family-name:var(--font-headline)] text-5xl font-black">¡Pedido confirmado!</h2>
        <p className="mt-4 text-xl text-white/80">Recógelo en el mostrador</p>
        {orderNumber && (
          <div className="mt-10 rounded-3xl bg-white px-16 py-8 text-center shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Tu número</p>
            <p className="mt-2 font-[family-name:var(--font-headline)] text-8xl font-black text-[#1C9690]">
              {orderNumber}
            </p>
          </div>
        )}
        <p className="mt-12 text-sm text-white/60">
          La pantalla se reiniciará automáticamente en unos segundos
        </p>
        <button
          type="button"
          onClick={handleCancelSession}
          className="mt-6 rounded-2xl bg-white/15 px-8 py-4 text-lg font-bold backdrop-blur-sm transition hover:bg-white/25"
        >
          Nuevo pedido
        </button>
      </div>
    );
  }

  // ── Product detail overlay ─────────────────────────────────────────────────
  if (detailProduct) {
    const sanitary = resolveSanitaryInfoReact(detailProduct.name);
    const productInfo = detailProduct.productInfo ?? resolveProductInfo(detailProduct.name);
    const detailAllergens =
      detailProduct.allergens && detailProduct.allergens.length > 0
        ? detailProduct.allergens.map((a) => a.name)
        : productInfo
          ? [...productInfo.alergenos, ...productInfo.trazas]
          : sanitary.alergenos;

    return (
      <div className="kiosk-detail flex h-full w-full flex-col bg-white">
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
          onBack={() => setDetailProduct(null)}
          onAdd={(payload) => handleAdd(payload, detailProduct)}
        />
      </div>
    );
  }

  // ── Main menu (McDonald's-style 3-panel layout) ────────────────────────────
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-100">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between bg-[#1C9690] px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-4">
          <img src="/logotipo-transparente.png" alt="KOMO" className="h-10 w-auto brightness-0 invert" />
          <span className="hidden text-lg font-bold md:inline">Kiosko de pedidos</span>
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">
              <User className="h-5 w-5" />
              <span className="text-sm font-semibold">{state.user.fullName}</span>
            </div>
            <button
              type="button"
              onClick={handleCancelSession}
              className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/25"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Categories sidebar */}
        <aside className="flex w-52 shrink-0 flex-col gap-2 overflow-y-auto bg-white p-3 shadow-sm md:w-60">
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-5 text-left transition active:scale-[0.98] ${
                  active
                    ? "bg-[#1C9690] text-white shadow-md"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-base font-bold leading-tight">{cat.label}</span>
                {active && <ChevronRight className="ml-auto h-5 w-5 opacity-70" />}
              </button>
            );
          })}
        </aside>

        {/* Product grid */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-headline)] text-2xl font-black text-slate-900 md:text-3xl">
                {CATEGORIES.find((c) => c.id === category)?.label ?? "Menú"}
              </h2>
              <p className="text-sm text-slate-500">{filtered.length} productos disponibles</p>
            </div>
          </div>

          {loading && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-3xl bg-slate-200" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-3xl bg-red-50 p-6 text-center text-red-600">{error}</div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
              <span className="text-6xl">🍽️</span>
              <p className="text-lg font-semibold">Sin productos en esta categoría</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setDetailProduct(product)}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-sm transition active:scale-[0.97] hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#d9f4ee] to-[#c6efe7]">
                    <img
                      src={productImageUrl(product.id, product.name, product.imageUrl)}
                      alt={product.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                    {product.isOfficialMenu && (
                      <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-white shadow">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="line-clamp-2 text-base font-bold leading-snug text-slate-800 md:text-lg">
                      {product.name}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-400">
                      {product.description ?? "Producto disponible"}
                    </p>
                    <p className="mt-auto pt-3 text-xl font-black tabular-nums text-[#1C9690]">
                      {money(product.price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>

        {/* Cart sidebar */}
        <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white shadow-lg md:w-96">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <ShoppingBag className="h-6 w-6 text-[#1C9690]" />
            <h3 className="text-lg font-black text-slate-900">Tu pedido</h3>
            {itemCount > 0 && (
              <span className="ml-auto rounded-full bg-[#1C9690] px-3 py-0.5 text-sm font-bold text-white">
                {itemCount}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
                <ShoppingBag className="h-16 w-16 opacity-20" />
                <p className="text-center text-sm font-medium">
                  Selecciona productos del menú para empezar tu pedido
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((line) => (
                  <div
                    key={line.signature}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900">{line.name}</p>
                        <p className="text-sm text-[#1C9690]">{money(line.price)}</p>
                        {(line.options.length > 0 || line.note) && (
                          <p className="mt-1 text-xs text-slate-500">
                            {[...line.options, line.note ? `Nota: ${line.note}` : ""]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 font-bold text-slate-900">{money(line.price * line.qty)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQty(line.signature, -1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-slate-100"
                        >
                          <Minus className="h-4 w-4 text-slate-600" />
                        </button>
                        <span className="w-8 text-center text-lg font-bold">{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(line.signature, 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c6efe7] transition hover:bg-[#92dbc8]"
                        >
                          <Plus className="h-4 w-4 text-[#169486]" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateQty(line.signature, -line.qty)}
                        className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="shrink-0 space-y-3 border-t border-slate-100 p-5">
              {isParent && (
                <div className="rounded-2xl border border-[#c6efe7] bg-[#f0fbf8] p-3">
                  <p className="mb-2 text-sm font-bold text-slate-800">Pedido para</p>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full rounded-xl border border-[#92dbc8] bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#1C9690]"
                  >
                    {children.length === 0 ? (
                      <option value="">Sin hijos vinculados</option>
                    ) : (
                      children.map((child) => (
                        <option key={child.studentId} value={child.studentId}>
                          {child.studentName} · saldo {money(child.walletBalance)}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total</span>
                <span className="text-3xl font-black text-slate-900">{money(total)}</span>
              </div>

              {parentNeedsCardPayment && (
                <p className="rounded-2xl bg-[#f0fbf8] px-4 py-3 text-xs font-semibold leading-5 text-[#169486]">
                  El saldo de {selectedChild?.studentName} no alcanza. Se cobrará con tarjeta familiar.
                </p>
              )}

              {checkoutFeedback && (
                <p className="text-center text-sm font-semibold text-red-500">{checkoutFeedback}</p>
              )}

              <button
                type="button"
                disabled={checkoutLoading}
                onClick={handleCheckoutClick}
                className="w-full rounded-2xl bg-[#1C9690] py-5 text-lg font-black text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60"
              >
                {checkoutLoading
                  ? "Procesando..."
                  : parentNeedsCardPayment
                    ? `Pagar con tarjeta · ${money(total)}`
                    : `Confirmar pedido · ${money(total)}`}
              </button>

              <button
                type="button"
                onClick={clear}
                className="w-full rounded-2xl py-2 text-sm font-semibold text-slate-400 transition hover:text-red-500"
              >
                Vaciar pedido
              </button>
            </div>
          )}
        </aside>
      </div>

      <AllergenWarningModal
        open={showAllergenWarning}
        warnings={allergenWarnings}
        userAllergens={userAllergens}
        onConfirm={() => {
          setConfirmedWarning(true);
          setShowAllergenWarning(false);
          checkout(true);
        }}
        onCancel={() => {
          setShowAllergenWarning(false);
          setConfirmedWarning(false);
        }}
        isLoading={checkoutLoading}
      />
    </div>
  );
}
