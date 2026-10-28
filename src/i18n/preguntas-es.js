// Textos de las preguntas del perfil (definición, sección 10.2).

export default {
  progreso: '{n} de {total}',
  algoMas: '¿Algo más?',
  opcional: 'Opcional',
  siguiente: 'Siguiente',
  listo: 'Listo',
  atras: 'Atrás',
  cerrar: 'Cerrar sin guardar',
  saltear: 'Saltear',
  sinRestricciones: 'No tengo restricciones',
  principal: 'Principal',
  maximo: 'Podés elegir hasta {n}.',

  objetivo: {
    titulo: '¿Cuál es tu objetivo?',
    ayuda: 'Define si un alimento suma o resta para vos.',
    indicacion: 'Elegí hasta 2. La primera es la principal.',
    ejemplo: 'Ej.: quiero bajar 5 kg antes del verano',
    opciones: {
      bajar_grasa: 'Bajar grasa',
      mantener_peso: 'Mantener mi peso',
      ganar_musculo: 'Ganar músculo',
      rendir_deporte: 'Rendir mejor en mi deporte',
      comer_sano: 'Comer más sano, sin objetivo de peso',
      mas_energia: 'Tener más energía durante el día',
      digestion: 'Mejorar mi digestión',
      salud_largo_plazo: 'Cuidar mi salud a largo plazo',
      aprender: 'Aprender a elegir mejor',
    },
  },

  prioridades: {
    titulo: '¿Qué querés priorizar?',
    ayuda: 'Le da más peso a estos criterios cuando analizo un alimento.',
    indicacion: 'Elegí hasta 3.',
    ejemplo: 'Ej.: quiero dejar las gaseosas',
    opciones: {
      mas_proteina: { titulo: 'Más proteína', texto: 'Para el músculo y la saciedad' },
      mas_saciedad: { titulo: 'Más saciedad', texto: 'Que me llene y me dure' },
      mas_fibra: { titulo: 'Más fibra', texto: 'Para la digestión y la energía estable' },
      menos_azucar: { titulo: 'Menos azúcar', texto: 'Evitar picos y bajones de energía' },
      menos_sal: { titulo: 'Menos sal', texto: 'Cuidar la presión y la retención de líquidos' },
      menos_saturadas: { titulo: 'Menos grasas saturadas', texto: 'Cuidar el corazón y el colesterol' },
      menos_calorias: { titulo: 'Menos calorías', texto: 'Llenarme sin sumar tanto' },
      menos_ultraprocesados: { titulo: 'Menos ultraprocesados', texto: 'Comida más simple y real' },
    },
  },

  dia: {
    titulo: '¿Cómo es tu día?',
    ayuda: 'Cuánto te movés fuera del entrenamiento cambia mucho lo que gastás.',
    indicacion: 'Elegí una.',
    ejemplo: 'Ej.: voy en bici al trabajo',
    opciones: {
      sentado: 'Mayormente sentado',
      de_pie: 'Bastante tiempo de pie o caminando',
      fisico: 'Trabajo físico: cargo cosas o me muevo todo el día',
      varia: 'Varía mucho de un día a otro',
    },
  },

  actividad: {
    titulo: '¿Qué actividad física hacés?',
    ayuda: 'Incluye todo: desde caminar hasta entrenar. Lo uso para decirte cuándo un alimento te sirve.',
    ejemplo: 'Ej.: entreno en ayunas a la mañana',
    bloques: {
      actividades: '¿Qué hacés? Elegí todas las que apliquen',
      actividadDias: '¿Cuántos días por semana?',
      actividadDuracion: '¿Cuánto dura normalmente?',
    },
    opciones: {
      ninguna: 'No hago actividad física',
      caminar: 'Caminar (salgo a caminar a propósito)',
      gimnasio: 'Gimnasio / pesas',
      cross: 'Cross o functional training',
      running: 'Running',
      bici: 'Bici',
      natacion: 'Natación',
      equipo: 'Deporte de equipo',
      yoga: 'Yoga, pilates o movilidad',
      '1_2': '1–2',
      '3_4': '3–4',
      '5_mas': '5 o más',
      menos_45: 'Menos de 45 min',
      '45_90': '45–90 min',
      mas_90: 'Más de 90 min',
    },
  },

  restricciones1: {
    titulo: '¿Qué no podés o no querés comer?',
    ayuda: 'Lo reviso en cada análisis y te aviso. Lo podés cambiar cuando quieras.',
    bloques: {
      alimentacion: 'Tipo de alimentación',
      alergias: 'Alergias',
    },
    ayudas: {
      alergias:
        'Los 14 alérgenos de la UE. También los detecto cuando aparecen con otros nombres en los ingredientes. Por ejemplo, la espelta tiene gluten aunque no diga "trigo".',
    },
    opciones: {
      todo: 'Como de todo',
      vegetariana: 'Vegetariana',
      vegana: 'Vegana',
      keto: 'Baja en carbos / keto',
      gluten: 'Gluten',
      leche: 'Leche',
      huevo: 'Huevo',
      frutos_secos: 'Frutos secos',
      mani: 'Maní',
      soja: 'Soja',
      pescado: 'Pescado',
      crustaceos: 'Crustáceos',
      moluscos: 'Moluscos',
      sesamo: 'Sésamo',
      apio: 'Apio',
      mostaza: 'Mostaza',
      sulfitos: 'Sulfitos',
      altramuces: 'Lupino (altramuz)',
    },
  },

  restricciones2: {
    titulo: '¿Qué no podés o no querés comer?',
    ayuda: 'Lo reviso en cada análisis y te aviso. Lo podés cambiar cuando quieras.',
    bloques: {
      intolerancias: 'Intolerancias',
      evitaTexto: '¿Algo más que evites?',
      evitaRapidos: '',
    },
    ayudas: {
      intolerancias:
        'No es lo mismo que una alergia. Por ejemplo: la leche sin lactosa sirve para la intolerancia, pero no para la alergia a la leche.',
      evitaTexto: 'Opcional. Por gusto, religión o costumbre.',
    },
    ejemplos: { evitaTexto: 'Escribí, por ejemplo: picante' },
    opciones: {
      lactosa: { titulo: 'Lactosa', texto: 'El azúcar de la leche. Detecta lactosa y derivados de la leche.' },
      fructosa: { titulo: 'Fructosa', texto: 'Miel, agave, jarabe de fructosa, mucha fruta concentrada.' },
      polioles: { titulo: 'Polioles', texto: 'Edulcorantes como sorbitol, maltitol o xilitol.' },
      fodmap: { titulo: 'Baja en FODMAP', texto: 'Para SIBO o colon irritable.' },
      cerdo: 'Cerdo',
      alcohol: 'Alcohol',
      picante: 'Picante',
      cafeina: 'Cafeína',
      carne_roja: 'Carne roja',
    },
  },

  salud: {
    titulo: '¿Hay algo de salud que quieras que tenga en cuenta?',
    ayuda: 'Opcional. Solo ajusta las alertas; no reemplaza a tu médico.',
    indicacion: 'Elegí todas las que apliquen.',
    ejemplo: 'Ej.: mi médico me pidió bajar la sal',
    opciones: {
      presion_alta: 'Presión alta',
      colesterol: 'Colesterol alto',
      glucosa: 'Diabetes o glucosa alta',
      renal: 'Enfermedad renal',
      ninguna: 'Ninguna',
      prefiero_no_decir: 'Prefiero no decir',
    },
  },

  momentos: {
    titulo: '¿En qué momentos solés comer alimentos envasados?',
    ayuda: 'Así te digo si algo te sirve en tus momentos reales.',
    indicacion: 'Elegí todas las que apliquen.',
    ejemplo: 'Ej.: como mucho en el auto',
    opciones: {
      desayuno: 'Desayuno',
      entre_comidas: 'Entre comidas (en el trabajo, en la calle…)',
      entreno: 'Antes o después de entrenar',
      cena_rapida: 'Cena rápida',
      dulce: 'Algo dulce o postre',
      noche: 'Picoteo a la noche',
    },
  },

  dificultades: {
    titulo: '¿Qué te cuesta más?',
    ayuda: 'Sin juicio. Me ayuda a destacar lo que más te sirve.',
    indicacion: 'Elegí todas las que apliquen.',
    ejemplo: 'Ej.: los fines de semana me descontrolo',
    opciones: {
      hambre: 'Tengo hambre entre comidas',
      antojos_dulce: 'Tengo antojos de dulce',
      aburrimiento: 'Pico por aburrimiento o estrés',
      rapido: 'Como rápido, sin pensar',
      salteo_comidas: 'Me salteo comidas y después llego con mucha hambre',
      proteina: 'Me cuesta llegar a la proteína',
      bebidas: 'Tomo bebidas azucaradas o alcohol seguido',
      nada: 'Nada de esto',
    },
  },

  nivel: {
    titulo: '¿Cuánto sabés de nutrición?',
    ayuda: 'Para explicarte las cosas a tu nivel.',
    indicacion: 'Elegí una.',
    ejemplo: 'Ej.: quiero aprender sobre grasas',
    opciones: {
      nada: { titulo: 'Nada', texto: 'Explicame todo desde cero.' },
      basico: { titulo: 'Lo básico', texto: 'Sé qué son las calorías y las proteínas.' },
      etiquetas: { titulo: 'Leo etiquetas', texto: 'Entiendo los macros y comparo productos.' },
      experto: { titulo: 'Experto', texto: 'Hablame técnico, sin simplificar.' },
    },
  },

  exigencia: {
    titulo: '¿Qué tan exigente querés que sea?',
    ayuda: 'Cambia qué tan duro es el puntaje con los excesos.',
    indicacion: 'Elegí una.',
    ejemplo: 'Ej.: prefiero que me digas las cosas directo',
    opciones: {
      flexible: { titulo: 'Flexible', texto: 'Te aviso de lo importante, sin ser estricta.' },
      equilibrada: { titulo: 'Equilibrada (recomendada)', texto: 'Criterio claro, sin exagerar.' },
      estricta: { titulo: 'Estricta', texto: 'Sin vueltas; si algo no suma, te lo digo.' },
    },
  },
};
