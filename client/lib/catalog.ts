import { resolveProductInfo } from "./productInfo";
import { productCategory } from "./utils";

export type ApiProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl?: string | null;
  productInfo?: ReturnType<typeof resolveProductInfo> | null;
  isActive: boolean;
  allergens?: Array<{ id: string; code: string; name: string }>;
  isOfficialMenu?: boolean;
};

export type Category = "ALL" | "BOCADILLO" | "BEBIDA" | "SNACK";

export const CATEGORIES: Array<{ id: Category; label: string; icon: string }> = [
  { id: "ALL", label: "Todos", icon: "🍽️" },
  { id: "BOCADILLO", label: "Bocadillos", icon: "🥪" },
  { id: "BEBIDA", label: "Bebidas", icon: "🥤" },
  { id: "SNACK", label: "Snacks", icon: "🍪" },
];

export function productImageUrl(productId: string, productName: string, imageUrl?: string | null) {
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

export function isStandaloneCatalogProduct(product: ApiProduct) {
  const infoId = product.productInfo?.id ?? "";
  const name = product.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const hiddenAddonIds = new Set([
    "suplemento-para-llevar",
    "ingrediente-extra-queso",
    "ingrediente-extra-tomate-lechuga",
    "salsa-mojo-alioli-mostaza",
  ]);
  const hiddenAddonNames = [
    "suplemento para llevar",
    "ingrediente extra queso",
    "ingrediente extra tomate y lechuga",
    "salsa mojo alioli mostaza",
  ];

  return (
    product.isActive !== false &&
    product.productInfo?.categoria !== "extra" &&
    !hiddenAddonIds.has(infoId) &&
    !hiddenAddonNames.includes(name)
  );
}

export function filterProductsByCategory(products: ApiProduct[], category: Category) {
  return category === "ALL" ? products : products.filter((p) => productCategory(p) === category);
}
