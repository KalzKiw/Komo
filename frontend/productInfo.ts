export interface ProductNutritionalInfo {
  kcal: number;
  grasas: number;
  hidratos: number;
  azucares: number;
  proteinas: number;
  sal: number;
}

export interface ProductInfo {
  id: string;
  nombre: string;
  categoria: "bocadillo" | "croissant" | "sandwich";
  ingredientes: string[];
  alergenos: string[];
  trazas: string[];
  informacionNutricional: ProductNutritionalInfo;
  conservacion: string;
  caducidad: string;
  fuente: string[];
}

const CONSERVACION_BASE = "consumo inmediato; refrigeracion entre 0 y 4 oC";
const CADUCIDAD_BASE = "consumir preferentemente antes de 24 horas";

const PAN_BLANCO = "pan blanco (harina de trigo, agua, levadura, sal)";
const PAN_MOLDE =
  "pan de molde (harina de trigo, agua, sal, grasa vegetal, levadura, e-472e, e-300, enzima de panificar de trigo)";
const CROISSANT_BASE =
  "croissant (harina de trigo, harina de soja, margarina con grasa vegetal de palma, agua, aceite de girasol, emulgente e-471, sal, aromas, corrector de acidez e-330, colorante e-160a, agua, azucar, levadura, dextrosa, gluten de trigo, sal, emulgente e-472e, antiaglomerante e-170, almidon modificado, harina de soja, fructosa, espesante e-415, hidroxipol celulosa, agente de tratamiento de harina e-300, aroma, almidon de maiz, enzimas)";
const BASE_ATUN_MAIZ_MAYO =
  "atun en aceite (atun, aceite de girasol, sal), maiz dulce (maiz, agua, azucar, sal), mayonesa (aceite de soja modificado geneticamente, agua, yema de huevo, jarabe de glucosa y fructosa, vinagre de vino, sal, almidon modificado de maiz e-1422, estabilizante e-415, conservador e-202, acidulante e-270, aroma, conservante e-385 (edta), colorante e-160a)";
const FIAMBRE_PALETA =
  "fiambre paleta cocida (carne de cerdo y pavo, agua, fecula de patata, sal, proteina de soja y leche, azucar, dextrosa, lactosa, aromas, antioxidante e-316, conservantes e-260, estabilizantes e-407 y e-451, potenciador del sabor e-621, colorante e-120)";
const QUESO_GOUDA = "queso gouda (leche de vaca pasteurizada, sal, fermentos lacticos, coagulante)";

export const productInfoCatalog: ProductInfo[] = [
  {
    id: "bocadillo-atun-millo-mayonesa",
    nombre: "Bocadillo de atun, millo y mayonesa",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, BASE_ATUN_MAIZ_MAYO],
    alergenos: ["gluten", "pescado", "soja", "huevo"],
    trazas: [],
    informacionNutricional: {
      kcal: 275.2,
      grasas: 6.65,
      hidratos: 44.51,
      azucares: 4.17,
      proteinas: 7.85,
      sal: 7.14
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT BOCADILLO ATUN JOSE ZERPA.odt", "ETIQUETA BOCADILLO ATUN.docx"]
  },
  {
    id: "bocadillo-jamon",
    nombre: "Bocadillo de jamon",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, FIAMBRE_PALETA],
    alergenos: ["gluten", "soja", "leche"],
    trazas: ["frutos de cascara"],
    informacionNutricional: {
      kcal: 238.4,
      grasas: 3.36,
      hidratos: 42.81,
      azucares: 3.85,
      proteinas: 8.9,
      sal: 0.98
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT BOCADILLO DE JAMON JOSE ZERPA.odt", "ETIQUETA BOCADILLO JAMON.docx"]
  },
  {
    id: "bocadillo-jamon-serrano",
    nombre: "Bocadillo de jamon serrano",
    categoria: "bocadillo",
    ingredientes: [
      PAN_BLANCO,
      "jamon serrano (jamon de cerdo, sal, azucar, antioxidantes e-331 y e-301, conservadores e-252 y e-250)"
    ],
    alergenos: ["gluten"],
    trazas: [],
    informacionNutricional: {
      kcal: 263.16,
      grasas: 5.04,
      hidratos: 40.49,
      azucares: 3.55,
      proteinas: 13.3,
      sal: 1.26
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT BOCADILLO DE JAMON SERRANO JOSE ZERPA.odt", "ETIQUETA BOCADILLO DE JAMON SERRANO.docx"]
  },
  {
    id: "bocadillo-lomo-adobado",
    nombre: "Bocadillo de lomo adobado",
    categoria: "bocadillo",
    ingredientes: [
      PAN_BLANCO,
      "lomo adobado (lomo de cerdo 60%, agua, sal, fecula de patata y maiz, dextrosa, estabilizantes e-451 y e-407, proteina de soja, proteina de cerdo, antioxidantes e-331 y e-316, aromas, aroma de humo, especias, potenciador del sabor e-621, conservador e-250)"
    ],
    alergenos: ["gluten", "soja"],
    trazas: ["leche"],
    informacionNutricional: {
      kcal: 235,
      grasas: 3.24,
      hidratos: 41.89,
      azucares: 3.85,
      proteinas: 8.76,
      sal: 1.04
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT BOCADILLO DE LOMO ADOBADO JOSE ZERPA.odt", "ETIQUETA BOCADILLO DE LOMO ADOBADO.docx"]
  },
  {
    id: "bocadillo-pavo-cocido",
    nombre: "Bocadillo de pavo cocido",
    categoria: "bocadillo",
    ingredientes: [
      PAN_BLANCO,
      "pechuga de pavo cocida (pechuga de pavo 65%, agua, jarabe de glucosa, dextrosa, cloruro potasico, cloruro sodico, estabilizantes e-451i y e-407, aromas, antioxidante e-301, conservadores e-261 y e-250)"
    ],
    alergenos: ["gluten"],
    trazas: ["soja"],
    informacionNutricional: {
      kcal: 228.8,
      grasas: 2.74,
      hidratos: 40.75,
      azucares: 3.71,
      proteinas: 9.46,
      sal: 0.82
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT BOCADILLO DE PAVO JOSE ZERPA.odt", "ETIQUETA BOCADILLO DE PAVO.docx"]
  },
  {
    id: "bocadillo-pechuga-plancha",
    nombre: "Bocadillo de pechuga a la plancha",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, "pechuga de pollo"],
    alergenos: ["gluten"],
    trazas: [],
    informacionNutricional: {
      kcal: 235.8,
      grasas: 2.99,
      hidratos: 40.49,
      azucares: 3.45,
      proteinas: 10.34,
      sal: 0.614
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT BOCADILLO DE PECHUGA JOSE ZERPA.odt", "ETIQUETA BOCADILLO PECHUGA A LA PLANCHA.docx"]
  },
  {
    id: "bocadillo-queso",
    nombre: "Bocadillo de queso",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, QUESO_GOUDA],
    alergenos: ["gluten", "leche"],
    trazas: ["frutos de cascara"],
    informacionNutricional: {
      kcal: 284.8,
      grasas: 8.13,
      hidratos: 40.93,
      azucares: 3.89,
      proteinas: 11.16,
      sal: 0.7
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT BOCADILLO DE QUESO JOSE ZERPA.odt", "ETIQUETA BOCADILLO DE QUESO.docx"]
  },
  {
    id: "bocadillo-tortilla-papas",
    nombre: "Bocadillo de tortilla de papas",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, "tortilla de papas (huevo, papas, sal, aceite)"],
    alergenos: ["gluten", "huevo"],
    trazas: [],
    informacionNutricional: {
      kcal: 238.8,
      grasas: 4,
      hidratos: 42.34,
      azucares: 3.88,
      proteinas: 7.42,
      sal: 0.6
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT BOCADILLO DE TORTILLA DE PAPAS JOSE ZERPA.odt", "ETIQUETA BOCADILLO DE TORTILLA DE PAPAS.docx"]
  },
  {
    id: "bocadillo-tortilla-francesa",
    nombre: "Bocadillo de tortilla francesa",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, "tortilla francesa (huevo, sal, aceite)"],
    alergenos: ["gluten", "huevo"],
    trazas: [],
    informacionNutricional: {
      kcal: 247.2,
      grasas: 5.26,
      hidratos: 40.77,
      azucares: 3.73,
      proteinas: 8.66,
      sal: 0.74
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT BOCADILLO DE TORTILLA FRANCESA JOSE ZERPA.odt", "ETIQUETA BOCADILLO DE TORTILLA FRANCESA.docx"]
  },
  {
    id: "croissant-mixto",
    nombre: "Croissant mixto",
    categoria: "croissant",
    ingredientes: [CROISSANT_BASE, FIAMBRE_PALETA, QUESO_GOUDA],
    alergenos: ["gluten", "soja", "leche"],
    trazas: [],
    informacionNutricional: {
      kcal: 375,
      grasas: 22.9,
      hidratos: 27.4,
      azucares: 2.1,
      proteinas: 10,
      sal: 1.6
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT CROISSANT MIXTO JOSE ZERPA.odt", "ETIQUETA CROISSANT MIXTO.docx"]
  },
  {
    id: "croissant-mixto-vegetal",
    nombre: "Croissant mixto vegetal",
    categoria: "croissant",
    ingredientes: [CROISSANT_BASE, FIAMBRE_PALETA, QUESO_GOUDA, BASE_ATUN_MAIZ_MAYO, "tomate", "lechuga"],
    alergenos: ["gluten", "soja", "leche", "pescado", "huevo"],
    trazas: [],
    informacionNutricional: {
      kcal: 425,
      grasas: 27.3,
      hidratos: 29.4,
      azucares: 3.9,
      proteinas: 14.9,
      sal: 1.6
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT CROISSANT MIXTO VEGETAL JOSE ZERPA.odt", "ETIQUETA CROISSANT MIXTO VEGETAL.docx"]
  },
  {
    id: "croissant-vegetal",
    nombre: "Croissant vegetal",
    categoria: "croissant",
    ingredientes: [CROISSANT_BASE, BASE_ATUN_MAIZ_MAYO, "tomate", "lechuga"],
    alergenos: ["gluten", "soja", "pescado", "huevo"],
    trazas: [],
    informacionNutricional: {
      kcal: 412,
      grasas: 23.2,
      hidratos: 26.3,
      azucares: 2.9,
      proteinas: 12.8,
      sal: 1.5
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT CROISSANT VEGETAL JOSE ZERPA.odt", "ETIQUETA CROISSANT VEGETAL.docx"]
  },
  {
    id: "sandwich-atun-millo-mayonesa",
    nombre: "Sandwich de atun, millo y mayonesa",
    categoria: "sandwich",
    ingredientes: [PAN_MOLDE, BASE_ATUN_MAIZ_MAYO],
    alergenos: ["gluten", "pescado", "soja", "huevo"],
    trazas: [],
    informacionNutricional: {
      kcal: 308.01,
      grasas: 20.05,
      hidratos: 20.1,
      azucares: 3.58,
      proteinas: 8.45,
      sal: 0.87
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT SANDWICH ATUN JOSE ZERPA.odt", "ETIQUETA SANDWICH ATUN.docx"]
  },
  {
    id: "sandwich-mixto",
    nombre: "Sandwich mixto",
    categoria: "sandwich",
    ingredientes: [PAN_MOLDE, FIAMBRE_PALETA, QUESO_GOUDA],
    alergenos: ["gluten", "soja", "leche"],
    trazas: [],
    informacionNutricional: {
      kcal: 279,
      grasas: 11.34,
      hidratos: 31.8,
      azucares: 3.53,
      proteinas: 12.3,
      sal: 1.91
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT SANDWICH MIXTO JOSE ZERPA.odt", "ETIQUETA SANDWICH MIXTO.docx"]
  },
  {
    id: "sandwich-vegetal",
    nombre: "Sandwich vegetal",
    categoria: "sandwich",
    ingredientes: [PAN_MOLDE, BASE_ATUN_MAIZ_MAYO, "tomate", "lechuga"],
    alergenos: ["gluten", "pescado", "soja", "huevo"],
    trazas: [],
    informacionNutricional: {
      kcal: 197,
      grasas: 15.5,
      hidratos: 18.5,
      azucares: 2.65,
      proteinas: 12,
      sal: 0.85
    },
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: ["FT SANDWICH VEGETAL JOSE ZERPA.odt", "ETIQUETA SANDWICH VEGETAL.docx"]
  }
];
