// Profile question texts in English.

export default {
  progreso: '{n} of {total}',
  algoMas: 'Anything else?',
  opcional: 'Optional',
  siguiente: 'Next',
  listo: 'Done',
  atras: 'Back',
  cerrar: 'Close without saving',
  saltear: 'Skip',
  sinRestricciones: 'I have no restrictions',
  principal: 'Main',
  maximo: 'You can pick up to {n}.',

  objetivo: {
    titulo: 'What’s your goal?',
    ayuda: 'It decides whether a food helps or works against you.',
    indicacion: 'Pick up to 2. The first one is the main one.',
    ejemplo: 'E.g. I want to lose 5 kg before summer',
    opciones: {
      bajar_grasa: 'Lose fat',
      mantener_peso: 'Keep my weight',
      ganar_musculo: 'Build muscle',
      rendir_deporte: 'Perform better in my sport',
      comer_sano: 'Eat healthier, no weight goal',
      mas_energia: 'Have more energy during the day',
      digestion: 'Improve my digestion',
      salud_largo_plazo: 'Look after my long-term health',
      aprender: 'Learn to choose better',
    },
  },

  prioridades: {
    titulo: 'What do you want to prioritize?',
    ayuda: 'These criteria weigh more when I analyze a food.',
    indicacion: 'Pick up to 3.',
    ejemplo: 'E.g. I want to quit soda',
    opciones: {
      mas_proteina: { titulo: 'More protein', texto: 'For muscle and fullness' },
      mas_saciedad: { titulo: 'More fullness', texto: 'Filling and lasting' },
      mas_fibra: { titulo: 'More fiber', texto: 'For digestion and steady energy' },
      menos_azucar: { titulo: 'Less sugar', texto: 'Avoid energy spikes and crashes' },
      menos_sal: { titulo: 'Less salt', texto: 'Look after blood pressure and water retention' },
      menos_saturadas: { titulo: 'Less saturated fat', texto: 'Look after heart and cholesterol' },
      menos_calorias: { titulo: 'Fewer calories', texto: 'Get full without adding much' },
      menos_ultraprocesados: { titulo: 'Less ultra-processed', texto: 'Simpler, real food' },
    },
  },

  dia: {
    titulo: 'What’s your day like?',
    ayuda: 'How much you move outside training changes a lot how much you burn.',
    indicacion: 'Pick one.',
    ejemplo: 'E.g. I bike to work',
    opciones: {
      sentado: 'Mostly sitting',
      de_pie: 'A lot of standing or walking',
      fisico: 'Physical work: I carry things or move all day',
      varia: 'It varies a lot from day to day',
    },
  },

  actividad: {
    titulo: 'What physical activity do you do?',
    ayuda: 'Everything counts, from walking to training. I use it to tell you when a food is useful.',
    ejemplo: 'E.g. I train fasted in the morning',
    bloques: {
      actividades: 'What do you do? Pick all that apply',
      actividadDias: 'How many days a week?',
      actividadDuracion: 'How long does it usually last?',
    },
    opciones: {
      ninguna: 'I don’t do physical activity',
      caminar: 'Walking (I go for walks on purpose)',
      gimnasio: 'Gym / weights',
      cross: 'Cross or functional training',
      running: 'Running',
      bici: 'Cycling',
      natacion: 'Swimming',
      equipo: 'Team sports',
      yoga: 'Yoga, pilates or mobility',
      '1_2': '1–2',
      '3_4': '3–4',
      '5_mas': '5 or more',
      menos_45: 'Under 45 min',
      '45_90': '45–90 min',
      mas_90: 'Over 90 min',
    },
  },

  restricciones1: {
    titulo: 'What can’t you or don’t you want to eat?',
    ayuda: 'I check it in every analysis and warn you. You can change it anytime.',
    bloques: {
      alimentacion: 'Diet',
      alergias: 'Allergies',
    },
    ayudas: {
      alergias:
        'The 14 EU allergens. I also detect them under other names in the ingredients. For example, spelt has gluten even if it doesn’t say "wheat".',
    },
    opciones: {
      todo: 'I eat everything',
      vegetariana: 'Vegetarian',
      vegana: 'Vegan',
      keto: 'Low carb / keto',
      gluten: 'Gluten',
      leche: 'Milk',
      huevo: 'Egg',
      frutos_secos: 'Tree nuts',
      mani: 'Peanuts',
      soja: 'Soy',
      pescado: 'Fish',
      crustaceos: 'Crustaceans',
      moluscos: 'Molluscs',
      sesamo: 'Sesame',
      apio: 'Celery',
      mostaza: 'Mustard',
      sulfitos: 'Sulphites',
      altramuces: 'Lupin',
    },
  },

  restricciones2: {
    titulo: 'What can’t you or don’t you want to eat?',
    ayuda: 'I check it in every analysis and warn you. You can change it anytime.',
    bloques: {
      intolerancias: 'Intolerances',
      evitaTexto: 'Anything else you avoid?',
      evitaRapidos: '',
    },
    ayudas: {
      intolerancias:
        'Not the same as an allergy. For example: lactose-free milk works for the intolerance, but not for a milk allergy.',
      evitaTexto: 'Optional. For taste, religion or habit.',
    },
    ejemplos: { evitaTexto: 'Type, for example: spicy' },
    opciones: {
      lactosa: { titulo: 'Lactose', texto: 'Milk sugar. Detects lactose and dairy derivatives.' },
      fructosa: { titulo: 'Fructose', texto: 'Honey, agave, fructose syrup, lots of concentrated fruit.' },
      polioles: { titulo: 'Polyols', texto: 'Sweeteners like sorbitol, maltitol or xylitol.' },
      fodmap: { titulo: 'Low FODMAP', texto: 'For SIBO or irritable bowel.' },
      cerdo: 'Pork',
      alcohol: 'Alcohol',
      picante: 'Spicy',
      cafeina: 'Caffeine',
      carne_roja: 'Red meat',
    },
  },

  salud: {
    titulo: 'Anything about your health I should keep in mind?',
    ayuda: 'Optional. It only adjusts the alerts; it doesn’t replace your doctor.',
    indicacion: 'Pick all that apply.',
    ejemplo: 'E.g. my doctor told me to cut down on salt',
    opciones: {
      presion_alta: 'High blood pressure',
      colesterol: 'High cholesterol',
      glucosa: 'Diabetes or high blood sugar',
      renal: 'Kidney disease',
      ninguna: 'None',
      prefiero_no_decir: 'I’d rather not say',
    },
  },

  momentos: {
    titulo: 'When do you usually eat packaged food?',
    ayuda: 'So I can tell you if something works in your real moments.',
    indicacion: 'Pick all that apply.',
    ejemplo: 'E.g. I eat a lot in the car',
    opciones: {
      desayuno: 'Breakfast',
      entre_comidas: 'Between meals (at work, on the go…)',
      entreno: 'Before or after training',
      cena_rapida: 'Quick dinner',
      dulce: 'Something sweet or dessert',
      noche: 'Late-night snacking',
    },
  },

  dificultades: {
    titulo: 'What’s hardest for you?',
    ayuda: 'No judgment. It helps me highlight what works best for you.',
    indicacion: 'Pick all that apply.',
    ejemplo: 'E.g. I lose control on weekends',
    opciones: {
      hambre: 'I get hungry between meals',
      antojos_dulce: 'I crave sweets',
      aburrimiento: 'I snack out of boredom or stress',
      rapido: 'I eat fast, without thinking',
      salteo_comidas: 'I skip meals and then get very hungry',
      proteina: 'It’s hard to get enough protein',
      bebidas: 'I often drink sugary drinks or alcohol',
      nada: 'None of these',
    },
  },

  nivel: {
    titulo: 'How much do you know about nutrition?',
    ayuda: 'So I explain things at your level.',
    indicacion: 'Pick one.',
    ejemplo: 'E.g. I want to learn about fats',
    opciones: {
      nada: { titulo: 'Nothing', texto: 'Explain everything from scratch.' },
      basico: { titulo: 'The basics', texto: 'I know what calories and protein are.' },
      etiquetas: { titulo: 'I read labels', texto: 'I understand macros and compare products.' },
      experto: { titulo: 'Expert', texto: 'Talk technical, don’t simplify.' },
    },
  },

  exigencia: {
    titulo: 'How strict do you want me to be?',
    ayuda: 'It changes how hard the score is on excesses.',
    indicacion: 'Pick one.',
    ejemplo: 'E.g. I prefer you tell me straight',
    opciones: {
      flexible: { titulo: 'Flexible', texto: 'I flag what matters, without being strict.' },
      equilibrada: { titulo: 'Balanced (recommended)', texto: 'Clear criteria, no exaggeration.' },
      estricta: { titulo: 'Strict', texto: 'Straight talk; if it doesn’t help, I tell you.' },
    },
  },
};
