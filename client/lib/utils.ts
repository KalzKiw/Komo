// Pure utility functions — TypeScript port of frontend/utils.js

export function money(value: number | string): string {
  return `${Number(value).toFixed(2)}€`;
}

export function escapeHtml(value: string): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function elapsedFrom(dateLike: string | Date): string {
  const created = new Date(dateLike);
  const diffMs = Math.max(0, Date.now() - created.getTime());
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatShiftLabel(shift: string): string {
  if (shift === "MORNING") return "Mañana";
  if (shift === "AFTERNOON") return "Tarde";
  return shift || "Turno";
}

export function formatOrderStatus(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    IN_PREPARATION: "En preparación",
    READY: "Listo",
    DELIVERED: "Entregado",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  };
  return labels[status] ?? status;
}

export function normalizedText(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function formatNutrition(value: number | undefined | null, unit: string, decimals = 1): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return `-- ${unit}`;
  return `${numeric.toFixed(decimals)} ${unit}`;
}

export function computeCutoffCountdown(): string {
  const now = new Date();
  const target = new Date();
  target.setHours(9, 5, 0, 0);
  if (now > target) target.setDate(target.getDate() + 1);
  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export function adminProductCategory(name: string): string {
  const text = String(name || "").toLowerCase();
  if (text.includes("menu")) return "Productos";
  if (text.includes("platano") || text.includes("manzana") || text.includes("fruta")) return "Fruta";
  if (text.includes("zumo") || text.includes("agua") || text.includes("bebida") || text.includes("batido")) return "Bebidas";
  if (text.includes("bocadillo") || text.includes("sandwich")) return "Bocadillos";
  return "Snacks";
}

export function productCategory(product: { name: string; description?: string | null }): string {
  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();
  if (text.includes("zumo") || text.includes("agua") || text.includes("bebida") || text.includes("cafe")) return "BEBIDA";
  if (text.includes("bocadillo") || text.includes("sandwich")) return "BOCADILLO";
  return "SNACK";
}

export function ingredientPreset(product: { name: string; description?: string | null }): string[] {
  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();
  if (text.includes("bocadillo") || text.includes("sandwich")) return ["Sin tomate", "Sin cebolla", "Extra queso", "Pan integral"];
  if (text.includes("zumo") || text.includes("cafe") || text.includes("bebida")) return ["Sin azúcar", "Con hielo", "Vaso grande"];
  return ["Sin sal", "Extra salsa", "Calentar"];
}

export function getProductImage(product: { id: string }): string {
  const seed = product.id.slice(0, 8);
  return `https://picsum.photos/seed/${seed}/640/400`;
}

export function getProductImageFallback(product: { name?: string }): string {
  const title = encodeURIComponent(String(product?.name ?? "Producto"));
  const subtitle = encodeURIComponent("CafeApp");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400' viewBox='0 0 640 400'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#d1fae5'/>
        <stop offset='100%' stop-color='#6ee7b7'/>
      </linearGradient>
    </defs>
    <rect width='640' height='400' fill='url(#g)'/>
    <circle cx='520' cy='88' r='76' fill='rgba(255,255,255,0.45)'/>
    <circle cx='116' cy='328' r='96' fill='rgba(255,255,255,0.35)'/>
    <text x='42' y='210' fill='#065f46' font-family='Arial, sans-serif' font-size='34' font-weight='700'>${title}</text>
    <text x='42' y='250' fill='#047857' font-family='Arial, sans-serif' font-size='20'>${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    IN_PREPARATION: "bg-blue-100 text-blue-800",
    READY: "bg-#c6efe7 text-#169486",
    DELIVERED: "bg-slate-100 text-slate-600",
    COMPLETED: "bg-slate-100 text-slate-600",
    CANCELLED: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}
