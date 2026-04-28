// Pure utility functions — no DOM or state dependencies.

export function money(value) {
  return `${Number(value).toFixed(2)}€`;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function elapsedFrom(dateLike) {
  const created = new Date(dateLike);
  const diffMs = Math.max(0, Date.now() - created.getTime());
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatShiftLabel(shift) {
  if (shift === "MORNING") return "Morning";
  if (shift === "AFTERNOON") return "Afternoon";
  return shift || "Turno";
}

export function formatOrderStatus(status) {
  const labels = {
    PENDING: "Pendiente",
    IN_PREPARATION: "En preparacion",
    READY: "Listo",
    DELIVERED: "Entregado",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado"
  };
  return labels[status] || status;
}

export function normalizedText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function formatNutrition(value, unit, decimals = 1) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return `-- ${unit}`;
  return `${numeric.toFixed(decimals)} ${unit}`;
}

export function computeCutoffCountdown() {
  const now = new Date();
  const target = new Date();
  target.setHours(9, 5, 0, 0);
  if (now > target) target.setDate(target.getDate() + 1);
  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export function adminProductCategory(name) {
  const text = String(name || "").toLowerCase();
  if (text.includes("menu")) return "Productos";
  if (text.includes("platano") || text.includes("manzana") || text.includes("fruta")) return "Fruta";
  if (text.includes("zumo") || text.includes("agua") || text.includes("bebida") || text.includes("batido")) return "Bebidas";
  if (text.includes("bocadillo") || text.includes("sandwich")) return "Bocadillos";
  return "Snacks";
}

export function productCategory(product) {
  const text = `${product.name} ${product.description || ""}`.toLowerCase();
  if (text.includes("zumo") || text.includes("agua") || text.includes("bebida") || text.includes("cafe")) return "BEBIDA";
  if (text.includes("bocadillo") || text.includes("sandwich")) return "BOCADILLO";
  return "SNACK";
}

export function ingredientPreset(product) {
  const text = `${product.name} ${product.description || ""}`.toLowerCase();
  if (text.includes("bocadillo") || text.includes("sandwich")) return ["Sin tomate", "Sin cebolla", "Extra queso", "Pan integral"];
  if (text.includes("zumo") || text.includes("cafe") || text.includes("bebida")) return ["Sin azucar", "Con hielo", "Vaso grande"];
  return ["Sin sal", "Extra salsa", "Calentar"];
}

export function getProductImage(product) {
  const seed = product.id.slice(0, 8);
  return `https://picsum.photos/seed/${seed}/640/400`;
}

export function getProductImageFallback(product) {
  const title = encodeURIComponent(String(product?.name || "Producto"));
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
