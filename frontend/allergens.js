import { normalizedText } from "./utils.js";

export const ALLERGEN_VISUALS = [
  { keys: ["gluten", "trigo", "centeno", "cebada", "avena"], label: "Gluten", color: "#f59e0b", icon: "🌾" },
  { keys: ["crustaceo", "crustaceos", "gamba", "langostino"], label: "Crustaceos", color: "#f97316", icon: "🦐" },
  { keys: ["huevo", "huevos"], label: "Huevos", color: "#f28c2f", icon: "🥚" },
  { keys: ["pescado", "atun", "salmon"], label: "Pescado", color: "#06b6d4", icon: "🐟" },
  { keys: ["cacahuete", "cacahuetes", "mani"], label: "Cacahuetes", color: "#b45309", icon: "🥜" },
  { keys: ["soja"], label: "Soja", color: "#22c55e", icon: "🫛" },
  { keys: ["leche", "lactosa", "lacteo", "lacteos"], label: "Leche", color: "#3b82f6", icon: "🥛" },
  { keys: ["frutos secos", "fruto seco", "nuez", "nueces", "almendra", "avellana", "pistacho", "anacardo"], label: "Frutos secos", color: "#8b5a2b", icon: "🌰" },
  { keys: ["apio"], label: "Apio", color: "#14b8a6", icon: "🥬" },
  { keys: ["mostaza"], label: "Mostaza", color: "#ca8a04", icon: "🟡" },
  { keys: ["sesamo", "sésamo"], label: "Sesamo", color: "#d97706", icon: "🌿" },
  { keys: ["sulfito", "sulfitos", "so2", "dioxido de azufre"], label: "Sulfitos", color: "#7c3aed", icon: "🍷" },
  { keys: ["altramuz", "altramuces"], label: "Altramuces", color: "#2563eb", icon: "🫘" },
  { keys: ["molusco", "moluscos", "mejillon", "calamar"], label: "Moluscos", color: "#0ea5e9", icon: "🦪" },
  { keys: ["consultar etiqueta"], label: "Consultar etiqueta", color: "#64748b", icon: "?" }
];

export function allergenVisual(allergenName) {
  const key = normalizedText(allergenName);
  const found = ALLERGEN_VISUALS.find((item) =>
    item.keys.some((token) => key.includes(normalizedText(token)))
  );
  if (found) return found;
  return {
    label: allergenName ? String(allergenName).charAt(0).toUpperCase() + String(allergenName).slice(1) : "Alergeno",
    color: "#64748b",
    icon: "•"
  };
}

export function getDefaultAllergens() {
  return [
    { id: "cereals", name: "🌾 Cereales" },
    { id: "eggs", name: "🥚 Huevos" },
    { id: "fish", name: "🐟 Pescado" },
    { id: "crustaceans", name: "🦐 Crustáceos" },
    { id: "nuts", name: "🥜 Frutos secos" },
    { id: "dairy", name: "🥛 Lácteos" },
    { id: "sesame", name: "🌱 Sésamo" },
    { id: "mollusks", name: "🐚 Moluscos" },
    { id: "sulfites", name: "⚗️ Sulfitos" },
    { id: "celery", name: "🥬 Apio" },
    { id: "mustard", name: "🌻 Mostaza" },
    { id: "lupin", name: "🌺 Altramuz" },
    { id: "soy", name: "🌾 Soja" },
    { id: "gluten", name: "🍞 Gluten" }
  ];
}
