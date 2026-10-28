// Perillas del reglamento del puntaje, versión 1.
// La explicación en palabras está en docs/reglamento-puntaje.md.
// Si cambiás un número acá, actualizá también el documento y volvé a abrir
// la página de pruebas (tests/index.html) para ver que todo siga en verde.

// ---------------------------------------------------------------------------
// Nota de calidad
// ---------------------------------------------------------------------------

export const NOTA_INICIAL = 5;
export const NOTA_MINIMA = 1;
export const NOTA_MAXIMA = 10;

// Semáforo de la agencia de alimentos del Reino Unido, cada 100 g.
// "bajo": hasta este valor no resta. "alto": por encima es exceso.
export const LIMITES = {
  azucares: { bajo: 5, alto: 22.5 },
  saturadas: { bajo: 1.5, alto: 5 },
  sal: { bajo: 0.3, alto: 1.5 },
  grasa: { bajo: 3, alto: 17.5 },
};

// En bebidas (cada 100 ml) los límites de arriba se multiplican por esto.
export const FACTOR_BEBIDAS = 0.5;

// Lo que resta cada nivel de azúcar, saturadas y sal.
export const RESTA_POR_NIVEL = { bajo: 0, medio: -0.5, alto: -1 };

// Proteína en gramos cada 100 kcal. Se toma el primer escalón que se cumple.
export const PROTEINA_ESCALONES = [
  { desde: 10, puntos: 3 },
  { desde: 5, puntos: 2 },
  { desde: 3, puntos: 1 },
];

// Fibra: nivel 1 ("fuente de") suma 1, nivel 2 ("alto en") suma 2.
// Alcanza con cumplir por 100 g o por 100 kcal.
export const FIBRA_NIVELES = [
  { nivel: 2, gramos: 6, por100kcal: 3 },
  { nivel: 1, gramos: 3, por100kcal: 1.5 },
];

export const PUNTOS_PROCESAMIENTO = {
  natural: 2,
  minimo: 1,
  procesado: 0,
  ultra: -0.5,
};

// Grasas buenas: al menos esta grasa, y las saturadas como mucho esta fracción de la grasa.
// Solo en productos naturales o mínimamente procesados.
export const GRASAS_BUENAS = { grasaMinima: 10, fraccionSaturadasMaxima: 1 / 5, puntos: 1 };

// Calorías cada 100 g. No restan en productos naturales o mínimamente procesados.
export const CALORIAS_ESCALONES = [
  { masDe: 500, puntos: -1 },
  { masDe: 400, puntos: -0.5 },
];

// Techos con exigencia Equilibrada.
export const TECHOS = {
  azucarAgregado: 4, // exceso de azúcar y casi todo agregado
  sal: 5, // exceso de sal
  saturadas: 4, // exceso de saturadas con grasa mayormente saturada
  dosExcesos: 3, // dos o más de los tres de arriba
  bebidaAzucarada: 2, // bebida con azúcar agregado
  ultraprocesado: 6,
  calorias: 8, // más de CALORIAS_TECHO
  parcial: 7, // sin foto de ingredientes (no cambia con la exigencia)
};

export const CALORIAS_TECHO = 500;
// Una bebida es "azucarada" si tiene azúcar agregado y más de esto (g cada 100 ml).
export const BEBIDA_AZUCARADA_MINIMO = 2.5;
// La grasa es "mayormente saturada" si las saturadas pasan esta fracción.
export const FRACCION_SATURADAS_MALA = 1 / 3;
// Si no hay estimación de azúcar agregado, se considera "casi todo agregado"
// cuando algún azúcar aparece entre estos primeros ingredientes.
export const POSICIONES_AZUCAR_PRINCIPAL = 3;

// Cuánto se mueven los techos según la exigencia.
export const AJUSTE_EXIGENCIA = { flexible: 1, equilibrada: 0, estricta: -1 };

// En productos naturales o mínimamente procesados, los techos de sal y saturadas
// suben esto, y no se aplica el techo de dos excesos.
export const AJUSTE_TECHOS_SIMPLES = 1;

// Aceites: nota fija según el tipo. Los demás tipos ("solida": coco, palma,
// manteca) se calculan con la fórmula normal.
export const NOTA_ACEITES = { oliva: 7, colza: 6, otro_vegetal: 5 };

// ---------------------------------------------------------------------------
// Categorías de producto (las elige la IA al leer la etiqueta)
// ---------------------------------------------------------------------------

export const CATEGORIAS = [
  'yogures_lacteos',
  'quesos_frescos',
  'quesos_curados',
  'panes',
  'cereales_avena',
  'barritas',
  'galletas',
  'snacks_salados',
  'chocolates_golosinas',
  'frutos_secos',
  'semillas',
  'aceites',
  'untables',
  'salsas',
  'bebidas',
  'carnes',
  'embutidos',
  'pescados',
  'huevos',
  'legumbres',
  'frutas_verduras',
  'pastas_arroz',
  'platos_preparados',
  'postres',
  'otros',
];

// Se comen en poca cantidad: con nota desde POCA_CANTIDAD_NOTA_MINIMA nunca dan "Resta".
export const CATEGORIAS_POCA_CANTIDAD = ['aceites', 'frutos_secos', 'semillas', 'quesos_curados', 'salsas'];

// Productos que, aunque tengan pocos ingredientes, nunca cuentan como natural
// ni mínimamente procesado (por ejemplo, papas fritas: papa, aceite y sal).
export const CATEGORIAS_AL_MENOS_PROCESADO = [
  'panes',
  'barritas',
  'galletas',
  'snacks_salados',
  'chocolates_golosinas',
  'embutidos',
  'platos_preparados',
  'postres',
];

// Tipos de ingrediente que permiten "mínimamente procesado" cuando acompañan a un alimento.
export const TIPOS_MINIMAMENTE_PROCESADO = ['alimento', 'sal', 'condimento', 'fermento', 'grasa'];

// ---------------------------------------------------------------------------
// Línea de objetivo
// ---------------------------------------------------------------------------

export const ASPECTOS = ['proteina', 'calorias', 'fibra', 'azucar', 'sal', 'saturadas', 'procesamiento'];

// Votos de cada aspecto según el objetivo principal.
// Orden: proteína, calorías, fibra, azúcar, sal, saturadas, procesamiento.
const fila = (p, c, f, a, s, sat, proc) => ({
  proteina: p,
  calorias: c,
  fibra: f,
  azucar: a,
  sal: s,
  saturadas: sat,
  procesamiento: proc,
});

export const VOTOS_POR_OBJETIVO = {
  bajar_grasa: fila(3, 3, 1, 2, 1, 1, 1),
  mantener_peso: fila(1, 2, 1, 1, 1, 1, 1),
  ganar_musculo: fila(4, 1, 1, 1, 1, 1, 1),
  rendir_deporte: fila(2, 0, 1, 1, 0, 1, 1),
  comer_sano: fila(1, 1, 2, 2, 2, 2, 2),
  mas_energia: fila(1, 1, 2, 3, 1, 1, 1),
  digestion: fila(0, 0, 4, 1, 1, 1, 2),
  salud_largo_plazo: fila(1, 1, 2, 2, 3, 3, 3),
  aprender: fila(1, 1, 2, 2, 2, 2, 2),
};

// Mientras el usuario no eligió objetivo, se usa este.
export const OBJETIVO_NEUTRO = 'comer_sano';

// El objetivo secundario suma sus votos multiplicados por esto.
export const PESO_OBJETIVO_SECUNDARIO = 0.5;

export const VOTOS_PRIORIDADES = {
  mas_proteina: { proteina: 2 },
  mas_saciedad: { proteina: 1, fibra: 1, calorias: 1 },
  mas_fibra: { fibra: 2 },
  menos_azucar: { azucar: 2 },
  menos_sal: { sal: 2 },
  menos_saturadas: { saturadas: 2 },
  menos_calorias: { calorias: 2 },
  menos_ultraprocesados: { procesamiento: 2 },
};

export const VOTOS_SALUD = {
  presion_alta: { sal: 3 },
  colesterol: { saturadas: 3 },
  glucosa: { azucar: 3 },
};

export const VOTOS_DIFICULTADES = {
  hambre: { proteina: 1, fibra: 1, calorias: 1 },
  salteo_comidas: { proteina: 1, fibra: 1, calorias: 1 },
  antojos_dulce: { azucar: 1 },
  proteina: { proteina: 1 },
};

// Dieta keto o baja en carbos: se suma el aspecto carbohidratos.
export const KETO = { votos: 3, carbohidratosMaximo: 10 };

// Cómo vota cada aspecto.
export const SENALES = {
  proteina: { aFavorDesde: 5, enContraMenosDe: 3 }, // g cada 100 kcal
  calorias: { aFavorHasta: 150, enContraMasDe: 300 }, // kcal cada 100 g
};

// Decisión de la línea.
export const LINEA = {
  margen: 0.25, // un lado tiene que ganar por más de esta fracción del total de votos
  notaMinimaSuma: 6,
  notaMaximaResta: 3,
  pocaCantidadNotaMinima: 4,
};

// ---------------------------------------------------------------------------
// Sirve para (máximo 2, en este orden)
// ---------------------------------------------------------------------------

export const SIRVE_PARA_MAXIMO = 2;

export const SIRVE_PARA = {
  musculo: { proteinaPor100kcal: 5 },
  // La porción (el envase si es individual, si no la porción típica) tiene que
  // dar al menos porcionProteinaMinima g de proteína o porcionFibraMinima g de fibra.
  saciedad: {
    kcalMaximo: 200,
    proteinaAlta: 5,
    proteinaFuente: 3,
    fibraMinima: 3,
    porcionProteinaMinima: 15,
    porcionFibraMinima: 6,
  },
  corazon: {}, // grasas buenas o pescado azul
  energia_sostenida: { carbohidratosMinimo: 30, fibraMinima: 5, fraccionAzucarMaxima: 1 / 4 },
  energia_rapida: { azucaresMinimo: 20, azucaresMinimoBebidas: 8, grasaMenosDe: 10, fibraMenosDe: 3 },
};

// ---------------------------------------------------------------------------
// De un vistazo
// ---------------------------------------------------------------------------

export const VISTAZO = {
  caloriasAltasMasDe: 400,
  pocasCaloriasHasta: 150,
  proteinaBajaMenosDe: 3, // g cada 100 kcal
  proteinaBajaVotosMinimos: 2, // solo si la proteína pesa en el perfil
  proteinaBuenaDesde: 3,
  proteinaAltaDesde: 5,
};
