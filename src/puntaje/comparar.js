// Comparación de dos productos (definición, sección 7.1). La decide el código, no la IA.
//
// 1. Gana la mejor línea de objetivo (Suma, después Moderación, después Resta).
// 2. Con la misma línea, gana la nota más alta si la diferencia es de 2 puntos o más.
// 3. Si están a 1 punto o menos es "empate técnico": se desempata con el aspecto que más
//    pesa en el perfil (el que tiene más votos) y, si ahí son iguales, con la nota.

import { analizar } from './index.js';
import { derivar } from './derivados.js';
import { ASPECTOS } from './reglas.js';

const RANGO_LINEA = { suma: 2, moderacion: 1, resta: 0 };
const DIFERENCIA_NOTA_CLARA = 2;

// Una diferencia es real si pasa un mínimo en gramos y además es al menos del 10 %.
const DIFERENCIA_RELATIVA = 0.1;

function diferenciaReal(a, b, minimo) {
  if (a == null || b == null) return false;
  const d = Math.abs(a - b);
  return d >= minimo && d >= DIFERENCIA_RELATIVA * Math.max(Math.abs(a), Math.abs(b));
}

// "Si buscás…": criterio, de dónde sale el valor, si gana el mayor o el menor, y la diferencia mínima.
const CRITERIOS = [
  { clave: 'masProteina', valor: (n) => n.proteina, mejor: 'mayor', minimo: 1 },
  { clave: 'menosCalorias', valor: (n) => n.kcal, mejor: 'menor', minimo: 10 },
  { clave: 'masSaciedad', valor: null, mejor: 'mayor', minimo: 0 },
  { clave: 'menosGrasa', valor: (n) => n.grasa, mejor: 'menor', minimo: 1 },
  { clave: 'menosAzucar', valor: (n) => n.azucares, mejor: 'menor', minimo: 1 },
  { clave: 'masFibra', valor: (n) => n.fibra, mejor: 'mayor', minimo: 1 },
  { clave: 'menosSal', valor: (n) => n.sal, mejor: 'menor', minimo: 0.1 },
];

// Saciedad: primero la etiqueta "Saciedad"; si las dos la tienen o ninguna,
// proteína más fibra por cada 100 calorías.
function indiceSaciedad(ficha, resultado) {
  const n = ficha.nutrientes ?? {};
  if (n.kcal == null || n.kcal <= 0) return null;
  return (((n.proteina ?? 0) + (n.fibra ?? 0)) / n.kcal) * 100 + (resultado.sirvePara.includes('saciedad') ? 1000 : 0);
}

function quienGana(a, b, mejor) {
  if (mejor === 'mayor') return a > b ? 'a' : 'b';
  return a < b ? 'a' : 'b';
}

function siBuscas(fichaA, fichaB, ra, rb) {
  const na = fichaA.nutrientes ?? {};
  const nb = fichaB.nutrientes ?? {};
  const lineas = [];
  for (const c of CRITERIOS) {
    let a;
    let b;
    let real;
    if (c.clave === 'masSaciedad') {
      a = indiceSaciedad(fichaA, ra);
      b = indiceSaciedad(fichaB, rb);
      real = diferenciaReal(a, b, 0.5);
    } else {
      a = c.valor(na);
      b = c.valor(nb);
      real = diferenciaReal(a, b, c.minimo);
    }
    if (real) lineas.push({ criterio: c.clave, ganador: quienGana(a, b, c.mejor) });
  }
  return lineas;
}

// Aspectos ordenados por cuánto pesan en el perfil (más votos primero).
function aspectosPorPeso(resultado) {
  return [...resultado.explicacion.votos]
    .filter((v) => ASPECTOS.includes(v.aspecto) || v.aspecto === 'carbohidratos')
    .sort((x, y) => y.votos - x.votos);
}

function desempatar(ra, rb) {
  const senalesB = new Map(rb.explicacion.votos.map((v) => [v.aspecto, v.senal]));
  for (const v of aspectosPorPeso(ra)) {
    const sb = senalesB.get(v.aspecto);
    if (sb !== undefined && v.senal !== sb) {
      return { ganador: v.senal > sb ? 'a' : 'b', motivo: { tipo: 'aspecto', aspecto: v.aspecto } };
    }
  }
  if (ra.nota !== rb.nota) return { ganador: ra.nota > rb.nota ? 'a' : 'b', motivo: { tipo: 'nota' } };
  return { ganador: 'empate', motivo: { tipo: 'empate' } };
}

export function comparar(fichaA, fichaB, perfil) {
  const ra = analizar(fichaA, perfil);
  const rb = analizar(fichaB, perfil);

  const avisos = [];
  if (fichaA.categoria && fichaB.categoria && fichaA.categoria !== fichaB.categoria) avisos.push('categorias_distintas');
  const parcial = (f, r) => r.provisional || Object.values(f.nutrientes ?? {}).some((v) => v == null);
  if (parcial(fichaA, ra) !== parcial(fichaB, rb)) avisos.push('datos_parciales');

  let decision;
  if (ra.nota == null || rb.nota == null) {
    decision = { ganador: null, motivo: { tipo: 'sin_nota' }, empateTecnico: false };
  } else if (RANGO_LINEA[ra.linea] !== RANGO_LINEA[rb.linea]) {
    decision = {
      ganador: RANGO_LINEA[ra.linea] > RANGO_LINEA[rb.linea] ? 'a' : 'b',
      motivo: { tipo: 'linea' },
      empateTecnico: false,
    };
  } else if (Math.abs(ra.nota - rb.nota) >= DIFERENCIA_NOTA_CLARA) {
    decision = { ganador: ra.nota > rb.nota ? 'a' : 'b', motivo: { tipo: 'nota' }, empateTecnico: false };
  } else {
    decision = { ...desempatar(ra, rb), empateTecnico: true };
  }

  return {
    ...decision,
    siBuscas: siBuscas(fichaA, fichaB, ra, rb),
    avisos,
    a: ra,
    b: rb,
    procesamiento: { a: derivar(fichaA).procesamiento, b: derivar(fichaB).procesamiento },
  };
}
