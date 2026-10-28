// Nota de calidad del 1 al 10. Ver docs/reglamento-puntaje.md, sección 1.

import {
  NOTA_INICIAL,
  NOTA_MINIMA,
  NOTA_MAXIMA,
  RESTA_POR_NIVEL,
  PROTEINA_ESCALONES,
  PUNTOS_PROCESAMIENTO,
  GRASAS_BUENAS,
  CALORIAS_ESCALONES,
  TECHOS,
  CALORIAS_TECHO,
  BEBIDA_AZUCARADA_MINIMO,
  AJUSTE_EXIGENCIA,
  AJUSTE_TECHOS_SIMPLES,
} from './reglas.js';
import { derivar, tieneValor } from './derivados.js';

// Redondeo donde el medio sube: 7,5 da 8.
const redondear = (x) => Math.floor(x + 0.5);

function puntosDeLaFormula(d) {
  const n = d.nutrientes;
  const detalle = [];
  const anotar = (clave, puntos) => {
    if (puntos !== 0) detalle.push({ clave, puntos });
  };

  // Suma
  const proteina = d.proteinaPor100kcal;
  const escalonProteina = proteina === null ? null : PROTEINA_ESCALONES.find((e) => proteina >= e.desde);
  anotar('proteina', escalonProteina ? escalonProteina.puntos : 0);
  anotar('fibra', d.nivelFibra);
  if (d.procesamiento) anotar('procesamiento', PUNTOS_PROCESAMIENTO[d.procesamiento]);
  if (d.grasasBuenas) anotar('grasas_buenas', GRASAS_BUENAS.puntos);

  // Resta
  if (d.niveles.azucar) anotar('azucar', RESTA_POR_NIVEL[d.niveles.azucar]);
  if (d.niveles.saturadas && !d.grasasBuenas) anotar('saturadas', RESTA_POR_NIVEL[d.niveles.saturadas]);
  if (d.niveles.sal) anotar('sal', RESTA_POR_NIVEL[d.niveles.sal]);
  if (!d.esSimple && tieneValor(n.kcal)) {
    const escalonKcal = CALORIAS_ESCALONES.find((e) => n.kcal > e.masDe);
    if (escalonKcal) anotar('calorias', escalonKcal.puntos);
  }

  const total = detalle.reduce((suma, item) => suma + item.puntos, NOTA_INICIAL);
  return { total, detalle };
}

function techosQueAplican(ficha, d, exigencia) {
  const ajuste = AJUSTE_EXIGENCIA[exigencia] ?? 0;
  const ajusteSimple = d.esSimple ? AJUSTE_TECHOS_SIMPLES : 0;
  const n = d.nutrientes;
  const techos = [];
  const agregar = (clave, valor) => techos.push({ clave, valor });

  const excesoAzucarAgregado = d.niveles.azucar === 'alto' && d.azucarAgregado.casiTodo === true;
  const excesoSal = d.niveles.sal === 'alto';
  const excesoSaturadas = d.niveles.saturadas === 'alto' && d.saturadasMala;

  if (excesoAzucarAgregado) agregar('azucar_agregado', TECHOS.azucarAgregado + ajuste);
  if (excesoSal) agregar('sal', TECHOS.sal + ajuste + ajusteSimple);
  if (excesoSaturadas) agregar('saturadas', TECHOS.saturadas + ajuste + ajusteSimple);

  const cantidadExcesos = [excesoAzucarAgregado, excesoSal, excesoSaturadas].filter(Boolean).length;
  if (cantidadExcesos >= 2 && !d.esSimple) agregar('dos_excesos', TECHOS.dosExcesos + ajuste);

  if (ficha.esBebida && d.azucarAgregado.hay && tieneValor(n.azucares) && n.azucares > BEBIDA_AZUCARADA_MINIMO) {
    agregar('bebida_azucarada', TECHOS.bebidaAzucarada + ajuste);
  }
  if (d.procesamiento === 'ultra') agregar('ultraprocesado', TECHOS.ultraprocesado + ajuste);
  if (tieneValor(n.kcal) && n.kcal > CALORIAS_TECHO) agregar('calorias', TECHOS.calorias + ajuste);
  if (!d.tieneIngredientes) agregar('parcial', TECHOS.parcial);

  return techos;
}

const limitar = (nota) => Math.min(NOTA_MAXIMA, Math.max(NOTA_MINIMA, nota));

// Devuelve:
// {
//   nota: 1..10 | null,     null si no hay tabla nutricional (no se puede puntuar)
//   provisional: boolean,   true si falta la lista de ingredientes
//   sinPuntajeMotivo: 'sin_tabla' | null,
//   puntosAntesDeTechos,    la cuenta sin redondear
//   detalle: [{ clave, puntos }],
//   techos: [{ clave, valor }],    todos los que aplican
//   techoAplicado: { clave, valor } | null,   el que bajó la nota, si alguno
// }
export function calcularCalidad(ficha, exigencia = 'equilibrada') {
  const d = derivar(ficha);

  if (!d.tieneTabla && d.notaAceite === null) {
    return {
      nota: null,
      provisional: false,
      sinPuntajeMotivo: 'sin_tabla',
      puntosAntesDeTechos: null,
      detalle: [],
      techos: [],
      techoAplicado: null,
    };
  }

  const provisional = !d.tieneIngredientes;

  if (d.notaAceite !== null) {
    return {
      nota: d.notaAceite,
      provisional,
      sinPuntajeMotivo: null,
      puntosAntesDeTechos: d.notaAceite,
      detalle: [{ clave: `aceite_${ficha.tipoAceite}`, puntos: d.notaAceite }],
      techos: [],
      techoAplicado: null,
    };
  }

  const { total, detalle } = puntosDeLaFormula(d);
  const notaSinTechos = limitar(redondear(total));
  const techos = techosQueAplican(ficha, d, exigencia);

  let nota = notaSinTechos;
  let techoAplicado = null;
  for (const techo of techos) {
    if (techo.valor < nota) {
      nota = techo.valor;
      techoAplicado = techo;
    }
  }

  return {
    nota: limitar(nota),
    provisional,
    sinPuntajeMotivo: null,
    puntosAntesDeTechos: total,
    detalle,
    techos,
    techoAplicado,
  };
}
