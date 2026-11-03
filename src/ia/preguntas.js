// Preguntas libres sobre un producto ya analizado ("Preguntá lo que quieras").
// La nota, la línea y las etiquetas ya las decidió la fórmula: la IA solo responde dudas
// concretas (cantidades, momentos, usos, combinaciones) con los datos del producto y del perfil.
// Responde Haiku, que es rápido y barato; la conversación se guarda con el producto.

import { pedirJSON } from './cliente.js';
import { perfilParaTextos } from './analisis.js';
import { leerPerfil } from '../datos/almacen.js';
import { idioma } from '../i18n/index.js';
import { analizar } from '../puntaje/index.js';
import { normalizarPerfil } from '../puntaje/objetivo.js';

// Cuántos mensajes anteriores se mandan como contexto (los últimos).
const MENSAJES_DE_CONTEXTO = 12;

const NIVELES = {
  nada: 'No sabe nada de nutrición: palabras de todos los días, sin términos técnicos.',
  basico: 'Sabe lo básico: palabras simples; si usás un término menos común, explicalo en la misma frase.',
  etiquetas: 'Lee etiquetas: podés usar términos comunes de nutrición.',
  experto: 'Es experto: técnico y preciso, sin simplificar.',
};

function sistema(lengua, nivel) {
  const comoEscribir =
    lengua === 'en' ? 'Escribí en inglés.' : 'Escribí en español rioplatense (voseo: "vos tenés", "usá"), cálido y directo.';
  return `Respondés las preguntas de una persona sobre un producto que la app ya analizó. Te paso los datos del producto, lo que decidió la app y el perfil de la persona.

${comoEscribir}
Nivel de la persona: ${NIVELES[nivel] ?? NIVELES.basico}

Reglas:
- La nota de calidad (1 a 10), la línea de objetivo y las etiquetas YA ESTÁN DECIDIDAS por una fórmula fija. Nunca las cambies ni las contradigas. Si preguntan por la nota, explicá en qué se basa con los datos.
- Usá los datos del producto y del perfil. Si algo no se puede saber con la etiqueta, decilo con claridad: nunca inventes números.
- Cantidades: en gramos y en una medida casera ("unos 10 g, una cucharada"), pensadas para el objetivo de la persona.
- Tené en cuenta sus alergias, intolerancias y tipo de alimentación. Si el producto no le conviene por eso, decilo primero.
- No des indicaciones médicas: si la persona tiene una condición de salud y la pregunta depende de eso, respondé lo general y sugerí consultarlo con un profesional.
- Respondé solo sobre comida, nutrición y este producto (cómo usarlo, cuánto, cuándo, con qué combinarlo, cómo guardarlo). Si preguntan otra cosa, decilo con amabilidad y volvé al producto.
- Sin juicio moral sobre la comida. Las grasas saturadas "conviene limitarlas", sin demonizarlas.
- Breve: de 2 a 5 frases, en texto simple. Una lista corta está bien solo si ayuda. Sin títulos.`;
}

function datosDelProducto(entrada, perfil) {
  const { ficha } = entrada;
  const resultado = analizar(ficha, normalizarPerfil(perfil));
  return {
    producto: {
      nombre: ficha.nombre,
      tipo: ficha.tipoDetectado,
      categoria: ficha.categoria,
      esBebida: ficha.esBebida,
      nutrientesCada100: ficha.nutrientes,
      ingredientes: ficha.ingredientes?.map((i) => i.traduccion || i.texto) ?? null,
      ingredientesEstimados: ficha.ingredientesEstimados ?? false,
      contenidoEnvase: ficha.contenidoEnvase ?? null,
      porcionTipica: ficha.porcionTipica ?? null,
      micronutrientesCada100: ficha.micronutrientes ?? undefined,
    },
    decidido: {
      nota: resultado.nota,
      provisional: resultado.provisional,
      procesamiento: resultado.procesamiento,
      lineaDeObjetivo: resultado.linea,
      deUnVistazo: resultado.deUnVistazo.map((c) => c.clave),
      sirvePara: resultado.sirvePara,
    },
    perfil: {
      ...perfilParaTextos(perfil),
      alergias: perfil?.alergias ?? [],
      intolerancias: perfil?.intolerancias ?? [],
    },
  };
}

// conversacion: [{ rol: 'persona' | 'app', texto }] ya guardada (sin la pregunta nueva).
// Devuelve el texto de la respuesta.
export async function preguntarSobreProducto(entrada, conversacion, pregunta) {
  const perfil = leerPerfil();
  const contexto = `Datos del producto y del análisis:\n${JSON.stringify(datosDelProducto(entrada, perfil), null, 2)}`;
  const recientes = conversacion.slice(-MENSAJES_DE_CONTEXTO);
  // Una conversación tiene que empezar con un mensaje de la persona.
  while (recientes.length && recientes[0].rol !== 'persona') recientes.shift();
  // El contexto va siempre en el primer mensaje de la persona, aunque se haya recortado la charla.
  const anteriores = recientes.map((m, i) => ({
    role: m.rol === 'persona' ? 'user' : 'assistant',
    content: i === 0 ? `${contexto}\n\nPregunta: ${m.texto}` : m.texto,
  }));
  const actual = anteriores.length ? pregunta : `${contexto}\n\nPregunta: ${pregunta}`;

  const { datos } = await pedirJSON({
    sistema: sistema(idioma(), perfil?.nivel ?? 'basico'),
    anteriores,
    contenido: [{ type: 'text', text: actual }],
    esquema: {
      type: 'object',
      properties: { respuesta: { type: 'string' } },
      required: ['respuesta'],
      additionalProperties: false,
    },
    esfuerzo: 'low',
    maxTokens: 2000,
    modeloFijo: 'economico',
  });
  return datos.respuesta;
}
