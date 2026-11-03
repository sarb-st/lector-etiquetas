// Comparación de dos productos (definición, sección 7.1). La decide el código, no la IA.
//
// 0. Si ninguna diferencia entre los dos pasa las tolerancias legales de etiquetado de la UE
//    (y tienen el mismo procesamiento y azúcar agregado), es empate técnico: con la etiqueta
//    no se pueden distinguir, aunque las notas sean distintas.
// 1. Gana la mejor línea de objetivo (Suma, después Moderación, después Resta).
// 2. Con la misma línea, gana la nota más alta si la diferencia es de 2 puntos o más.
// 3. Si están a 1 punto o menos es "empate técnico": se desempata con el aspecto que más
//    pesa en el perfil (el que tiene más votos) y, si ahí son iguales, con la nota.

import { analizar } from './index.js';
import { derivar } from './derivados.js';
import { ASPECTOS, TOLERANCIAS_UE, DIFERENCIA_CALORIAS } from './reglas.js';

const RANGO_LINEA = { suma: 2, moderacion: 1, resta: 0 };
const DIFERENCIA_NOTA_CLARA = 2;

// Tolerancia legal para un valor (gramos cada 100 g). Ver TOLERANCIAS_UE en reglas.js.
export function tolerancia(nutriente, valor) {
  const tramo = TOLERANCIAS_UE[nutriente].find((t) => valor < t.hasta);
  return tramo.gramos ?? tramo.parte * valor;
}

// Una diferencia es real si es mayor que la tolerancia del valor más alto de los dos.
// Las calorías, que no tienen tolerancia propia, con al menos 10 kcal y un 10 %.
export function diferenciaReal(nutriente, a, b) {
  if (a == null || b == null) return false;
  const d = Math.abs(a - b);
  const mayor = Math.max(a, b);
  if (nutriente === 'kcal') return d >= DIFERENCIA_CALORIAS.minimo && d >= DIFERENCIA_CALORIAS.parte * mayor;
  return d > tolerancia(nutriente, mayor);
}

const NUTRIENTES = ['kcal', 'grasa', 'saturadas', 'carbohidratos', 'azucares', 'fibra', 'proteina', 'sal'];

// ¿Se pueden distinguir con la etiqueta? Sí, si algún nutriente difiere más que la
// tolerancia, o si cambia algo que sale de los ingredientes (procesamiento, azúcar agregado).
function distinguibles(fichaA, fichaB) {
  const na = fichaA.nutrientes ?? {};
  const nb = fichaB.nutrientes ?? {};
  if (NUTRIENTES.some((x) => diferenciaReal(x, na[x], nb[x]))) return true;
  const da = derivar(fichaA);
  const db = derivar(fichaB);
  if (da.procesamiento && db.procesamiento && da.procesamiento !== db.procesamiento) return true;
  const aa = da.azucarAgregado.hay;
  const ab = db.azucarAgregado.hay;
  return aa != null && ab != null && aa !== ab;
}

// "Si buscás…": criterio, qué nutriente mira y si gana el mayor o el menor.
const CRITERIOS = [
  { clave: 'masProteina', nutriente: 'proteina', mejor: 'mayor' },
  { clave: 'menosCalorias', nutriente: 'kcal', mejor: 'menor' },
  { clave: 'masSaciedad', nutriente: null, mejor: 'mayor' },
  { clave: 'menosGrasa', nutriente: 'grasa', mejor: 'menor' },
  { clave: 'menosAzucar', nutriente: 'azucares', mejor: 'menor' },
  { clave: 'masFibra', nutriente: 'fibra', mejor: 'mayor' },
  { clave: 'menosSal', nutriente: 'sal', mejor: 'menor' },
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
      // Cuenta solo si cambia algo que se puede distinguir: proteína, fibra o calorías.
      a = indiceSaciedad(fichaA, ra);
      b = indiceSaciedad(fichaB, rb);
      real =
        a != null &&
        b != null &&
        Math.abs(a - b) >= 0.5 &&
        ['proteina', 'fibra', 'kcal'].some((x) => diferenciaReal(x, na[x], nb[x]));
    } else {
      a = na[c.nutriente];
      b = nb[c.nutriente];
      real = diferenciaReal(c.nutriente, a, b);
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
  } else if (!distinguibles(fichaA, fichaB)) {
    decision = { ganador: 'empate', motivo: { tipo: 'indistinguibles' }, empateTecnico: true };
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
