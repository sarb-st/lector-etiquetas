// De qué está hecho el azúcar y la grasa del producto, para las barras de "De dónde viene".
// Lo calcula el código con los datos de la etiqueta; si algo no se puede saber, lo dice.

import { derivar, porcionDe, tieneValor } from './derivados.js';

// Una cucharadita de azúcar son unos 4 gramos.
export const GRAMOS_POR_CUCHARADITA = 4;

// Azúcar: cuánto es propio del alimento y cuánto agregado.
// Devuelve null si no hay dato de azúcar, o:
//   { total, propio, agregado, estimado }       si se puede dividir
//   { total, desconocido: 'sin_ingredientes' }  sin lista de ingredientes no se sabe si hay agregado
//   { total, desconocido: 'sin_estimacion' }    hay agregado, pero no se puede estimar cuánto
export function partesAzucar(ficha) {
  const total = ficha.nutrientes?.azucares;
  if (!tieneValor(total)) return null;
  const { azucarAgregado } = derivar(ficha);
  if (azucarAgregado.hay === null) return { total, desconocido: 'sin_ingredientes' };
  if (azucarAgregado.hay === false) return { total, propio: total, agregado: 0, estimado: false };
  if (!tieneValor(ficha.azucarAgregadoEstimado)) return { total, desconocido: 'sin_estimacion' };
  const agregado = Math.min(Math.max(ficha.azucarAgregadoEstimado, 0), total);
  return { total, propio: total - agregado, agregado, estimado: true };
}

// Grasa: cuánto es saturada y cuánto insaturada (la grasa total menos las saturadas).
export function partesGrasa(ficha) {
  const n = ficha.nutrientes ?? {};
  if (!tieneValor(n.grasa) || !tieneValor(n.saturadas) || n.grasa <= 0) return null;
  const saturadas = Math.min(n.saturadas, n.grasa);
  return { total: n.grasa, saturadas, insaturadas: n.grasa - saturadas };
}

// Cucharaditas de azúcar en lo que se come de una vez (o cada 100 g si no se sabe).
// Devuelve null si no llega a una cucharadita entera.
export function cucharaditas(ficha) {
  const azucares = ficha.nutrientes?.azucares;
  if (!tieneValor(azucares)) return null;
  const porcion = porcionDe(ficha);
  const gramos = porcion ? (azucares * porcion.gramos) / 100 : azucares;
  if (gramos < GRAMOS_POR_CUCHARADITA) return null;
  const cantidad = Math.round(gramos / GRAMOS_POR_CUCHARADITA);
  return { cantidad, en: porcion ? porcion.tipo : 'cien', porcionGramos: porcion?.gramos ?? null };
}
