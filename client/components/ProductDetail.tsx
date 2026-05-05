import { ChevronLeft, Info, Minus, Plus } from "lucide-react";
import { useReducer, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AllergenChip = {
  key: string;
  label: string;
  icon: string;
};

export type ModifierOption = {
  id: string;
  label: string;
  /** Only for type="extra" */
  priceAdd?: number;
};

export type ModifierGroup = {
  id: string;
  title: string;
  subtitle?: string;
  /** exclusion: checkboxes (sin X) | extra: checkboxes + price | required: radio buttons */
  type: "exclusion" | "extra" | "required";
  options: ModifierOption[];
};

export type ProductDetailProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  badge?: string;
  imageUrl?: string;
};

export type AddToCartPayload = {
  productId: string;
  qty: number;
  exclusions: string[];
  extras: Array<{ id: string; label: string; priceAdd: number }>;
  requiredChoices: Record<string, string>;
  kitchenNote: string;
  total: number;
};

type Props = {
  product: ProductDetailProduct;
  allergens?: AllergenChip[];
  modifierGroups?: ModifierGroup[];
  onAdd?: (payload: AddToCartPayload) => void;
  onBack?: () => void;
  onInfo?: () => void;
};

// ─── Allergen lookup (EU 14 allergens) ───────────────────────────────────────

const ALLERGEN_MAP: Record<string, AllergenChip> = {
  gluten: { key: "gluten", label: "Gluten", icon: "🌾" },
  huevo: { key: "huevo", label: "Huevos", icon: "🥚" },
  leche: { key: "leche", label: "Lácteos", icon: "🥛" },
  pescado: { key: "pescado", label: "Pescado", icon: "🐟" },
  soja: { key: "soja", label: "Soja", icon: "🫛" },
  cacahuete: { key: "cacahuete", label: "Cacahuetes", icon: "🥜" },
  crustaceo: { key: "crustaceo", label: "Crustáceos", icon: "🦐" },
  molusco: { key: "molusco", label: "Moluscos", icon: "🦪" },
  sesamo: { key: "sesamo", label: "Sésamo", icon: "🌿" },
  mostaza: { key: "mostaza", label: "Mostaza", icon: "🟡" },
  apio: { key: "apio", label: "Apio", icon: "🥬" },
  altramuz: { key: "altramuz", label: "Altramuces", icon: "🫘" },
  sulfito: { key: "sulfito", label: "Sulfitos", icon: "🍷" },
  "frutos secos": { key: "frutos secos", label: "Frutos secos", icon: "🌰" },
};

export function resolveAllergenChips(keys: string[]): AllergenChip[] {
  return keys.map((k) => ALLERGEN_MAP[k.toLowerCase()] ?? { key: k, label: k, icon: "⚠️" });
}

// ─── Preset modifier groups (mirrors ingredientPreset logic) ─────────────────

export function defaultModifierGroups(product: ProductDetailProduct): ModifierGroup[] {
  const text = `${product.name} ${product.description ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const isSandwichLike =
    text.includes("bocadillo") ||
    text.includes("sandwich") ||
    text.includes("pulguita");
  const isHotDrink =
    text.includes("cafe") ||
    text.includes("cacao") ||
    text.includes("infusion");
  const isColdDrink =
    text.includes("zumo") ||
    text.includes("agua") ||
    text.includes("refresco") ||
    text.includes("bebida");
  const canHeat = text.includes("croissant") || text.includes("bizcocho");

  if (isSandwichLike) {
    return [
      {
        id: "exclusions",
        title: "Sin ingredientes",
        subtitle: "Opcional",
        type: "exclusion",
        options: [
          { id: "sin-tomate", label: "Sin tomate" },
          { id: "sin-cebolla", label: "Sin cebolla" },
          { id: "sin-aceite", label: "Sin aceite" },
        ],
      },
      {
        id: "extras",
        title: "Añadir extras",
        subtitle: "Opcional",
        type: "extra",
        options: [
          { id: "extra-queso", label: "Extra queso", priceAdd: 0.3 },
          { id: "extra-tomate-lechuga", label: "Extra tomate y lechuga", priceAdd: 0.3 },
          { id: "extra-salsa", label: "Salsa", priceAdd: 0.2 },
        ],
      },
      {
        id: "pan",
        title: "Tipo de pan",
        subtitle: "Elige uno",
        type: "required",
        options: [
          { id: "pan-blanco", label: "Pan blanco" },
          { id: "pan-integral", label: "Pan integral" },
        ],
      },
    ];
  }

  if (isHotDrink || isColdDrink) {
    return [
      {
        id: "extras-bebida",
        title: "Personalizar",
        subtitle: "Opcional",
        type: "exclusion",
        options: [
          { id: "sin-azucar", label: "Sin azúcar" },
          { id: "con-hielo", label: "Con hielo" },
        ],
      },
      ...(isHotDrink
        ? [
            {
              id: "suplementos-bebida",
              title: "Suplementos",
              subtitle: "Opcional",
              type: "extra" as const,
              options: [{ id: "para-llevar", label: "Para llevar", priceAdd: 0.1 }],
            },
          ]
        : []),
    ];
  }

  if (canHeat) {
    return [
      {
        id: "preparacion",
        title: "Preparación",
        subtitle: "Opcional",
        type: "exclusion",
        options: [{ id: "calentar", label: "Calentar" }],
      },
    ];
  }

  return [];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEuros(value: number): string {
  return value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function getImageSrc(product: ProductDetailProduct): string {
  if (product.imageUrl) return product.imageUrl;
  const seed = product.id.slice(0, 8);
  return `https://picsum.photos/seed/${seed}/800/500`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AllergenRow({ chips }: { chips: AllergenChip[] }) {
  if (chips.length === 0) return null;
  return (
    <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <span className="shrink-0 text-xs text-slate-400 font-medium">⚠️ Contiene:</span>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
        >
          {chip.icon} {chip.label}
        </span>
      ))}
    </div>
  );
}

function CheckboxRow({
  option,
  checked,
  onChange,
  showPrice,
}: {
  option: ModifierOption;
  checked: boolean;
  onChange: (id: string, value: boolean) => void;
  showPrice?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between border-b border-gray-100 py-3.5 last:border-0 active:bg-gray-50/60">
      <span className="select-none text-sm text-slate-800">{option.label}</span>
      <div className="flex shrink-0 items-center gap-3">
        {showPrice && option.priceAdd != null && option.priceAdd > 0 && (
          <span className="text-sm font-semibold text-[#1C9690]">
            +{formatEuros(option.priceAdd)}
          </span>
        )}
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(option.id, e.target.checked)}
          className="h-5 w-5 cursor-pointer rounded accent-[#1C9690]"
        />
      </div>
    </label>
  );
}

function RadioRow({
  option,
  name,
  checked,
  onChange,
}: {
  option: ModifierOption;
  name: string;
  checked: boolean;
  onChange: (id: string) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between border-b border-gray-100 py-3.5 last:border-0 active:bg-gray-50/60">
      <span className="select-none text-sm text-slate-800">{option.label}</span>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={() => onChange(option.id)}
        className="h-5 w-5 cursor-pointer accent-[#1C9690]"
      />
    </label>
  );
}

function GroupCard({
  group,
  exclusions,
  extras,
  required,
  onToggleExclusion,
  onToggleExtra,
  onSelectRequired,
}: {
  group: ModifierGroup;
  exclusions: Set<string>;
  extras: Set<string>;
  required: Record<string, string>;
  onToggleExclusion: (id: string, checked: boolean) => void;
  onToggleExtra: (id: string, checked: boolean) => void;
  onSelectRequired: (groupId: string, optionId: string) => void;
}) {
  return (
    <section className="bg-white">
      {/* Group header */}
      <div className="flex items-baseline justify-between px-4 pb-1 pt-4">
        <h3 className="text-[0.9rem] font-semibold text-slate-900">{group.title}</h3>
        {group.subtitle && (
          <span className="text-xs text-slate-400">{group.subtitle}</span>
        )}
      </div>

      {/* Options */}
      <div className="px-4">
        {group.options.map((opt) => {
          if (group.type === "required") {
            return (
              <RadioRow
                key={opt.id}
                option={opt}
                name={group.id}
                checked={required[group.id] === opt.id}
                onChange={(id) => onSelectRequired(group.id, id)}
              />
            );
          }
          if (group.type === "extra") {
            return (
              <CheckboxRow
                key={opt.id}
                option={opt}
                checked={extras.has(opt.id)}
                onChange={onToggleExtra}
                showPrice
              />
            );
          }
          // exclusion
          return (
            <CheckboxRow
              key={opt.id}
              option={opt}
              checked={exclusions.has(opt.id)}
              onChange={onToggleExclusion}
            />
          );
        })}
      </div>
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductDetail({
  product,
  allergens,
  modifierGroups,
  onAdd,
  onBack,
  onInfo,
}: Props): JSX.Element {
  const [qty, setQty] = useState(1);
  const [exclusions, setExclusions] = useState<Set<string>>(new Set());
  const [extras, setExtras] = useState<Set<string>>(new Set());
  const [required, setRequired] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [imgError, setImgError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const groups = modifierGroups ?? defaultModifierGroups(product);
  const chips = allergens ?? resolveAllergenChips([]);

  // ── Compute total ──────────────────────────────────────────────────────────
  const extrasTotal = groups
    .filter((g) => g.type === "extra")
    .flatMap((g) => g.options)
    .filter((opt) => extras.has(opt.id) && opt.priceAdd != null)
    .reduce((acc, opt) => acc + (opt.priceAdd ?? 0), 0);

  const total = (product.price + extrasTotal) * qty;

  // ── Handlers ───────────────────────────────────────────────────────────────
  function toggleExclusion(id: string, checked: boolean) {
    setExclusions((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function toggleExtra(id: string, checked: boolean) {
    setExtras((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function selectRequired(groupId: string, optionId: string) {
    setRequired((prev) => ({ ...prev, [groupId]: optionId }));
  }

  function handleAdd() {
    if (!onAdd) return;

    const exclusionList = groups
      .filter((g) => g.type === "exclusion")
      .flatMap((g) => g.options)
      .filter((opt) => exclusions.has(opt.id))
      .map((opt) => opt.label);

    const extrasList = groups
      .filter((g) => g.type === "extra")
      .flatMap((g) => g.options)
      .filter((opt) => extras.has(opt.id))
      .map((opt) => ({ id: opt.id, label: opt.label, priceAdd: opt.priceAdd ?? 0 }));

    onAdd({
      productId: product.id,
      qty,
      exclusions: exclusionList,
      extras: extrasList,
      requiredChoices: required,
      kitchenNote: note.trim(),
      total,
    });
  }

  const imageSrc = imgError
    ? `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'><rect width='800' height='500' fill='%23d1fae5'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23065f46' font-family='Arial' font-size='32' font-weight='700'>${product.name}</text></svg>`
      )}`
    : getImageSrc(product);

  return (
    <div
      ref={scrollRef}
      data-gesture-lock="true"
      className="komo-detail-enter relative h-screen overflow-y-scroll bg-gray-50 pb-44 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {/* ── 1. Hero Image ─────────────────────────────────────────────────── */}
      <section className="relative w-full">
        <img
          src={imageSrc}
          alt={product.name}
          onError={() => setImgError(true)}
          className="aspect-[4/3] w-full object-cover"
          draggable={false}
        />

        {/* Gradient overlay — depth at bottom of image */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Back button */}
        <button
          type="button"
          aria-label="Volver"
          onClick={onBack}
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-opacity active:opacity-70"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Info / nutrition button */}
        {onInfo && (
          <button
            type="button"
            aria-label="Información nutricional"
            onClick={onInfo}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-opacity active:opacity-70"
          >
            <Info className="h-5 w-5" />
          </button>
        )}
      </section>

      {/* ── 2. Hero Content (name / price / allergens) ──────────────────────── */}
      <section className="bg-white px-4 pb-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {product.badge && (
              <span className="mb-1.5 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                {product.badge}
              </span>
            )}
            <h1 className="text-2xl font-bold leading-snug text-slate-900">{product.name}</h1>
            {product.description && (
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{product.description}</p>
            )}
          </div>
          <p className="shrink-0 text-xl font-semibold text-[#1C9690] tabular-nums">
            {formatEuros(product.price)}
          </p>
        </div>

        <AllergenRow chips={chips} />
      </section>

      {/* ── 3. Modifier Groups ─────────────────────────────────────────────── */}
      {groups.map((group, idx) => (
        <div key={group.id}>
          {/* Gap between white cards (shows gray bg) */}
          <div className="h-2" />
          <GroupCard
            group={group}
            exclusions={exclusions}
            extras={extras}
            required={required}
            onToggleExclusion={toggleExclusion}
            onToggleExtra={toggleExtra}
            onSelectRequired={selectRequired}
          />
        </div>
      ))}

      {/* ── 4. Kitchen Note ─────────────────────────────────────────────────── */}
      <div className="h-2" />
      <section className="bg-white">
        <div className="px-4 pb-4 pt-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Nota para cocina
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: sin aceite, bien caliente, para llevar…"
              rows={2}
              maxLength={200}
              className="mt-2 w-full resize-none rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#44b6a1] focus:outline-none focus:ring-2 focus:ring-[#2da38f]/20"
            />
          </label>
        </div>
      </section>

      {/* ── 5. Sticky Footer ─────────────────────────────────────────────────── */}
      <footer className="fixed bottom-16 left-0 right-0 z-50 bg-white px-4 pb-3 pt-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3">
          {/* Quantity selector */}
          <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50">
            <button
              type="button"
              aria-label="Reducir cantidad"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="flex h-11 w-11 items-center justify-center rounded-l-2xl text-slate-500 transition-colors hover:text-slate-700 active:bg-gray-100 disabled:opacity-30"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-lg font-bold tabular-nums text-slate-800">
              {qty}
            </span>
            <button
              type="button"
              aria-label="Aumentar cantidad"
              onClick={() => setQty((q) => q + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-r-2xl text-slate-500 transition-colors hover:text-slate-700 active:bg-gray-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add to cart */}
          <button
            type="button"
            onClick={handleAdd}
            className="flex flex-1 items-center justify-between rounded-2xl bg-[#1C9690] px-5 py-3 font-bold text-white shadow-[0_8px_20px_rgba(5,150,105,0.35)] transition-colors active:bg-[#169486]"
          >
            <span className="text-[0.95rem]">Añadir al carrito</span>
            <span className="tabular-nums">{formatEuros(total)}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

// ─── Demo (development / Storybook use) ──────────────────────────────────────

export function ProductDetailDemo(): JSX.Element {
  return (
    <ProductDetail
      product={{
        id: "bocadillo-tortilla-papas",
        name: "Bocadillo de Tortilla de Papas",
        description: "Menú oficial escolar",
        price: 2.5,
        badge: "Popular",
      }}
      allergens={resolveAllergenChips(["gluten", "huevo"])}
      onBack={() => alert("← volver")}
      onInfo={() => alert("ℹ️ info nutricional")}
      onAdd={(payload) => {
        console.info("addToCart", payload);
        alert(`✅ Añadido ×${payload.qty} — Total: ${payload.total.toFixed(2)} €`);
      }}
    />
  );
}
