// "¿Me cae bien?": alérgenos, intolerancias y lo que la persona evita.
// La IA encuentra los ingredientes (también con nombres escondidos); el código
// aplica las reglas fijas de la definición (sección 8) y decide el veredicto.

import { pedirJSON } from './cliente.js';
import { ALERGENOS } from './instrucciones.js';
import { idioma } from '../i18n/index.js';

export const INTOLERANCIAS = ['lactosa', 'fructosa', 'polioles', 'fodmap'];
export const DIETAS = ['vegetariana', 'vegana'];
export const EVITA_RAPIDOS = ['cerdo', 'alcohol', 'picante', 'cafeina', 'carne_roja'];
// Condiciones de salud que se revisan acá (la del perfil, pregunta de salud).
export const SALUD_CHEQUEO = ['glucosa'];
// Nunca dan "no apto": dependen de la cantidad y de cada persona.
const NUNCA_NO_APTO = ['intolerancia:fodmap', 'salud:glucosa'];

const ESTADOS = ['no_apto', 'revisar', 'apto'];

// Las restricciones se identifican con un texto: "alergia:gluten", "intolerancia:fodmap",
// "dieta:vegana", "salud:glucosa", "evita:cerdo" o "evita:texto libre".
export function restriccionesDelPerfil(perfil) {
  const p = perfil ?? {};
  const lista = [
    ...(p.alergias ?? []).map((a) => `alergia:${a}`),
    ...(p.intolerancias ?? []).map((i) => `intolerancia:${i}`),
    ...(DIETAS.includes(p.alimentacion) ? [`dieta:${p.alimentacion}`] : []),
    ...SALUD_CHEQUEO.filter((s) => (p.salud ?? []).includes(s)).map((s) => `salud:${s}`),
    ...(p.evitaRapidos ?? []).map((e) => `evita:${e}`),
  ];
  const libre = (p.evitaTexto ?? '').split(/[,;]/).map((x) => x.trim()).filter(Boolean);
  lista.push(...libre.map((x) => `evita:${x}`));
  return lista;
}

const objeto = (propiedades) => ({
  type: 'object',
  properties: propiedades,
  required: Object.keys(propiedades),
  additionalProperties: false,
});

const ESQUEMA_CHEQUEO = objeto({
  legible: { type: 'boolean' },
  nombre: { type: 'string' },
  restricciones: {
    type: 'array',
    items: objeto({
      clave: { type: 'string' },
      estado: { type: 'string', enum: ESTADOS },
      ingredientes: {
        type: 'array',
        items: objeto({ texto: { type: 'string' }, traduccion: { type: 'string' } }),
      },
      explicacion: { type: 'string' },
    }),
  },
  trazas: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  trazasTraduccion: { anyOf: [{ type: 'string' }, { type: 'null' }] },
});

const SISTEMA_CHEQUEO = `Revisás la lista de ingredientes de un alimento envasado (sobre todo de supermercados alemanes) contra las restricciones de una persona. No opinás de nutrición.

Para cada restricción recibida devolvé un objeto con la misma clave:
- estado: no_apto si un ingrediente la viola con seguridad; revisar si hay un ingrediente dudoso o que depende de la cantidad o del origen; apto si no encontraste nada.
- ingredientes: los ingredientes que la disparan, con texto exactamente como figura en el envase y traduccion al idioma del usuario. Vacío si es apto.
- explicacion: una frase corta y clara para alguien sin conocimientos ("La espelta es un tipo de trigo." / "No encontré leche ni derivados en los ingredientes.").

Reglas:
- Los 14 alérgenos de la UE van destacados en el envase (negrita o mayúsculas). Buscá también los nombres escondidos: Dinkel, Gerste, Gerstenmalzextrakt, Roggen, Grünkern, Emmer, Kamut, Seitan (gluten; la avena sin "glutenfrei" es revisar); Molke, Kasein, Milchpulver, Butterreinfett, Laktose (leche); Eiklar, Eigelb, Lysozym, Albumin (huevo); Lecithin (Soja), E322 de soja (soja); E220 a E228 (sulfitos); Lupine (altramuces).
- Alergia a la leche e intolerancia a la lactosa son distintas: un producto "laktosefrei" con leche es no_apto para la alergia y apto para la intolerancia.
- Fructosa: miel, agave, jarabe de fructosa o de glucosa-fructosa, mucha fruta concentrada.
- Polioles: sorbitol, maltitol, xilitol, manitol, isomalt, eritritol (E420, E421, E953, E965, E966, E967, E968).
- FODMAP: fructanos (trigo, centeno, cebolla, ajo, inulina, fibra de achicoria), fructosa, polioles, lactosa y legumbres. Nunca no_apto: como mucho revisar, porque depende de la cantidad y de cada persona.
- salud:glucosa (diabetes o glucosa alta) no es una alergia. revisar si hay azúcares agregados (azúcar, jarabes, dextrosa, glucosa, fructosa, miel, concentrados de fruta usados para endulzar) o carbohidratos que pasan rápido a la sangre (maltodextrina, almidón modificado, harina refinada o arroz inflado como ingrediente principal y sin fibra); apto si no hay nada de eso. Nunca no_apto. En explicacion decí concretamente qué encontraste y, si te paso los nutrientes, cuántos gramos de azúcares y de carbohidratos tiene cada 100 g ("Tiene jarabe de glucosa: 24 g de azúcares y 62 g de carbohidratos cada 100 g."). No des indicaciones médicas.
- Vegetariana: carne, pescado, gelatina, cuajo animal, cochinilla (E120) la violan. Vegana: además leche, huevo, miel y sus derivados.
- "evita:" es algo que la persona no quiere comer por gusto, religión o costumbre (por ejemplo cerdo, alcohol, picante, cafeína, carne roja, o un texto libre): buscalo con sentido común, incluidos derivados (gelatina de cerdo, extracto de vino, guaraná para cafeína).
- Las trazas ("Kann Spuren von … enthalten") no son ingredientes: no cambian el estado. Devolvelas aparte en trazas, tal como figuran, y en trazasTraduccion traducidas.
- Si no hay lista de ingredientes legible, legible: false y todo en revisar.
- nombre: el nombre del producto si se ve; si no, una descripción corta.`;

// Aplica las reglas fijas y arma el veredicto.
export function veredicto(restricciones, respuesta) {
  const porClave = new Map((respuesta.restricciones ?? []).map((r) => [r.clave, r]));
  const lista = restricciones.map((clave) => {
    const r = porClave.get(clave) ?? { clave, estado: 'revisar', ingredientes: [], explicacion: '' };
    // FODMAP y glucosa nunca dan "no apto": dependen de la cantidad y de cada persona.
    const estado = NUNCA_NO_APTO.includes(clave) && r.estado === 'no_apto' ? 'revisar' : r.estado;
    return { ...r, clave, estado: respuesta.legible === false ? 'revisar' : estado };
  });
  const orden = { no_apto: 0, revisar: 1, apto: 2 };
  lista.sort((a, b) => orden[a.estado] - orden[b.estado]);
  const general = lista.some((r) => r.estado === 'no_apto')
    ? 'no_apto'
    : lista.some((r) => r.estado === 'revisar')
      ? 'revisar'
      : 'apto';
  return {
    general,
    restricciones: lista,
    trazas: respuesta.trazas ?? null,
    trazasTraduccion: respuesta.trazasTraduccion ?? null,
    nombre: respuesta.nombre ?? '',
    legible: respuesta.legible !== false,
  };
}

// foto: { base64, tipo } de la lista de ingredientes; o texto: ingredientes como texto.
// nutrientes: los de la tabla cada 100 g, si se conocen (para la glucosa).
export async function chequear({ foto = null, texto = null, trazas = null, nutrientes = null }, restricciones) {
  const contenido = [];
  if (foto) {
    contenido.push({ type: 'text', text: 'Foto de la lista de ingredientes:' });
    contenido.push({ type: 'image', source: { type: 'base64', media_type: foto.tipo, data: foto.base64 } });
  }
  if (texto) {
    contenido.push({
      type: 'text',
      text: `Lista de ingredientes:\n${texto}${trazas ? `\nTrazas declaradas: ${trazas}` : ''}`,
    });
  }
  if (nutrientes && restricciones.includes('salud:glucosa')) {
    contenido.push({
      type: 'text',
      text: `Nutrientes cada 100 g: azúcares ${nutrientes.azucares ?? 'sin dato'} g, carbohidratos ${nutrientes.carbohidratos ?? 'sin dato'} g, fibra ${nutrientes.fibra ?? 'sin dato'} g.`,
    });
  }
  contenido.push({
    type: 'text',
    text: `Restricciones a revisar (usá estas claves): ${JSON.stringify(restricciones)}\nIdioma del usuario para traducciones y explicaciones: ${idioma() === 'en' ? 'inglés' : 'español rioplatense'}.`,
  });
  const { datos } = await pedirJSON({ sistema: SISTEMA_CHEQUEO, contenido, esquema: ESQUEMA_CHEQUEO, esfuerzo: 'medium' });
  return veredicto(restricciones, datos);
}

// Texto de ingredientes a partir de la ficha ya leída (para el chequeo automático).
export function textoDeFicha(ficha) {
  // Una lista estimada (alimentos del BLS) no sirve para revisar alérgenos.
  if (!ficha.ingredientes || ficha.ingredientesEstimados) return null;
  return ficha.ingredientes.map((i) => i.texto).join(', ');
}

export { ALERGENOS };
