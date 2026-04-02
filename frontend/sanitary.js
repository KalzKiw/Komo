import { normalizedText } from "./utils.js";

export const SANITARY_PRODUCT_INFO = [
  {
    aliases: ["bocadillo oficial", "bocadillo de jamon", "bocadillo jamon"],
    ingredientes:
      "pan blanco (harina de trigo, agua, levadura, sal), fiambre paleta cocida (carne de cerdo y pavo, agua, fecula de patata, sal, proteina de soja y leche, azucar, dextrosa, lactosa, aromas y aditivos autorizados).",
    alergenos: ["gluten", "soja", "leche"],
    nutricion: { kcal: 238.4, grasas: 3.36, hidratos: 42.81, azucares: 3.85, proteinas: 8.9, sal: 0.98, grasasSaturadas: 0.81 },
    conservacion: "consumo inmediato; refrigeracion entre 0 y 4 oC",
    caducidad: "consumir preferentemente antes de 24 horas"
  },
  {
    aliases: ["croissant", "croissant mixto"],
    ingredientes:
      "croissant (harina de trigo, harina de soja, margarina, agua, azucar, levadura, dextrosa), fiambre paleta cocida y queso gouda.",
    alergenos: ["gluten", "soja", "leche"],
    nutricion: { kcal: 375, grasas: 22.9, hidratos: 27.4, azucares: 2.1, proteinas: 10, sal: 1.6, grasasSaturadas: 13.7 },
    conservacion: "consumo inmediato; refrigeracion entre 0 y 4 oC",
    caducidad: "consumir preferentemente antes de 24 horas"
  },
  {
    aliases: ["sandwich mixto", "sandwich"],
    ingredientes:
      "pan de molde (harina de trigo, agua, sal, grasa vegetal, levadura), fiambre paleta cocida y queso gouda.",
    alergenos: ["gluten", "soja", "leche"],
    nutricion: { kcal: 279, grasas: 11.34, hidratos: 31.8, azucares: 3.53, proteinas: 12.3, sal: 1.91, grasasSaturadas: 5.54 },
    conservacion: "consumo inmediato; refrigeracion entre 0 y 4 oC",
    caducidad: "consumir preferentemente antes de 24 horas"
  },
  {
    aliases: ["bocadillo atun", "bocadillo de atun", "sandwich atun", "sandwich vegetal", "croissant vegetal"],
    ingredientes:
      "base de pan, atun en aceite, millo/maiz dulce y mayonesa (aceite de soja, yema de huevo, vinagre de vino y aditivos autorizados).",
    alergenos: ["gluten", "pescado", "soja", "huevo"],
    nutricion: { kcal: 308.01, grasas: 20.05, hidratos: 20.1, azucares: 3.58, proteinas: 8.45, sal: 0.87, grasasSaturadas: 2.99 },
    conservacion: "consumo inmediato; refrigeracion entre 0 y 4 oC",
    caducidad: "consumir preferentemente antes de 24 horas"
  },
  {
    aliases: ["bocadillo tortilla", "bocadillo de tortilla", "bocadillo tortilla de papas", "bocadillo de tortilla de papas", "tortilla de papas"],
    ingredientes:
      "pan blanco (harina de trigo, agua, levadura, sal), tortilla de patatas (patata, huevo, aceite de oliva, sal, cebolla).",
    alergenos: ["gluten", "huevo"],
    nutricion: { kcal: 285, grasas: 9.2, hidratos: 40.1, azucares: 2.8, proteinas: 10.4, sal: 0.85, grasasSaturadas: 1.8 },
    conservacion: "consumo inmediato; refrigeracion entre 0 y 4 oC",
    caducidad: "consumir preferentemente antes de 24 horas"
  }
];

export function resolveSanitaryInfo(productName) {
  const normalizedName = normalizedText(productName);
  const found = SANITARY_PRODUCT_INFO.find((entry) =>
    entry.aliases.some((alias) => normalizedName.includes(normalizedText(alias)))
  );
  if (found) return found;
  return {
    ingredientes: "Informacion de ingredientes no disponible en la ficha sanitaria cargada.",
    alergenos: ["consultar etiqueta"],
    nutricion: { kcal: 0, grasas: 0, hidratos: 0, azucares: 0, proteinas: 0, sal: 0, grasasSaturadas: 0 },
    conservacion: "consultar personal de cafeteria",
    caducidad: "segun etiqueta diaria"
  };
}
