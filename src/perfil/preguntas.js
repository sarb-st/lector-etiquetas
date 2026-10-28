// Las 10 preguntas del perfil (definición, sección 10).
// Acá va solo la estructura; los textos están en src/i18n/preguntas-*.js.
//
// Cada paso es una pantalla. La pregunta 5 ocupa dos pantallas.
// Tipos de bloque:
//   unica     elegí una
//   varias    elegí varias (max: tope; exclusivas: opciones que desmarcan al resto)
//   texto     campo de texto libre
// "extra" es el campo opcional "¿Algo más?".

export const PASOS = [
  {
    id: 'objetivo',
    numero: 1,
    bloques: [
      {
        campo: 'objetivos',
        tipo: 'varias',
        max: 2,
        ordenado: true,
        opciones: [
          'bajar_grasa',
          'mantener_peso',
          'ganar_musculo',
          'rendir_deporte',
          'comer_sano',
          'mas_energia',
          'digestion',
          'salud_largo_plazo',
          'aprender',
        ],
      },
    ],
    extra: 'objetivoExtra',
  },
  {
    id: 'prioridades',
    numero: 2,
    bloques: [
      {
        campo: 'prioridades',
        tipo: 'varias',
        max: 3,
        conDescripcion: true,
        opciones: [
          'mas_proteina',
          'mas_saciedad',
          'mas_fibra',
          'menos_azucar',
          'menos_sal',
          'menos_saturadas',
          'menos_calorias',
          'menos_ultraprocesados',
        ],
      },
    ],
    extra: 'prioridadesExtra',
  },
  {
    id: 'dia',
    numero: 3,
    bloques: [{ campo: 'dia', tipo: 'unica', opciones: ['sentado', 'de_pie', 'fisico', 'varia'] }],
    extra: 'diaExtra',
  },
  {
    id: 'actividad',
    numero: 4,
    bloques: [
      {
        campo: 'actividades',
        tipo: 'varias',
        exclusivas: ['ninguna'],
        opciones: ['ninguna', 'caminar', 'gimnasio', 'cross', 'running', 'bici', 'natacion', 'equipo', 'yoga'],
      },
      { campo: 'actividadDias', tipo: 'unica', opciones: ['1_2', '3_4', '5_mas'], ocultarSi: { actividades: 'ninguna' } },
      {
        campo: 'actividadDuracion',
        tipo: 'unica',
        opciones: ['menos_45', '45_90', 'mas_90'],
        ocultarSi: { actividades: 'ninguna' },
      },
    ],
    extra: 'actividadExtra',
  },
  {
    id: 'restricciones1',
    numero: 5,
    bloques: [
      { campo: 'alimentacion', tipo: 'unica', opciones: ['todo', 'vegetariana', 'vegana', 'keto'] },
      {
        campo: 'alergias',
        tipo: 'varias',
        opciones: [
          'gluten',
          'leche',
          'huevo',
          'frutos_secos',
          'mani',
          'soja',
          'pescado',
          'crustaceos',
          'moluscos',
          'sesamo',
          'apio',
          'mostaza',
          'sulfitos',
          'altramuces',
        ],
      },
    ],
    botonSinRespuesta: 'sinRestricciones',
  },
  {
    id: 'restricciones2',
    numero: 5,
    bloques: [
      {
        campo: 'intolerancias',
        tipo: 'varias',
        conDescripcion: true,
        casillas: true,
        opciones: ['lactosa', 'fructosa', 'polioles', 'fodmap'],
      },
      { campo: 'evitaTexto', tipo: 'texto' },
      { campo: 'evitaRapidos', tipo: 'varias', opciones: ['cerdo', 'alcohol', 'picante', 'cafeina', 'carne_roja'] },
    ],
    botonSinRespuesta: 'sinRestricciones',
  },
  {
    id: 'salud',
    numero: 6,
    opcional: true,
    bloques: [
      {
        campo: 'salud',
        tipo: 'varias',
        exclusivas: ['ninguna', 'prefiero_no_decir'],
        opciones: ['presion_alta', 'colesterol', 'glucosa', 'renal', 'ninguna', 'prefiero_no_decir'],
      },
    ],
    extra: 'saludExtra',
  },
  {
    id: 'momentos',
    numero: 7,
    bloques: [
      {
        campo: 'momentos',
        tipo: 'varias',
        opciones: ['desayuno', 'entre_comidas', 'entreno', 'cena_rapida', 'dulce', 'noche'],
      },
    ],
    extra: 'momentosExtra',
  },
  {
    id: 'dificultades',
    numero: 8,
    bloques: [
      {
        campo: 'dificultades',
        tipo: 'varias',
        exclusivas: ['nada'],
        opciones: [
          'hambre',
          'antojos_dulce',
          'aburrimiento',
          'rapido',
          'salteo_comidas',
          'proteina',
          'bebidas',
          'nada',
        ],
      },
    ],
    extra: 'dificultadesExtra',
  },
  {
    id: 'nivel',
    numero: 9,
    bloques: [{ campo: 'nivel', tipo: 'unica', conDescripcion: true, opciones: ['nada', 'basico', 'etiquetas', 'experto'] }],
    extra: 'nivelExtra',
  },
  {
    id: 'exigencia',
    numero: 10,
    bloques: [
      {
        campo: 'exigencia',
        tipo: 'unica',
        conDescripcion: true,
        opciones: ['flexible', 'equilibrada', 'estricta'],
      },
    ],
    extra: 'exigenciaExtra',
  },
];

// Grupos de preguntas según el momento en que aparecen (definición 10.1).
export const GRUPOS = {
  inicio: ['objetivo', 'restricciones1', 'restricciones2', 'nivel'],
  puntaje: ['prioridades', 'exigencia', 'salud'],
  consejos: ['dia', 'actividad', 'momentos', 'dificultades'],
  todo: PASOS.map((p) => p.id),
};

export const TOTAL_PREGUNTAS = 10;

// Pasos ya respondidos. Los perfiles viejos solo guardaban los grupos completos.
function pasosRespondidos(perfil) {
  const hechos = new Set(perfil?.pasosRespondidos ?? []);
  for (const grupo of perfil?.respondidas ?? []) (GRUPOS[grupo] ?? []).forEach((id) => hechos.add(id));
  return hechos;
}

// Una pregunta cuenta como respondida cuando se respondieron todas sus pantallas.
export function completitud(perfil) {
  const hechos = pasosRespondidos(perfil);
  let respondidas = 0;
  for (let numero = 1; numero <= TOTAL_PREGUNTAS; numero++) {
    const pantallas = PASOS.filter((p) => p.numero === numero);
    if (pantallas.every((p) => hechos.has(p.id))) respondidas++;
  }
  return { respondidas, total: TOTAL_PREGUNTAS, porcentaje: Math.round((respondidas / TOTAL_PREGUNTAS) * 100) };
}

export function grupoRespondido(perfil, grupo) {
  const hechos = pasosRespondidos(perfil);
  return (GRUPOS[grupo] ?? []).every((id) => hechos.has(id));
}

export function pasosFaltantes(perfil) {
  const hechos = pasosRespondidos(perfil);
  return PASOS.filter((p) => !hechos.has(p.id)).map((p) => p.id);
}

export function paso(id) {
  return PASOS.find((p) => p.id === id) ?? null;
}

// Un bloque se oculta si otra respuesta lo vuelve innecesario
// (por ejemplo, "No hago actividad física" oculta días y duración).
export function bloqueVisible(bloque, respuestas) {
  if (!bloque.ocultarSi) return true;
  return !Object.entries(bloque.ocultarSi).some(([campo, valor]) => {
    const r = respuestas[campo];
    return Array.isArray(r) ? r.includes(valor) : r === valor;
  });
}
