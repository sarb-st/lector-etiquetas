// Productos de ejemplo: los usan las pruebas automáticas (reglamento, sección 5)
// y el modo de prueba de la app. Valores aproximados, cada 100 g (o 100 ml en bebidas).

const ing = (texto, tipo, ultra = false) => ({ texto, tipo, ultra });

export const barrita = {
  nombre: 'Barrita de avena y chocolate',
  categoria: 'barritas',
  esBebida: false,
  nutrientes: { kcal: 430, grasa: 16, saturadas: 6, carbohidratos: 62, azucares: 24, fibra: 5, proteina: 6.9, sal: 0.25 },
  ingredientes: [
    ing('Vollkornhaferflocken', 'alimento'),
    ing('Glukosesirup', 'azucar', true),
    ing('Zucker', 'azucar'),
    ing('Palmöl', 'grasa'),
    ing('Schokolade', 'azucar'),
    ing('Emulgator Sojalecithin', 'aditivo', true),
    ing('Aroma', 'aditivo', true),
  ],
  azucarAgregadoEstimado: null,
  tipoAceite: null,
  pescadoAzul: false,
};

export const skyr = {
  nombre: 'Skyr natural',
  categoria: 'yogures_lacteos',
  esBebida: false,
  nutrientes: { kcal: 63, grasa: 0.2, saturadas: 0.1, carbohidratos: 4, azucares: 4, fibra: 0, proteina: 11, sal: 0.1 },
  ingredientes: [ing('entrahmte Milch', 'alimento'), ing('Milchsäurekulturen', 'fermento')],
  contenidoEnvase: 450,
  porcionIndividual: false,
  porcionTipica: 150,
};

export const nueces = {
  nombre: 'Nueces naturales',
  categoria: 'frutos_secos',
  nutrientes: { kcal: 654, grasa: 65, saturadas: 6.1, carbohidratos: 7, azucares: 2.6, fibra: 6.7, proteina: 15, sal: 0.01 },
  ingredientes: [ing('Walnusskerne', 'alimento')],
};

export const yogurProteicoSinIngredientes = {
  nombre: 'Yogur proteico de vainilla',
  categoria: 'yogures_lacteos',
  nutrientes: { kcal: 72, grasa: 0.3, saturadas: 0.2, carbohidratos: 6.5, azucares: 6, fibra: 0, proteina: 10, sal: 0.12 },
  ingredientes: null,
  contenidoEnvase: 200,
  porcionIndividual: true,
  porcionTipica: null,
};

// Pudding proteico de sémola: pote de 400 g, 30 g de proteína el pote.
const nutrientesPudding = { kcal: 79, grasa: 1, saturadas: 0.6, carbohidratos: 9.6, azucares: 4.3, fibra: 0.5, proteina: 7.5, sal: 0.2 };
const ingredientesPudding = [
  ing('entrahmte Milch', 'alimento'),
  ing('Milchproteinkonzentrat', 'aditivo', true),
  ing('Weichweizengrieß', 'harina'),
  ing('Stärke', 'harina'),
  ing('Süßungsmittel Sucralose', 'aditivo', true),
  ing('Aroma', 'aditivo', true),
];

export const puddingGrande = {
  nombre: 'Pudding proteico de sémola, 400 g',
  categoria: 'postres',
  nutrientes: nutrientesPudding,
  ingredientes: ingredientesPudding,
  contenidoEnvase: 400,
  porcionIndividual: true,
  porcionTipica: null,
};

// El mismo pudding en un envase chico de 125 g: la porción da poca proteína.
export const puddingChico = { ...puddingGrande, nombre: 'Pudding proteico de sémola, 125 g', contenidoEnvase: 125 };

// Sin datos de envase ni de porción: no se puede saber si la porción alcanza.
export const puddingSinEnvase = { ...puddingGrande, nombre: 'Pudding proteico sin envase', contenidoEnvase: null };

export const panIntegral = {
  nombre: 'Pan integral',
  categoria: 'panes',
  nutrientes: { kcal: 230, grasa: 1.5, saturadas: 0.3, carbohidratos: 40, azucares: 2.5, fibra: 7, proteina: 9, sal: 1.1 },
  ingredientes: [
    ing('Vollkornweizenmehl', 'harina'),
    ing('Wasser', 'agua'),
    ing('Hefe', 'fermento'),
    ing('Salz', 'sal'),
  ],
};

export const avena = {
  nombre: 'Copos de avena',
  categoria: 'cereales_avena',
  nutrientes: { kcal: 372, grasa: 7, saturadas: 1.3, carbohidratos: 59, azucares: 1, fibra: 10, proteina: 13.5, sal: 0.01 },
  ingredientes: [ing('Haferflocken', 'alimento')],
};

export const palta = {
  nombre: 'Palta',
  categoria: 'frutas_verduras',
  nutrientes: { kcal: 160, grasa: 15, saturadas: 2.1, carbohidratos: 2, azucares: 0.7, fibra: 6.7, proteina: 2, sal: 0.02 },
  ingredientes: [ing('Avocado', 'alimento')],
};

export const quesoCurado = {
  nombre: 'Queso curado (Bergkäse)',
  categoria: 'quesos_curados',
  nutrientes: { kcal: 400, grasa: 32, saturadas: 20, carbohidratos: 0, azucares: 0, fibra: 0, proteina: 28, sal: 1.8 },
  ingredientes: [
    ing('Rohmilch', 'alimento'),
    ing('Speisesalz', 'sal'),
    ing('Lab', 'fermento'),
    ing('Milchsäurekulturen', 'fermento'),
  ],
};

const aceite = (nombre, tipoAceite, saturadas) => ({
  nombre,
  categoria: 'aceites',
  nutrientes: { kcal: 884, grasa: 100, saturadas, carbohidratos: 0, azucares: 0, fibra: 0, proteina: 0, sal: 0 },
  ingredientes: [ing(nombre, 'grasa')],
  tipoAceite,
});

export const aceiteOliva = aceite('Aceite de oliva virgen extra', 'oliva', 14);
export const aceiteColza = aceite('Aceite de colza', 'colza', 7);
export const aceiteGirasol = aceite('Aceite de girasol', 'otro_vegetal', 11);
export const aceiteCoco = { ...aceite('Aceite de coco', 'solida', 87), nutrientes: { kcal: 862, grasa: 100, saturadas: 87, carbohidratos: 0, azucares: 0, fibra: 0, proteina: 0, sal: 0 } };

export const papasFritas = {
  nombre: 'Papas fritas de paquete',
  categoria: 'snacks_salados',
  nutrientes: { kcal: 536, grasa: 34, saturadas: 3.1, carbohidratos: 50, azucares: 0.5, fibra: 4.4, proteina: 6.5, sal: 1.4 },
  ingredientes: [ing('Kartoffeln', 'alimento'), ing('Sonnenblumenöl', 'grasa'), ing('Salz', 'sal')],
};

export const cocaCola = {
  nombre: 'Coca-Cola',
  categoria: 'bebidas',
  esBebida: true,
  nutrientes: { kcal: 42, grasa: 0, saturadas: 0, carbohidratos: 10.6, azucares: 10.6, fibra: 0, proteina: 0, sal: 0 },
  ingredientes: [
    ing('Wasser', 'agua'),
    ing('Zucker', 'azucar'),
    ing('Kohlensäure', 'aditivo'),
    ing('Farbstoff E150d', 'aditivo', true),
    ing('Säuerungsmittel Phosphorsäure', 'aditivo'),
    ing('natürliches Aroma', 'aditivo', true),
    ing('Koffein', 'aditivo'),
  ],
};

export const gominolas = {
  nombre: 'Gomitas de fruta',
  categoria: 'chocolates_golosinas',
  nutrientes: { kcal: 343, grasa: 0.5, saturadas: 0.1, carbohidratos: 77, azucares: 46, fibra: 0, proteina: 6.9, sal: 0.07 },
  ingredientes: [
    ing('Glukosesirup', 'azucar', true),
    ing('Zucker', 'azucar'),
    ing('Gelatine', 'aditivo'),
    ing('Aroma', 'aditivo', true),
  ],
};

// Perfil de los mockups: bajar grasa, priorizando proteína.
export const perfilBajarGrasa = {
  objetivos: ['bajar_grasa'],
  prioridades: ['mas_proteina'],
  exigencia: 'equilibrada',
};
