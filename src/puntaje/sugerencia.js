// Cierre de la pantalla de resultado: "Qué buscar en su lugar" o "Buena elección".
// Lo decide el código con la nota (la IA solo escribe el texto).

import { SUGERENCIA_NOTA_BUENA } from './reglas.js';
import { REFERENCIAS } from './referencias.js';
import { diferenciaReal } from './comparar.js';

// 'buscar' si la nota es menor a SUGERENCIA_NOTA_BUENA; 'ya_es_bueno' si llega.
// null si no hay nota (falta la tabla nutricional).
export function tipoSugerencia(nota) {
  if (nota === null || nota === undefined) return null;
  return nota >= SUGERENCIA_NOTA_BUENA ? 'ya_es_bueno' : 'buscar';
}

// Qué mejorar, a partir de las etiquetas de "De un vistazo" (para cuando no hay
// sugerencia escrita). Devuelve hasta dos claves, sin repetir, en orden de importancia.
const MEJORA_POR_ETIQUETA = {
  exceso_azucar: 'menos_azucar',
  exceso_saturadas: 'menos_saturadas',
  exceso_sal: 'menos_sal',
  exceso_grasa: 'menos_grasa',
  calorias_altas: 'menos_calorias',
  proteina_baja: 'mas_proteina',
  azucar_moderado: 'menos_azucar',
  sal_moderada: 'menos_sal',
};

export function mejorasSugeridas(resultado, maximo = 2) {
  const mejoras = [];
  for (const etiqueta of resultado.deUnVistazo) {
    const mejora = MEJORA_POR_ETIQUETA[etiqueta.clave];
    if (mejora && !mejoras.includes(mejora)) mejoras.push(mejora);
  }
  return mejoras.slice(0, maximo);
}

// --- Referencias por categoría (definición, sección 7.2) ---------------------
// Para cada mejora, qué nutriente mira y si conviene más o menos.
const NUTRIENTE_DE_MEJORA = {
  menos_azucar: 'azucares',
  menos_saturadas: 'saturadas',
  menos_sal: 'sal',
  menos_grasa: 'grasa',
  menos_calorias: 'kcal',
  mas_proteina: 'proteina',
  mas_fibra: 'fibra',
};
const CONVIENE_MAS = new Set(['proteina', 'fibra']);

// Criterios concretos para "Qué buscar en su lugar": lo que cumple el 25 % mejor de la
// categoría en el súper alemán. Mira primero lo que marcan las etiquetas del producto y
// después las prioridades del perfil. Solo propone un criterio si vale la pena: el
// producto no llega a esa meta y la diferencia pasa la tolerancia legal de la etiqueta.
// Devuelve hasta `maximo` criterios: { mejora, nutriente, meta, valor, rango: [p25, p75], categoria }.
export function referenciasSugerencia(ficha, resultado, perfil, maximo = 2) {
  const referencia = REFERENCIAS[ficha?.categoria];
  if (!referencia || resultado?.nota == null) return [];
  const candidatas = mejorasSugeridas(resultado, 10);
  for (const prioridad of perfil?.prioridades ?? []) {
    if (NUTRIENTE_DE_MEJORA[prioridad] && !candidatas.includes(prioridad)) candidatas.push(prioridad);
  }
  const criterios = [];
  for (const mejora of candidatas) {
    const nutriente = NUTRIENTE_DE_MEJORA[mejora];
    const cortes = referencia[nutriente];
    const valor = ficha.nutrientes?.[nutriente];
    if (!cortes || valor == null) continue;
    const [p25, , p75] = cortes;
    const mas = CONVIENE_MAS.has(nutriente);
    const meta = mas ? p75 : p25;
    const lejos = mas ? valor < meta : valor > meta;
    if (!lejos || !diferenciaReal(nutriente, valor, meta)) continue;
    criterios.push({ mejora, nutriente, meta, valor, rango: [p25, p75], categoria: ficha.categoria });
    if (criterios.length >= maximo) break;
  }
  return criterios;
}
