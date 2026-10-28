// Datos que se deducen de la ficha y que usan la nota, la línea y las etiquetas.
//
// La ficha es lo que devuelve la lectura de la etiqueta (IA u Open Food Facts):
// {
//   nombre: 'Barrita de avena y chocolate',
//   categoria: 'barritas',              // una de CATEGORIAS
//   esBebida: false,                    // true: los valores son cada 100 ml
//   nutrientes: {                       // cada 100 g o 100 ml; null si no se lee
//     kcal, grasa, saturadas, carbohidratos, azucares, fibra, proteina, sal
//   } | null,                           // null: no hay foto de la tabla
//   ingredientes: [                     // en el orden del envase
//     { texto: 'Haferflocken', tipo: 'alimento', ultra: false },
//     ...
//   ] | null,                           // null: no hay foto de ingredientes
//   azucarAgregadoEstimado: 20 | null,  // gramos, si se puede estimar
//   tipoAceite: 'oliva' | 'colza' | 'otro_vegetal' | 'solida' | null,
//   pescadoAzul: false,
//   contenidoEnvase: 400 | null,        // gramos o ml del envase entero
//   porcionIndividual: true,            // el envase se come de una vez (pote, barrita)
//   porcionTipica: 150 | null,          // gramos de una porción típica (estimada)
// }
//
// Tipos de ingrediente: alimento, harina, azucar, grasa, sal, condimento,
// fermento, agua, fibra_agregada, aditivo.
// "ultra: true" marca emulsionantes, aromas, almidón modificado, edulcorantes,
// jarabe de glucosa, aislados de proteína, colorantes y similares.

import {
  LIMITES,
  FACTOR_BEBIDAS,
  FIBRA_NIVELES,
  GRASAS_BUENAS,
  FRACCION_SATURADAS_MALA,
  POSICIONES_AZUCAR_PRINCIPAL,
  CATEGORIAS_AL_MENOS_PROCESADO,
  TIPOS_MINIMAMENTE_PROCESADO,
  NOTA_ACEITES,
} from './reglas.js';

const tieneValor = (v) => typeof v === 'number' && Number.isFinite(v);

// 'bajo', 'medio' o 'alto' según los límites; null si no hay dato.
export function nivelSegunLimites(valor, limites) {
  if (!tieneValor(valor)) return null;
  if (valor <= limites.bajo) return 'bajo';
  if (valor > limites.alto) return 'alto';
  return 'medio';
}

// Gramos de un nutriente cada 100 kcal; null si no se puede calcular.
function por100kcal(gramos, kcal) {
  if (!tieneValor(gramos) || !tieneValor(kcal) || kcal <= 0) return null;
  return (gramos / kcal) * 100;
}

export function limitesDe(ficha) {
  if (!ficha.esBebida) return LIMITES;
  const mitad = {};
  for (const [nutriente, { bajo, alto }] of Object.entries(LIMITES)) {
    mitad[nutriente] = { bajo: bajo * FACTOR_BEBIDAS, alto: alto * FACTOR_BEBIDAS };
  }
  return mitad;
}

export function nivelProcesamiento(ficha) {
  const ingredientes = ficha.ingredientes;
  if (!ingredientes || ingredientes.length === 0) return null;

  let nivel;
  if (ingredientes.some((i) => i.ultra)) {
    nivel = 'ultra';
  } else if (ingredientes.length === 1 && ingredientes[0].tipo === 'alimento') {
    nivel = 'natural';
  } else if (ingredientes.length === 1 && ingredientes[0].tipo === 'grasa') {
    nivel = 'minimo';
  } else {
    const hayAlimento = ingredientes.some((i) => i.tipo === 'alimento');
    const todosSimples = ingredientes.every((i) => TIPOS_MINIMAMENTE_PROCESADO.includes(i.tipo));
    nivel = hayAlimento && todosSimples ? 'minimo' : 'procesado';
  }

  if (CATEGORIAS_AL_MENOS_PROCESADO.includes(ficha.categoria) && (nivel === 'natural' || nivel === 'minimo')) {
    nivel = 'procesado';
  }
  return nivel;
}

function nivelFibra(fibra, kcal, hayFibraAgregada) {
  if (!tieneValor(fibra)) return 0;
  const porKcal = por100kcal(fibra, kcal);
  let nivel = 0;
  for (const escalon of FIBRA_NIVELES) {
    if (fibra >= escalon.gramos || (porKcal !== null && porKcal >= escalon.por100kcal)) {
      nivel = escalon.nivel;
      break;
    }
  }
  return hayFibraAgregada ? Math.max(0, nivel - 1) : nivel;
}

function azucarAgregado(ficha) {
  const ingredientes = ficha.ingredientes;
  if (!ingredientes) return { hay: null, casiTodo: null };
  const posicion = ingredientes.findIndex((i) => i.tipo === 'azucar');
  if (posicion === -1) return { hay: false, casiTodo: false };

  const azucares = ficha.nutrientes?.azucares;
  let casiTodo;
  if (tieneValor(ficha.azucarAgregadoEstimado) && tieneValor(azucares)) {
    casiTodo = ficha.azucarAgregadoEstimado > azucares / 2;
  } else {
    casiTodo = posicion < POSICIONES_AZUCAR_PRINCIPAL;
  }
  return { hay: true, casiTodo };
}

// Cuánto se come de una vez: el envase si es individual; si no, la porción típica.
export function porcionDe(ficha) {
  if (ficha.porcionIndividual && tieneValor(ficha.contenidoEnvase)) {
    return { gramos: ficha.contenidoEnvase, tipo: 'envase' };
  }
  if (tieneValor(ficha.porcionTipica)) return { gramos: ficha.porcionTipica, tipo: 'tipica' };
  return null;
}

// Reúne todo lo deducido en un solo objeto.
export function derivar(ficha) {
  const n = ficha.nutrientes ?? {};
  const limites = limitesDe(ficha);
  const procesamiento = nivelProcesamiento(ficha);
  const esSimple = procesamiento === 'natural' || procesamiento === 'minimo';
  const hayFibraAgregada = (ficha.ingredientes ?? []).some((i) => i.tipo === 'fibra_agregada');

  const grasasBuenas =
    esSimple &&
    tieneValor(n.grasa) &&
    tieneValor(n.saturadas) &&
    n.grasa >= GRASAS_BUENAS.grasaMinima &&
    n.saturadas <= n.grasa * GRASAS_BUENAS.fraccionSaturadasMaxima;

  const saturadasMala =
    tieneValor(n.grasa) && tieneValor(n.saturadas) && n.grasa > 0 && n.saturadas > n.grasa * FRACCION_SATURADAS_MALA;

  const niveles = {
    azucar: nivelSegunLimites(n.azucares, limites.azucares),
    saturadas: nivelSegunLimites(n.saturadas, limites.saturadas),
    sal: nivelSegunLimites(n.sal, limites.sal),
    grasa: nivelSegunLimites(n.grasa, limites.grasa),
  };

  const notaAceite = NOTA_ACEITES[ficha.tipoAceite] ?? null;

  return {
    nutrientes: n,
    limites,
    procesamiento,
    esSimple,
    tieneIngredientes: Array.isArray(ficha.ingredientes) && ficha.ingredientes.length > 0,
    tieneTabla: tieneValor(n.kcal),
    proteinaPor100kcal: por100kcal(n.proteina, n.kcal),
    nivelFibra: nivelFibra(n.fibra, n.kcal, hayFibraAgregada),
    hayFibraAgregada,
    azucarAgregado: azucarAgregado(ficha),
    grasasBuenas,
    saturadasMala,
    niveles,
    notaAceite,
    porcion: porcionDe(ficha),
  };
}

export { tieneValor };
