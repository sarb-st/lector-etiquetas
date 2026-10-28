// Línea de objetivo: Suma / Consumir con moderación / Resta.
// Ver docs/reglamento-puntaje.md, sección 2.

import {
  ASPECTOS,
  VOTOS_POR_OBJETIVO,
  OBJETIVO_NEUTRO,
  PESO_OBJETIVO_SECUNDARIO,
  VOTOS_PRIORIDADES,
  VOTOS_SALUD,
  VOTOS_DIFICULTADES,
  KETO,
  SENALES,
  LINEA,
  CATEGORIAS_POCA_CANTIDAD,
  BEBIDA_AZUCARADA_MINIMO,
} from './reglas.js';
import { derivar, tieneValor } from './derivados.js';

// Completa con valores neutros lo que el usuario todavía no respondió.
// perfil = {
//   objetivos: ['bajar_grasa', 'ganar_musculo'],   // hasta 2, el primero manda
//   prioridades: ['mas_proteina', ...],             // hasta 3
//   salud: ['presion_alta', 'colesterol', 'glucosa', 'renal'],
//   dificultades: ['hambre', 'antojos_dulce', 'salteo_comidas', 'proteina', 'bebidas', ...],
//   alimentacion: 'todo' | 'vegetariana' | 'vegana' | 'keto',
//   exigencia: 'flexible' | 'equilibrada' | 'estricta',
// }
export function normalizarPerfil(perfilCrudo) {
  const perfil = perfilCrudo ?? {};
  const objetivos = (perfil.objetivos ?? []).filter((o) => VOTOS_POR_OBJETIVO[o]);
  return {
    objetivos: objetivos.length > 0 ? objetivos : [OBJETIVO_NEUTRO],
    prioridades: perfil.prioridades ?? [],
    salud: perfil.salud ?? [],
    dificultades: perfil.dificultades ?? [],
    alimentacion: perfil.alimentacion ?? 'todo',
    exigencia: perfil.exigencia ?? 'equilibrada',
  };
}

// Cuántos votos tiene cada aspecto para este perfil.
export function calcularVotos(perfilCrudo) {
  const perfil = normalizarPerfil(perfilCrudo);
  const votos = Object.fromEntries(ASPECTOS.map((a) => [a, 0]));
  const sumar = (extra, factor = 1) => {
    for (const [aspecto, cantidad] of Object.entries(extra ?? {})) {
      votos[aspecto] = (votos[aspecto] ?? 0) + cantidad * factor;
    }
  };

  const [principal, secundario] = perfil.objetivos;
  sumar(VOTOS_POR_OBJETIVO[principal]);
  if (secundario) sumar(VOTOS_POR_OBJETIVO[secundario], PESO_OBJETIVO_SECUNDARIO);
  for (const p of perfil.prioridades) sumar(VOTOS_PRIORIDADES[p]);
  for (const s of perfil.salud) sumar(VOTOS_SALUD[s]);
  for (const d of perfil.dificultades) sumar(VOTOS_DIFICULTADES[d]);
  if (perfil.alimentacion === 'keto') votos.carbohidratos = KETO.votos;

  return votos;
}

// Cómo vota cada aspecto: 1 a favor, 0 neutral, -1 en contra (o medio voto).
function senales(ficha, d, perfil) {
  const n = d.nutrientes;
  const porNivel = { bajo: 0, medio: -0.5, alto: -1 };
  const s = {};

  const p = d.proteinaPor100kcal;
  if (p === null) s.proteina = 0;
  else if (p >= SENALES.proteina.aFavorDesde) s.proteina = 1;
  else if (p < SENALES.proteina.enContraMenosDe) s.proteina = -1;
  else s.proteina = 0;
  if (perfil.salud.includes('renal')) s.proteina = Math.min(s.proteina, 0);

  if (!tieneValor(n.kcal)) s.calorias = 0;
  else if (n.kcal <= SENALES.calorias.aFavorHasta) s.calorias = 1;
  else if (n.kcal > SENALES.calorias.enContraMasDe) s.calorias = -1;
  else s.calorias = 0;

  s.fibra = d.nivelFibra === 2 ? 1 : d.nivelFibra === 1 ? 0.5 : 0;
  s.azucar = d.niveles.azucar ? porNivel[d.niveles.azucar] : 0;
  s.sal = d.niveles.sal ? porNivel[d.niveles.sal] : 0;
  s.saturadas = d.grasasBuenas || !d.niveles.saturadas ? 0 : porNivel[d.niveles.saturadas];

  if (d.procesamiento === 'natural' || d.procesamiento === 'minimo') s.procesamiento = 1;
  else if (d.procesamiento === 'ultra') s.procesamiento = -1;
  else s.procesamiento = 0;

  s.carbohidratos = tieneValor(n.carbohidratos) && n.carbohidratos > KETO.carbohidratosMaximo ? -1 : 0;
  return s;
}

// Devuelve:
// {
//   linea: 'suma' | 'moderacion' | 'resta' | null,   null si no hay nota
//   balance: número entre -1 y 1 (votos a favor menos en contra, sobre el total),
//   votos: [{ aspecto, votos, senal }],   para explicar el motivo
//   excepcion: 'poca_cantidad' | 'bebidas' | null,
// }
export function calcularLineaObjetivo(ficha, perfilCrudo, nota) {
  if (nota === null || nota === undefined) {
    return { linea: null, balance: null, votos: [], excepcion: null };
  }
  const perfil = normalizarPerfil(perfilCrudo);
  const d = derivar(ficha);
  const votos = calcularVotos(perfil);
  const s = senales(ficha, d, perfil);

  let total = 0;
  let resultado = 0;
  const detalle = [];
  for (const [aspecto, cantidad] of Object.entries(votos)) {
    if (cantidad <= 0) continue;
    total += cantidad;
    resultado += cantidad * s[aspecto];
    detalle.push({ aspecto, votos: cantidad, senal: s[aspecto] });
  }
  const balance = total > 0 ? resultado / total : 0;

  let linea;
  if (balance < -LINEA.margen || nota <= LINEA.notaMaximaResta) linea = 'resta';
  else if (balance > LINEA.margen && nota >= LINEA.notaMinimaSuma) linea = 'suma';
  else linea = 'moderacion';

  let excepcion = null;
  if (linea === 'resta' && CATEGORIAS_POCA_CANTIDAD.includes(ficha.categoria) && nota >= LINEA.pocaCantidadNotaMinima) {
    linea = 'moderacion';
    excepcion = 'poca_cantidad';
  }

  const esBebidaAzucarada =
    ficha.esBebida && d.azucarAgregado.hay && tieneValor(d.nutrientes.azucares) && d.nutrientes.azucares > BEBIDA_AZUCARADA_MINIMO;
  if (esBebidaAzucarada && perfil.dificultades.includes('bebidas')) {
    linea = 'resta';
    excepcion = 'bebidas';
  }

  return { linea, balance, votos: detalle, excepcion };
}
