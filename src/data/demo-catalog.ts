const demoAllergens = {
  gluten: { id: "a1", code: "GLUTEN", name: "Gluten" },
  milk: { id: "a2", code: "MILK", name: "Leche" },
  eggs: { id: "a3", code: "EGGS", name: "Huevos" },
};

export const demoCatalogProducts = [
  {
    id: "p1",
    name: "Bocadillo de tortilla",
    description: "Tortilla española recién hecha",
    imageUrl: null,
    productInfo: null,
    price: 2.8,
    originalPrice: 2.8,
    allergens: [demoAllergens.gluten, demoAllergens.eggs],
    isOfficialMenu: true,
  },
  {
    id: "p2",
    name: "Sándwich de jamón y queso",
    description: "Pan integral, jamón cocido y queso",
    imageUrl: null,
    productInfo: null,
    price: 2.5,
    originalPrice: 2.5,
    allergens: [demoAllergens.gluten, demoAllergens.milk],
  },
  {
    id: "p3",
    name: "Croissant artesanal",
    description: "Horneado cada mañana",
    imageUrl: null,
    productInfo: null,
    price: 1.5,
    originalPrice: 1.5,
    allergens: [demoAllergens.gluten, demoAllergens.milk, demoAllergens.eggs],
  },
  {
    id: "p4",
    name: "Zumo de naranja",
    description: "Zumo natural, 250 ml",
    imageUrl: null,
    productInfo: null,
    price: 1.4,
    originalPrice: 1.4,
    allergens: [],
  },
  {
    id: "p5",
    name: "Agua mineral",
    description: "Botella de 500 ml",
    imageUrl: null,
    productInfo: null,
    price: 1,
    originalPrice: 1,
    allergens: [],
  },
  {
    id: "p6",
    name: "Galleta de avena",
    description: "Avena, plátano y canela",
    imageUrl: null,
    productInfo: null,
    price: 1.2,
    originalPrice: 1.2,
    allergens: [demoAllergens.gluten],
  },
];

export function demoProductsResponse() {
  return { data: demoCatalogProducts };
}
