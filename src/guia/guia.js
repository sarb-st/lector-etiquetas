// Guía educativa: los cuatro niveles (docs/guias/), qué capítulo explica cada etiqueta
// y el texto que se le pasa a la IA para escribir el dato educativo.
// El contenido vive en contenido-es.js, que se carga recién cuando hace falta.

import { leerPerfil } from '../datos/almacen.js';
import { esc } from '../ui/comunes.js';

export const NIVELES_GUIA = ['nada', 'basico', 'etiquetas', 'experto'];

// Capítulo de la guía que explica cada etiqueta. Es el mismo número en los cuatro niveles.
export const CAPITULO_DE = {
  // De un vistazo
  exceso_azucar: 3,
  azucar_moderado: 3,
  sin_azucar_agregado: 3,
  exceso_sal: 6,
  sal_moderada: 6,
  exceso_saturadas: 5,
  exceso_grasa: 5,
  saturadas_altas_buena: 5,
  grasa_alta_buena: 5,
  grasas_buenas: 5,
  calorias_altas: 1,
  pocas_calorias: 1,
  proteina_baja: 2,
  proteina_buena: 2,
  proteina_alta: 2,
  fibra_buena: 4,
  fibra_alta: 4,
  // Sirve para
  musculo: 2,
  saciedad: 1,
  corazon: 5,
  energia_sostenida: 3,
  energia_rapida: 3,
  // Otros lugares del resultado
  parcial: 7,
  procesamiento: 9,
  alergenos: 8,
};

// Capítulo según la línea "Si buscás…" de una comparación.
const CAPITULO_DE_CRITERIO = {
  masProteina: 2,
  menosCalorias: 1,
  masSaciedad: 1,
  menosGrasa: 5,
  menosAzucar: 3,
  masFibra: 4,
  menosSal: 6,
};

// Nivel de la pregunta 9 del perfil. Sin respuesta, "Lo básico", igual que los textos de la IA.
export function nivelDelUsuario() {
  const nivel = leerPerfil()?.nivel;
  return NIVELES_GUIA.includes(nivel) ? nivel : 'basico';
}

export function hrefCapitulo(n, nivel = nivelDelUsuario()) {
  return n == null ? '#/guia' : `#/guia/${nivel}/${n}`;
}

let guias = null;
export async function cargarGuias() {
  if (!guias) guias = (await import('./contenido-es.js')).GUIAS;
  return guias;
}
export const guiasCargadas = () => guias;

// El capítulo más relacionado con un análisis: el de la primera etiqueta de
// "De un vistazo" (los excesos van primero); si no hay, el de "Sirve para".
export function capituloDelResultado(resultado) {
  for (const chip of resultado?.deUnVistazo ?? []) {
    if (CAPITULO_DE[chip.clave] != null) return CAPITULO_DE[chip.clave];
  }
  for (const clave of resultado?.sirvePara ?? []) {
    if (CAPITULO_DE[clave] != null) return CAPITULO_DE[clave];
  }
  return resultado?.procesamiento ? CAPITULO_DE.procesamiento : CAPITULO_DE.parcial;
}

export function capituloDeComparacion(comparacion) {
  const primero = comparacion?.siBuscas?.[0]?.criterio;
  return CAPITULO_DE_CRITERIO[primero] ?? 7;
}

// Texto del capítulo para la IA, en el nivel del usuario. Si no se puede cargar, null:
// el dato educativo se escribe igual, sin la guía.
export async function capituloParaIA(n, nivel = nivelDelUsuario()) {
  try {
    const g = await cargarGuias();
    const c = g[NIVELES_GUIA.includes(nivel) ? nivel : 'basico'].capitulos.find((x) => x.n === n);
    return c ? `${c.n}. ${c.titulo}\n\n${c.md}` : null;
  } catch {
    return null;
  }
}

// Instrucción para que el dato educativo salga de la guía.
export function pedidoDatoDesdeGuia(texto) {
  return `Capítulo de la guía de la app, escrito para el nivel de esta persona:\n\n${texto}\n\nEl dato educativo tiene que salir de este capítulo: elegí una idea del capítulo que se conecte con este producto y usá su manera de explicar (sus ejemplos, sus comparaciones, su nivel de detalle). No agregues datos que no estén en el capítulo o en la ficha. La guía está escrita con "tú": vos escribí con las reglas de idioma de arriba.`;
}

// --- Markdown de las guías a HTML (solo lo que usan: títulos, párrafos, listas, tablas). ---

function enLinea(texto) {
  return esc(texto)
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

const celdas = (linea) =>
  linea
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'));

// Cada subtítulo abre una sección; algunas tienen su propio estilo.
const CLASE_SECCION = {
  'Lo que te llevas': 'llevas',
  'Mini desafío': 'desafio',
  'En la etiqueta se ve así': 'en-etiqueta',
  Fuentes: 'fuentes',
};

export function markdownAHtml(md) {
  const lineas = md.split('\n');
  const html = ['<section class="gancho">'];
  let i = 0;
  while (i < lineas.length) {
    const linea = lineas[i];
    if (!linea.trim()) {
      i += 1;
    } else if (linea.startsWith('### ')) {
      const titulo = linea.slice(4).trim();
      html.push(`</section><section class="${CLASE_SECCION[titulo] ?? ''}">`, `<h3>${enLinea(titulo)}</h3>`);
      i += 1;
    } else if (/^- /.test(linea) || /^\d+\. /.test(linea)) {
      const ordenada = /^\d+\. /.test(linea);
      const items = [];
      while (i < lineas.length && (ordenada ? /^\d+\. / : /^- /).test(lineas[i])) {
        items.push(`<li>${enLinea(lineas[i].replace(/^(- |\d+\. )/, ''))}</li>`);
        i += 1;
      }
      html.push(ordenada ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
    } else if (linea.startsWith('|')) {
      const filas = [];
      while (i < lineas.length && lineas[i].startsWith('|')) {
        filas.push(lineas[i]);
        i += 1;
      }
      const [cabecera, , ...cuerpo] = filas;
      const th = celdas(cabecera).map((c) => `<th>${enLinea(c)}</th>`).join('');
      const tr = cuerpo.map((f) => `<tr>${celdas(f).map((c) => `<td>${enLinea(c)}</td>`).join('')}</tr>`).join('');
      html.push(`<div class="tabla-guia"><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`);
    } else {
      const parrafo = [];
      while (i < lineas.length && lineas[i].trim() && !/^(### |- |\d+\. |\|)/.test(lineas[i])) {
        parrafo.push(lineas[i]);
        i += 1;
      }
      html.push(`<p>${enLinea(parrafo.join(' '))}</p>`);
    }
  }
  html.push('</section>');
  return html.join('\n');
}
