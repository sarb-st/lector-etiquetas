// Alimentos sin código de barras, con datos oficiales del BLS 4.0 (Max Rubner-Institut, CC BY 4.0).
// El BLS no trae lista de ingredientes: se arma una según el tipo de alimento, para que la
// fórmula sepa el nivel de procesamiento. Cuando es una suposición (pan, quesos, fiambres),
// la ficha queda marcada con ingredientesEstimados: no se afirma "sin azúcar agregado" ni se
// revisan alérgenos sobre esa lista. Ver docs/reglamento-puntaje.md, "Alimentos sin código".

import { ilustracionDe } from '../ui/ilustraciones.js';

const ing = (texto, tipo, ultra = false) => ({ texto, traduccion: texto, tipo, ultra });

// Cómo se arma la lista de ingredientes de cada tipo. estimado: es una suposición.
const TIPOS = {
  natural: (a) => ({ lista: [ing(a.de, 'alimento')], estimado: false }),
  mezcla: (a) => ({ lista: [ing(a.de, 'alimento'), ing(a.de, 'alimento')], estimado: false }),
  salado: (a) => ({ lista: [ing(a.de, 'alimento'), ing('Salz', 'sal')], estimado: false }),
  con_grasa: (a) => ({ lista: [ing(a.de, 'alimento'), ing('Pflanzenöl', 'grasa')], estimado: false }),
  con_grasa_salado: (a) => ({ lista: [ing(a.de, 'alimento'), ing('Pflanzenöl', 'grasa'), ing('Salz', 'sal')], estimado: false }),
  azucarado: (a) => ({ lista: [ing(a.de, 'alimento'), ing('Zucker', 'azucar')], estimado: false }),
  marinado: (a) => ({ lista: [ing(a.de, 'alimento'), ing('Marinade', 'condimento'), ing('Salz', 'sal')], estimado: true }),
  fermentado: (a) => ({ lista: [ing(a.de, 'alimento'), ing('Salz', 'sal')], estimado: false }),
  salmuera: (a) => ({ lista: [ing(a.de, 'alimento'), ing('Wasser', 'agua'), ing('Salz', 'sal')], estimado: true }),
  tofu: () => ({ lista: [ing('Sojabohnen', 'alimento'), ing('Wasser', 'agua'), ing('Gerinnungsmittel', 'aditivo')], estimado: true }),
  fideos: () => ({ lista: [ing('Reismehl', 'harina'), ing('Wasser', 'agua')], estimado: true }),
  hamburguesa: (a) => ({
    lista: [ing(a.de, 'alimento'), ing('Paniermehl', 'harina'), ing('Salz', 'sal'), ing('Gewürze', 'condimento')],
    estimado: true,
  }),
  pan: () => ({ lista: [ing('Mehl', 'harina'), ing('Wasser', 'agua'), ing('Salz', 'sal'), ing('Hefe/Sauerteig', 'fermento')], estimado: true }),
  pan_panceta: () => ({
    lista: [ing('Mehl', 'harina'), ing('Wasser', 'agua'), ing('Speck', 'alimento'), ing('Salz', 'sal'), ing('Hefe', 'fermento')],
    estimado: true,
  }),
  pan_queso: () => ({
    lista: [ing('Mehl', 'harina'), ing('Wasser', 'agua'), ing('Käse', 'alimento'), ing('Salz', 'sal'), ing('Hefe', 'fermento')],
    estimado: true,
  }),
  pan_proteico: () => ({
    lista: [ing('Weizeneiweiß', 'aditivo', true), ing('Mehl', 'harina'), ing('Saaten', 'alimento'), ing('Salz', 'sal')],
    estimado: true,
  }),
  queso: () => ({ lista: [ing('Milch', 'alimento'), ing('Salz', 'sal'), ing('Kulturen', 'fermento'), ing('Lab', 'fermento')], estimado: true }),
  lacteo_fermentado: () => ({ lista: [ing('Milch', 'alimento'), ing('Kulturen', 'fermento')], estimado: false }),
  crema_queso: () => ({ lista: [ing('Käse', 'alimento'), ing('Butter', 'grasa'), ing('Gewürze', 'condimento')], estimado: true }),
  bebida_yogur: () => ({ lista: [ing('Joghurt', 'alimento'), ing('Wasser', 'agua'), ing('Salz', 'sal')], estimado: false }),
  embutido: (a) => ({
    lista: [ing(a.de, 'alimento'), ing('Speck', 'grasa'), ing('Nitritpökelsalz', 'sal'), ing('Gewürze', 'condimento')],
    estimado: true,
  }),
  embutido_ultra: (a) => ({
    lista: [ing(a.de, 'alimento'), ing('Stärke', 'harina'), ing('Phosphat', 'aditivo', true), ing('Nitritpökelsalz', 'sal')],
    estimado: true,
  }),
};

// Lo que se come de una vez, aproximado, por categoría (gramos). Sirve para "Saciedad".
const PORCION_TIPICA = {
  frutas_verduras: 150,
  carnes: 150,
  pescados: 150,
  huevos: 60,
  panes: 60,
  quesos_curados: 30,
  quesos_frescos: 100,
  yogures_lacteos: 200,
  embutidos: 30,
  frutos_secos: 30,
  semillas: 15,
  legumbres: 60,
  cereales_avena: 50,
  pastas_arroz: 75,
};

// Pescado azul: el que tiene al menos 1 g de omega-3 cada 100 g.
const OMEGA3_PESCADO_AZUL = 1;

export function fichaDesdeBLS(a) {
  const [kcal, proteina, grasa, saturadas, carbohidratos, azucares, fibra, sal] = a.n;
  const { lista, estimado } = (TIPOS[a.t] ?? TIPOS.natural)(a);
  return {
    legible: true,
    nombre: a.es,
    tipoDetectado: a.es,
    categoria: a.cat,
    esBebida: a.b === 1,
    nutrientes: { kcal, proteina, grasa, saturadas, carbohidratos, azucares, fibra, sal },
    ingredientes: lista,
    ingredientesEstimados: estimado,
    azucarAgregadoEstimado: null,
    alergenos: [],
    trazas: null,
    contenidoEnvase: null,
    porcionIndividual: false,
    porcionTipica: PORCION_TIPICA[a.cat] ?? null,
    pescadoAzul: a.cat === 'pescados' && (a.x?.FAPUN3 ?? 0) >= OMEGA3_PESCADO_AZUL,
    tipoAceite: null,
    micronutrientes: a.x ?? {},
    ilustracion: ilustracionDe(a.c, a.de, a.cat),
    bls: { codigo: a.c, nombreAleman: a.de },
  };
}

// --- Búsqueda ---------------------------------------------------------------

let alimentos = null;
export async function cargarBLS() {
  if (!alimentos) {
    const { ALIMENTOS_BLS } = await import('./bls-es.js');
    alimentos = ALIMENTOS_BLS.map((a) => ({ ...a, busqueda: normalizar(`${a.es} ${a.de}`) }));
  }
  return alimentos;
}
export const blsCargado = () => alimentos;

export function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase();
}

// Lo más común en el súper aparece primero cuando coincide igual que otros
// (por ejemplo, "huevo" muestra primero el de gallina).
const COMUNES = new Set([
  'E111100', 'F110100', 'F503100', 'F603100', 'F301100', 'F310100', 'F502100', 'F130100',
  'G561100', 'G620100', 'G480100', 'G520100', 'G312100', 'K110100', 'K120100',
  'M111300', 'M111200', 'M141300', 'M402600', 'M304600', 'M032100',
  'V4A6100', 'V416100', 'V413000', 'U010100', 'U050100', 'T410100', 'T204100',
  'B101000', 'B311000', 'B511000', 'B221000', 'W424000', 'W140000',
  'C133000', 'C352000', 'H120100', 'H210100', 'H725100',
]);

// Todas las palabras tienen que aparecer. Primero lo que empieza con lo buscado,
// después lo que tiene una palabra que empieza así; entre iguales, lo común y el nombre más corto.
export function buscarEn(lista, texto, maximo = 40) {
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
  if (!palabras.length) return [];
  const primera = palabras[0];
  return lista
    .filter((a) => palabras.every((p) => a.busqueda.includes(p)))
    .map((a) => {
      const es = normalizar(a.es);
      // "Banana/plátano": cada nombre después de una barra cuenta como comienzo.
      const orden = es.split('/').some((parte) => parte.trim().startsWith(primera)) ? 0 : new RegExp(`(^|[\\s/(])${primera.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(es) ? 1 : 2;
      return { a, orden };
    })
    .sort(
      (x, y) =>
        x.orden - y.orden || Number(!COMUNES.has(x.a.c)) - Number(!COMUNES.has(y.a.c)) || x.a.es.length - y.a.es.length,
    )
    .slice(0, maximo)
    .map((x) => x.a);
}

export function buscarPorCodigo(lista, codigo) {
  return lista.find((a) => a.c === codigo) ?? null;
}
