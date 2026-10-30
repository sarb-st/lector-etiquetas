// Instrucciones para la IA y forma exacta (esquema JSON) de lo que tiene que devolver.
// Dos pedidos por análisis:
//   1. Lectura: lee la etiqueta (fotos o datos de Open Food Facts) y devuelve la ficha.
//   2. Textos: con la nota ya calculada por la fórmula, escribe los textos.
// La IA nunca decide la nota, la línea de objetivo ni las etiquetas.

import { CATEGORIAS } from '../puntaje/reglas.js';

const numeroONulo = { anyOf: [{ type: 'number' }, { type: 'null' }] };
const textoONulo = { anyOf: [{ type: 'string' }, { type: 'null' }] };
const objeto = (propiedades) => ({
  type: 'object',
  properties: propiedades,
  required: Object.keys(propiedades),
  additionalProperties: false,
});

export const ALERGENOS = [
  'gluten',
  'leche',
  'huevo',
  'frutos_secos',
  'mani',
  'soja',
  'pescado',
  'crustaceos',
  'moluscos',
  'sesamo',
  'apio',
  'mostaza',
  'sulfitos',
  'altramuces',
];

const TIPOS_INGREDIENTE = [
  'alimento',
  'harina',
  'azucar',
  'grasa',
  'sal',
  'condimento',
  'fermento',
  'agua',
  'fibra_agregada',
  'aditivo',
];

// ---------------------------------------------------------------------------
// 1. Lectura de la etiqueta
// ---------------------------------------------------------------------------

export const ESQUEMA_FICHA = objeto({
  legible: { type: 'boolean' },
  problemaFoto: textoONulo,
  nombre: { type: 'string' },
  tipoDetectado: { type: 'string' },
  tipoDudoso: { type: 'boolean' },
  alternativas: { type: 'array', items: { type: 'string' } },
  categoria: { type: 'string', enum: CATEGORIAS },
  esBebida: { type: 'boolean' },
  nutrientes: {
    anyOf: [
      { type: 'null' },
      objeto({
        kcal: numeroONulo,
        grasa: numeroONulo,
        saturadas: numeroONulo,
        carbohidratos: numeroONulo,
        azucares: numeroONulo,
        fibra: numeroONulo,
        proteina: numeroONulo,
        sal: numeroONulo,
      }),
    ],
  },
  ingredientes: {
    anyOf: [
      { type: 'null' },
      {
        type: 'array',
        items: objeto({
          texto: { type: 'string' },
          traduccion: { type: 'string' },
          tipo: { type: 'string', enum: TIPOS_INGREDIENTE },
          ultra: { type: 'boolean' },
        }),
      },
    ],
  },
  azucarAgregadoEstimado: numeroONulo,
  tipoAceite: { anyOf: [{ type: 'string', enum: ['oliva', 'colza', 'otro_vegetal', 'solida'] }, { type: 'null' }] },
  pescadoAzul: { type: 'boolean' },
  contenidoEnvase: numeroONulo,
  porcionIndividual: { type: 'boolean' },
  porcionTipica: numeroONulo,
  alergenos: {
    type: 'array',
    items: objeto({ alergeno: { type: 'string', enum: ALERGENOS }, ingrediente: { type: 'string' } }),
  },
  trazas: textoONulo,
});

export const SISTEMA_LECTURA = `Leés etiquetas de alimentos envasados (sobre todo de supermercados alemanes) y devolvés una ficha de datos. No opinás ni puntuás: solo leés y clasificás.

Reglas de lectura:
- Nunca inventes un número. Si un valor no se ve o no se lee con seguridad, poné null.
- Todos los nutrientes van cada 100 g (o cada 100 ml si es bebida). Si la tabla solo da valores por porción, convertilos a 100 g solo si la etiqueta indica el peso de la porción; si no, null.
- kcal: si solo figura en kJ, dividí por 4,184 y redondeá. Sal: si solo figura sodio, multiplicá por 2,5.
- "davon gesättigte Fettsäuren" son las saturadas; "davon Zucker" son los azúcares; "Ballaststoffe" es la fibra; "Eiweiß" la proteína.
- legible: false solo si la foto no permite leer nada útil; en problemaFoto explicá en una frase qué falla (borrosa, cortada, reflejo).

Ingredientes (en el orden del envase, tal como figuran, con la traducción al idioma del usuario):
- tipo: alimento (alimento entero o apenas transformado: leche, avena, frutos secos, fruta, carne, huevo, legumbre, verdura, pescado, chocolate), harina (harinas, sémolas, almidones simples), azucar (cualquier azúcar agregado: azúcar, jarabes, dextrosa, maltodextrina, fructosa, azúcar invertido, miel, extracto de malta, concentrados de jugo usados para endulzar), grasa (aceites, manteca), sal, condimento (especias, hierbas, vinagre), fermento (cultivos, cuajo, levadura), agua, fibra_agregada (inulina, fibra de achicoria, oligofructosa y similares), aditivo (todo lo demás).
- ultra: true para emulsionantes, aromas (también "natürliches Aroma"), almidón modificado, edulcorantes, jarabe de glucosa o de glucosa-fructosa, aislados o concentrados de proteína, colorantes, potenciadores de sabor, espesantes y gelificantes industriales. Si no, false.
- Si no hay lista de ingredientes visible, ingredientes es null. Un producto de un solo ingrediente es una lista de uno.

Otros campos:
- nombre: el nombre comercial que se lee (marca y producto). tipoDetectado: qué es en palabras simples, en el idioma del usuario ("galleta de arroz").
- tipoDudoso: true solo si dos tipos distintos encajan casi igual con lo que se ve; alternativas: esas opciones (vacía si no hay duda).
- categoria: la que mejor encaje de la lista.
- azucarAgregadoEstimado: gramos de azúcar agregado cada 100 g, estimados contra el azúcar propio típico de la base (por ejemplo, un yogur natural tiene 4 a 5 g propios). null si no hay azúcar agregado o no se puede estimar.
- tipoAceite: solo si el producto ES un aceite o grasa para cocinar (oliva, colza, otro_vegetal para girasol, maíz, soja o mezclas; solida para coco, palma, manteca). Si no, null.
- pescadoAzul: true si es salmón, caballa, arenque, sardina, atún o similar.
- contenidoEnvase: gramos (o ml) del envase entero, solo si se lee en alguna foto o en los datos ("Nettofüllmenge", "e 400 g", "4 x 125 g" son 500). Si no se ve, null: no lo adivines.
- porcionIndividual: true si el envase está pensado para comerse de una vez (un pote de postre o yogur individual, una barrita, una lata de bebida, un sándwich envasado; frases como "pro Becher" o "pro Riegel" lo confirman). false si rinde varias veces (paquete de avena, pote grande, botella grande, paquete de galletas).
- porcionTipica: gramos de una porción típica de este tipo de producto (por ejemplo 150 g de yogur, 40 g de avena, 30 g de frutos secos, 10 g de aceite). Si la etiqueta declara una porción ("Portion", "pro Portion"), usá esa.
- alergenos: los 14 de la UE presentes en los ingredientes, con el ingrediente tal como figura (en la UE van destacados en negrita o mayúsculas). Incluí nombres escondidos: Dinkel, Gerste, Roggen, Grünkern, Emmer, Kamut (gluten); Molke, Kasein, Milchpulver, Butterreinfett, Laktose (leche); Eiklar, Eigelb, Lysozym, Albumin (huevo); Lecithin (Soja) (soja); E220 a E228 (sulfitos); Lupine (altramuces). La avena sin "glutenfrei" cuenta como gluten.
- trazas: la frase de "puede contener" tal como figura (por ejemplo "Kann Spuren von Milch enthalten"), o null.`;

// ---------------------------------------------------------------------------
// 2. Textos del análisis
// ---------------------------------------------------------------------------

const CLAVES_ETIQUETAS = [
  'exceso_azucar',
  'exceso_saturadas',
  'exceso_sal',
  'exceso_grasa',
  'grasa_alta_buena',
  'saturadas_altas_buena',
  'calorias_altas',
  'proteina_baja',
  'azucar_moderado',
  'sal_moderada',
  'proteina_alta',
  'proteina_buena',
  'fibra_alta',
  'fibra_buena',
  'grasas_buenas',
  'pocas_calorias',
  'sin_azucar_agregado',
  'musculo',
  'saciedad',
  'corazon',
  'energia_sostenida',
  'energia_rapida',
];

export const ESQUEMA_TEXTOS = objeto({
  detectado: { type: 'string' },
  titular: { type: 'string' },
  motivoLinea: { type: 'string' },
  cuandoSi: textoONulo,
  cuandoNo: textoONulo,
  resumen: objeto({
    maloPorque: textoONulo,
    excesoDe: textoONulo,
    bajoEn: textoONulo,
    buenoPorque: textoONulo,
    loRescatable: textoONulo,
  }),
  deDondeViene: {
    type: 'array',
    items: objeto({
      nutriente: { type: 'string', enum: ['azucar', 'grasas', 'fibra', 'otro'] },
      nombre: { type: 'string' },
      cantidad: { type: 'string' },
      texto: { type: 'string' },
    }),
  },
  aporta: { type: 'array', items: objeto({ titulo: { type: 'string' }, texto: { type: 'string' } }) },
  noSePuedeSaber: { type: 'array', items: { type: 'string' } },
  sugerencia: textoONulo,
  dato: { anyOf: [{ type: 'null' }, objeto({ titulo: { type: 'string' }, texto: { type: 'string' } })] },
  etiquetas: {
    type: 'array',
    items: objeto({
      clave: { type: 'string', enum: CLAVES_ETIQUETAS },
      porQue: { type: 'string' },
      paraVos: { type: 'string' },
    }),
  },
});

const NIVELES = {
  nada: 'No sabe nada de nutrición. Explicá todo desde cero, con palabras de todos los días. No uses términos técnicos (nada de "betaglucanos", "macros", "índice glucémico", "ácidos grasos"); si hace falta una idea técnica, decila con palabras simples ("la fibra de la avena, que ayuda a bajar el colesterol").',
  basico: 'Sabe lo básico: qué son las calorías y las proteínas. Usá palabras simples y explicá cualquier término menos común en la misma frase.',
  etiquetas: 'Lee etiquetas: entiende los macros y compara productos. Podés usar términos comunes de nutrición sin explicarlos.',
  experto: 'Es experto. Hablale técnico y preciso, sin simplificar.',
};

export function sistemaTextos(idioma, nivel) {
  const lengua =
    idioma === 'en'
      ? 'Escribí en inglés.'
      : 'Escribí en español rioplatense (voseo: "vos tenés", "buscá"), cálido y directo.';
  return `Escribís los textos de una app que analiza alimentos envasados. La nota de calidad (1 a 10), la línea de objetivo, el nivel de procesamiento y las etiquetas YA ESTÁN DECIDIDOS por una fórmula fija: vos solo los explicás. Nunca los contradigas, nunca sugieras otra nota y nunca menciones la fórmula ni los puntos.

${lengua}

Nivel de la persona: ${NIVELES[nivel] ?? NIVELES.basico}

Reglas:
- Usá solo los datos de la ficha. Nunca inventes números ni datos. Si algo es una estimación, decilo ("≈ 8 g agregados, estimado").
- Lo que la etiqueta no permite saber va en noSePuedeSaber, en frases cortas.
- titular: una frase corta que dice qué es el producto en palabras simples ("Más golosina que snack saludable.").
- motivoLinea: una línea que justifica la línea de objetivo para el perfil de la persona.
- cuandoSi / cuandoNo: una línea cada uno, pensadas para la actividad, el objetivo y los momentos de consumo del perfil. Nunca pueden contradecir la línea de objetivo. Si no hay nada útil que decir, null.
- resumen: si la nota es 4 o menos, completá maloPorque primero; si es buena, buenoPorque. loRescatable solo si la nota es baja y hay algo bueno. Los campos que no apliquen van en null.
- deDondeViene: azúcar (propio o agregado), grasas (saturadas, insaturadas ≈ total menos saturadas, y su origen según ingredientes) y fibra (propia o agregada), solo cuando hay datos. cantidad con unidad ("24 g"). nutriente: azucar, grasas, fibra u otro, según de qué habla la tarjeta.
- aporta: nutrientes que el alimento aporta por sí mismo y para qué sirven en el cuerpo, en una línea cada uno. Las vitaminas agregadas se mencionan, pero no compensan el azúcar ni el procesamiento.
- Saciedad: no depende solo de la proteína. Pesan cuánta comida da por caloría (densidad), la fibra y cuánto se come de una vez. Si la porción es chica (un pote de 125 g, una barrita), decí con honestidad que sola probablemente no llene, y sugerí con qué acompañarla.
- Productos naturales (un solo ingrediente): el texto toma forma de reseña: qué aporta, cómo usarlo y la porción típica ("Un puñado, unos 30 g, unas 200 calorías").
- sugerencia: solo si el producto es flojo para el objetivo. Criterios realistas (1 o 2, los que importan para el perfil), con un número concreto y un tipo de producto que suele cumplirlo, nunca una marca ("Buscá uno con más de 8 g de proteína cada 100 g. Los tipo skyr o griego suelen cumplirlo."). Si ya es de los mejores, null.
- dato: un tip educativo relacionado con este producto, con título en forma de pregunta.
- etiquetas: para cada etiqueta de "De un vistazo" y de "Sirve para" que te paso, porQue (por qué este producto la tiene, con sus números) y paraVos (qué significa para esta persona según su perfil). Usá exactamente las claves recibidas.
- Decí "sirve para", nunca "te va a ayudar a": ningún producto logra nada por sí solo.
- Las grasas saturadas "conviene limitarlas"; no las demonices. Sin juicio moral sobre la comida.
- Si la persona tiene una condición de salud, no des indicaciones médicas: la app no reemplaza a un profesional.
- Textos breves: cada campo, una o dos frases.`;
}
