// Cierre de la pantalla de resultado: "Qué buscar en su lugar" o "Buena elección".
// Lo decide el código con la nota (la IA solo escribe el texto).

import { SUGERENCIA_NOTA_BUENA } from './reglas.js';

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
