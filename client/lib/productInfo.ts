export interface ProductNutritionalInfo {
  kcal: number;
  grasas: number;
  hidratos: number;
  azucares: number;
  proteinas: number;
  sal: number;
}

export interface ProductInfo {
  id?: string;
  nombre?: string;
  categoria?: "bebida-caliente" | "bebida-fria" | "golosina" | "bocadillo" | "croissant" | "sandwich" | "extra";
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
const LECHE = "leche";
const LECHE_CONDENSADA = "leche condensada (leche, azucar)";
const CAFE = "cafe";
const CACAO = "cacao soluble (azucar, cacao desgrasado, lecitina de soja)";
const ZUMO = "zumo de fruta";
const AGUA = "agua";
const REFRESCO = "refresco";
const GALLETAS = "galletas (harina de trigo, azucar, aceites vegetales, leche, soja)";
const BIZCOCHO = "bizcocho (harina de trigo, huevo, azucar, aceite, leche)";
const DONUT = "donut (harina de trigo, azucar, aceites vegetales, huevo, leche, soja)";
const BARRITA = "barrita de cereales (cereales, gluten, leche, soja, frutos de cascara)";
const TORTITA = "tortita de cereales (arroz o maiz, sal; puede contener soja y leche)";
const CARAMELO = "caramelo (azucar, jarabe de glucosa, aromas)";
const EMBUTIDO = "embutido variado (cerdo o pavo, sal, especias, proteina de soja y leche segun proveedor)";
const PECHUGA_POLLO = "pechuga de pollo";
const VEGETAL_ATUN = `${BASE_ATUN_MAIZ_MAYO}, tomate, lechuga`;
const SALSAS = "salsas (mojo, alioli y mostaza; aceite, ajo, huevo, mostaza, vinagre y especias)";
const PAN_INTEGRAL = "pan integral (harina integral de trigo, agua, levadura, sal, semillas)";

function nutrition(
  kcal: number,
  grasas: number,
  hidratos: number,
  azucares: number,
  proteinas: number,
  sal: number
): ProductNutritionalInfo {
  return { kcal, grasas, hidratos, azucares, proteinas, sal };
}

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
  },
  {
    id: "cafe-solo",
    nombre: "Cafe Solo",
    categoria: "bebida-caliente",
    ingredientes: [CAFE, "agua"],
    alergenos: [],
    trazas: ["leche"],
    informacionNutricional: nutrition(2, 0, 0.2, 0, 0.1, 0),
    conservacion: "consumo inmediato; servir caliente",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "cafe-con-leche",
    nombre: "Cafe con Leche",
    categoria: "bebida-caliente",
    ingredientes: [CAFE, LECHE],
    alergenos: ["leche"],
    trazas: [],
    informacionNutricional: nutrition(64, 2.2, 6.1, 6.1, 3.4, 0.11),
    conservacion: "consumo inmediato; servir caliente",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "cafe-leche-y-leche",
    nombre: "Cafe Leche y Leche",
    categoria: "bebida-caliente",
    ingredientes: [CAFE, LECHE, LECHE_CONDENSADA],
    alergenos: ["leche"],
    trazas: [],
    informacionNutricional: nutrition(118, 2.5, 19.8, 19.6, 4.1, 0.15),
    conservacion: "consumo inmediato; servir caliente",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "cafe-cortado",
    nombre: "Cafe Cortado",
    categoria: "bebida-caliente",
    ingredientes: [CAFE, LECHE],
    alergenos: ["leche"],
    trazas: [],
    informacionNutricional: nutrition(32, 1.1, 3.1, 3.1, 1.7, 0.06),
    conservacion: "consumo inmediato; servir caliente",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "cafe-cortado-leche-condensada",
    nombre: "Cafe Cortado Leche Condensada",
    categoria: "bebida-caliente",
    ingredientes: [CAFE, LECHE_CONDENSADA],
    alergenos: ["leche"],
    trazas: [],
    informacionNutricional: nutrition(86, 1.5, 15.4, 15.2, 2.6, 0.09),
    conservacion: "consumo inmediato; servir caliente",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "cafe-cortado-leche-y-leche",
    nombre: "Cafe Cortado Leche y Leche",
    categoria: "bebida-caliente",
    ingredientes: [CAFE, LECHE, LECHE_CONDENSADA],
    alergenos: ["leche"],
    trazas: [],
    informacionNutricional: nutrition(96, 1.8, 16.8, 16.6, 3.1, 0.1),
    conservacion: "consumo inmediato; servir caliente",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "cacao",
    nombre: "Cacao",
    categoria: "bebida-caliente",
    ingredientes: [LECHE, CACAO],
    alergenos: ["leche", "soja"],
    trazas: [],
    informacionNutricional: nutrition(145, 3.2, 22.5, 21.4, 6.2, 0.18),
    conservacion: "consumo inmediato; servir caliente",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "descafeinado-cafe-con-leche",
    nombre: "Descafeinado Cafe con Leche",
    categoria: "bebida-caliente",
    ingredientes: ["cafe descafeinado", LECHE],
    alergenos: ["leche"],
    trazas: [],
    informacionNutricional: nutrition(64, 2.2, 6.1, 6.1, 3.4, 0.11),
    conservacion: "consumo inmediato; servir caliente",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "descafeinado-cortado",
    nombre: "Descafeinado Cortado",
    categoria: "bebida-caliente",
    ingredientes: ["cafe descafeinado", LECHE],
    alergenos: ["leche"],
    trazas: [],
    informacionNutricional: nutrition(32, 1.1, 3.1, 3.1, 1.7, 0.06),
    conservacion: "consumo inmediato; servir caliente",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "descafeinado-leche-y-leche",
    nombre: "Descafeinado Leche y Leche",
    categoria: "bebida-caliente",
    ingredientes: ["cafe descafeinado", LECHE, LECHE_CONDENSADA],
    alergenos: ["leche"],
    trazas: [],
    informacionNutricional: nutrition(118, 2.5, 19.8, 19.6, 4.1, 0.15),
    conservacion: "consumo inmediato; servir caliente",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "infusion",
    nombre: "Infusion",
    categoria: "bebida-caliente",
    ingredientes: ["infusion", "agua"],
    alergenos: [],
    trazas: [],
    informacionNutricional: nutrition(2, 0, 0.1, 0, 0, 0),
    conservacion: "consumo inmediato; servir caliente",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "suplemento-para-llevar",
    nombre: "Suplemento para llevar",
    categoria: "extra",
    ingredientes: ["vaso o envase para llevar"],
    alergenos: [],
    trazas: [],
    informacionNutricional: nutrition(0, 0, 0, 0, 0, 0),
    conservacion: "mantener en lugar limpio y seco",
    caducidad: "no aplica",
    fuente: []
  },
  {
    id: "zumo-20cl",
    nombre: "Zumo 20cl",
    categoria: "bebida-fria",
    ingredientes: [ZUMO],
    alergenos: [],
    trazas: [],
    informacionNutricional: nutrition(90, 0.2, 20.5, 18.4, 0.8, 0.02),
    conservacion: "conservar refrigerado una vez abierto",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "zumo-33cl",
    nombre: "Zumo 33cl",
    categoria: "bebida-fria",
    ingredientes: [ZUMO],
    alergenos: [],
    trazas: [],
    informacionNutricional: nutrition(148, 0.3, 33.8, 30.4, 1.3, 0.03),
    conservacion: "conservar refrigerado una vez abierto",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "botella-agua-05l",
    nombre: "Botella de Agua 0,5L",
    categoria: "bebida-fria",
    ingredientes: [AGUA],
    alergenos: [],
    trazas: [],
    informacionNutricional: nutrition(0, 0, 0, 0, 0, 0),
    conservacion: "conservar en lugar fresco y seco",
    caducidad: "segun fecha indicada en envase",
    fuente: []
  },
  {
    id: "botella-agua-gas",
    nombre: "Botella de Agua Gas",
    categoria: "bebida-fria",
    ingredientes: ["agua carbonatada"],
    alergenos: [],
    trazas: [],
    informacionNutricional: nutrition(0, 0, 0, 0, 0, 0),
    conservacion: "conservar en lugar fresco y seco",
    caducidad: "segun fecha indicada en envase",
    fuente: []
  },
  {
    id: "refrescos-sabores-zero",
    nombre: "Refrescos Sabores / Zero",
    categoria: "bebida-fria",
    ingredientes: [REFRESCO],
    alergenos: [],
    trazas: [],
    informacionNutricional: nutrition(70, 0, 17, 16.5, 0, 0.02),
    conservacion: "conservar en lugar fresco y seco",
    caducidad: "segun fecha indicada en envase",
    fuente: []
  },
  {
    id: "galletas",
    nombre: "Galletas",
    categoria: "golosina",
    ingredientes: [GALLETAS],
    alergenos: ["gluten", "leche", "soja"],
    trazas: ["huevo", "frutos de cascara"],
    informacionNutricional: nutrition(170, 6.4, 25.5, 10.2, 2.6, 0.28),
    conservacion: "conservar en lugar fresco y seco",
    caducidad: "segun fecha indicada en envase",
    fuente: []
  },
  {
    id: "bizcocho",
    nombre: "Bizcocho",
    categoria: "golosina",
    ingredientes: [BIZCOCHO],
    alergenos: ["gluten", "huevo", "leche"],
    trazas: ["soja", "frutos de cascara"],
    informacionNutricional: nutrition(245, 9.8, 34.5, 18.8, 5.2, 0.36),
    conservacion: "conservar en lugar fresco y seco",
    caducidad: "segun fecha indicada en envase",
    fuente: []
  },
  {
    id: "donuts",
    nombre: "Donuts",
    categoria: "golosina",
    ingredientes: [DONUT],
    alergenos: ["gluten", "huevo", "leche", "soja"],
    trazas: ["frutos de cascara"],
    informacionNutricional: nutrition(220, 11.2, 27.4, 12.6, 3.8, 0.35),
    conservacion: "conservar en lugar fresco y seco",
    caducidad: "segun fecha indicada en envase",
    fuente: []
  },
  {
    id: "barritas",
    nombre: "Barritas",
    categoria: "golosina",
    ingredientes: [BARRITA],
    alergenos: ["gluten", "leche", "soja", "frutos de cascara"],
    trazas: ["cacahuetes"],
    informacionNutricional: nutrition(135, 4.2, 20.5, 8.6, 3.1, 0.16),
    conservacion: "conservar en lugar fresco y seco",
    caducidad: "segun fecha indicada en envase",
    fuente: []
  },
  {
    id: "tortitas",
    nombre: "Tortitas",
    categoria: "golosina",
    ingredientes: [TORTITA],
    alergenos: [],
    trazas: ["gluten", "leche", "soja", "sesamo"],
    informacionNutricional: nutrition(115, 1.6, 23.4, 1.3, 2.2, 0.22),
    conservacion: "conservar en lugar fresco y seco",
    caducidad: "segun fecha indicada en envase",
    fuente: []
  },
  {
    id: "caramelos",
    nombre: "Caramelos",
    categoria: "golosina",
    ingredientes: [CARAMELO],
    alergenos: [],
    trazas: ["sulfitos"],
    informacionNutricional: nutrition(22, 0, 5.5, 4.8, 0, 0),
    conservacion: "conservar en lugar fresco y seco",
    caducidad: "segun fecha indicada en envase",
    fuente: []
  },
  {
    id: "bocadillo-embutido-pequeno",
    nombre: "Bocadillo con Embutido Pequeno",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, EMBUTIDO],
    alergenos: ["gluten", "soja", "leche"],
    trazas: ["frutos de cascara"],
    informacionNutricional: nutrition(238, 3.4, 42.8, 3.9, 8.9, 0.98),
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: []
  },
  {
    id: "bocadillo-embutido-grande",
    nombre: "Bocadillo con Embutido Grande",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, EMBUTIDO],
    alergenos: ["gluten", "soja", "leche"],
    trazas: ["frutos de cascara"],
    informacionNutricional: nutrition(318, 4.6, 57.1, 5.2, 11.9, 1.31),
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: []
  },
  {
    id: "bocadillo-embutido-extra-pequeno",
    nombre: "Bocadillo con Embutido Extra Pequeno",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, EMBUTIDO, "extra de embutido"],
    alergenos: ["gluten", "soja", "leche"],
    trazas: ["frutos de cascara"],
    informacionNutricional: nutrition(285, 5.1, 43.5, 3.9, 14.5, 1.35),
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: []
  },
  {
    id: "bocadillo-embutido-extra-grande",
    nombre: "Bocadillo con Embutido Extra Grande",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, EMBUTIDO, "extra de embutido"],
    alergenos: ["gluten", "soja", "leche"],
    trazas: ["frutos de cascara"],
    informacionNutricional: nutrition(365, 6.4, 58.0, 5.2, 17.5, 1.75),
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: []
  },
  {
    id: "bocadillo-jamon-serrano-pequeno",
    nombre: "Bocadillo Jamon Serrano Pequeno",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, "jamon serrano"],
    alergenos: ["gluten"],
    trazas: [],
    informacionNutricional: nutrition(263, 5.0, 40.5, 3.6, 13.3, 1.26),
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: []
  },
  {
    id: "bocadillo-jamon-serrano-grande",
    nombre: "Bocadillo Jamon Serrano Grande",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, "jamon serrano"],
    alergenos: ["gluten"],
    trazas: [],
    informacionNutricional: nutrition(351, 6.7, 54.0, 4.7, 17.7, 1.68),
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: []
  },
  {
    id: "bocadillo-lomo-o-pechuga-pequeno",
    nombre: "Bocadillo de Lomo o Pechuga Pequeno",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, "lomo adobado o pechuga de pollo", PECHUGA_POLLO],
    alergenos: ["gluten", "soja"],
    trazas: ["leche"],
    informacionNutricional: nutrition(236, 3.2, 41.2, 3.7, 9.6, 0.95),
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: []
  },
  {
    id: "bocadillo-lomo-o-pechuga-grande",
    nombre: "Bocadillo de Lomo o Pechuga Grande",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, "lomo adobado o pechuga de pollo", PECHUGA_POLLO],
    alergenos: ["gluten", "soja"],
    trazas: ["leche"],
    informacionNutricional: nutrition(315, 4.3, 55.0, 4.9, 12.8, 1.27),
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: []
  },
  {
    id: "bocadillo-vegetal-atun-pequeno",
    nombre: "Bocadillo de Vegetal Atun Pequeno",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, VEGETAL_ATUN],
    alergenos: ["gluten", "pescado", "soja", "huevo"],
    trazas: [],
    informacionNutricional: nutrition(275, 6.7, 44.5, 4.2, 7.9, 1.04),
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: []
  },
  {
    id: "bocadillo-vegetal-atun-grande",
    nombre: "Bocadillo de Vegetal Atun Grande",
    categoria: "bocadillo",
    ingredientes: [PAN_BLANCO, VEGETAL_ATUN],
    alergenos: ["gluten", "pescado", "soja", "huevo"],
    trazas: [],
    informacionNutricional: nutrition(367, 8.9, 59.3, 5.6, 10.5, 1.39),
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: []
  },
  {
    id: "ingrediente-extra-queso",
    nombre: "Ingrediente Extra queso",
    categoria: "extra",
    ingredientes: [QUESO_GOUDA],
    alergenos: ["leche"],
    trazas: [],
    informacionNutricional: nutrition(54, 4.2, 0.2, 0.2, 3.8, 0.22),
    conservacion: "conservar refrigerado entre 0 y 4 oC",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "ingrediente-extra-tomate-lechuga",
    nombre: "Ingrediente Extra Tomate y lechuga",
    categoria: "extra",
    ingredientes: ["tomate", "lechuga"],
    alergenos: [],
    trazas: [],
    informacionNutricional: nutrition(8, 0.1, 1.5, 1.2, 0.4, 0.01),
    conservacion: "conservar refrigerado entre 0 y 4 oC",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "salsa-mojo-alioli-mostaza",
    nombre: "Salsa Mojo Alioli Mostaza",
    categoria: "extra",
    ingredientes: [SALSAS],
    alergenos: ["huevo", "mostaza"],
    trazas: ["sulfitos"],
    informacionNutricional: nutrition(48, 4.9, 0.6, 0.3, 0.2, 0.18),
    conservacion: "conservar refrigerado entre 0 y 4 oC",
    caducidad: "consumir en el momento de servicio",
    fuente: []
  },
  {
    id: "pulguita-pan-integral",
    nombre: "Pulguita Pan Integral",
    categoria: "bocadillo",
    ingredientes: [PAN_INTEGRAL],
    alergenos: ["gluten"],
    trazas: ["sesamo", "soja"],
    informacionNutricional: nutrition(210, 2.9, 39.5, 3.2, 7.1, 0.72),
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: []
  },
  {
    id: "croissant",
    nombre: "Croissant",
    categoria: "croissant",
    ingredientes: [CROISSANT_BASE],
    alergenos: ["gluten", "soja"],
    trazas: ["leche", "huevo"],
    informacionNutricional: nutrition(295, 17.5, 29.0, 7.2, 5.8, 0.75),
    conservacion: CONSERVACION_BASE,
    caducidad: CADUCIDAD_BASE,
    fuente: []
  }
];

function normalizedText(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function words(value: string): string[] {
  return normalizedText(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function resolveProductInfo(productName: string): ProductInfo | null {
  const normalizedName = normalizedText(productName);
  const exact = productInfoCatalog.find((item) => normalizedName === normalizedText(item.nombre ?? ""));
  if (exact) return exact;

  const nameWords = words(productName);
  return (
    productInfoCatalog.find((item) => {
      const catalogName = normalizedText(item.nombre ?? "");
      const catalogWords = words(item.nombre ?? "");
      return (
        normalizedName.includes(catalogName) ||
        catalogName.includes(normalizedName) ||
        catalogWords.every((word) => nameWords.includes(word))
      );
    }) ?? null
  );
}
