// Textos de ejemplo. En la app real los escribe la IA sobre la nota ya
// calculada, en el idioma y al nivel del usuario.

import { barrita, skyr, nueces, yogurProteicoSinIngredientes } from './ejemplos.js';

export const textosEjemplo = {
  barrita: {
    es: {
      detectado: 'barrita de cereal',
      titular: 'Más golosina que snack saludable.',
      motivoLinea: 'Mucho azúcar agregado y casi nada de proteína: suma calorías rápido y no sacia.',
      cuandoSi: 'Solo antes de un entrenamiento intenso de más de una hora, o si llevás muchas horas sin comer.',
      cuandoNo: 'Como snack o pre-entreno de rutina: para una sesión normal no la necesitás.',
      resumen: {
        maloPorque:
          'Jarabe de glucosa en segundo lugar y aceite de palma: casi todo el azúcar es agregado y la grasa es mayormente saturada.',
        excesoDe: 'Azúcar (24 g) y grasas saturadas (6 g).',
        bajoEn: 'Proteína: 1,6 g cada 100 calorías.',
        loRescatable: 'La avena integral aporta 5 g de fibra. No alcanza para compensar el azúcar.',
      },
      deDondeViene: [
        { nombre: 'Azúcar', cantidad: '24 g', texto: 'Casi todo agregado: jarabe de glucosa, azúcar y el chocolate. La avena aporta muy poco.' },
        { nombre: 'Grasas', cantidad: '16 g', texto: '6 g saturadas y unos 10 g insaturadas. Las saturadas vienen del aceite de palma y el chocolate.' },
        { nombre: 'Fibra', cantidad: '5 g', texto: 'Propia de la avena integral, no agregada. Sacia de verdad.' },
      ],
      aporta: [
        {
          titulo: 'Betaglucanos de la avena',
          texto: 'Fibra soluble: ayuda a bajar el colesterol y hace que el azúcar pase más lento a la sangre.',
        },
      ],
      noSePuedeSaber: ['Cuánto del azúcar es agregado exactamente: la etiqueta solo declara el total.'],
      sugerencia:
        'Buscá una barrita con menos de 10 g de azúcar cada 100 g. Las de frutos secos y avena sin jarabe suelen cumplirlo.',
      dato: {
        titulo: '¿Por qué el jarabe de glucosa cuenta como azúcar?',
        texto:
          'Es almidón ya "cortado" en azúcar. El cuerpo lo absorbe igual de rápido que el azúcar de mesa, aunque en la etiqueta tenga otro nombre.',
      },
      etiquetas: {
        exceso_azucar: {
          porQue: 'Tiene 24 g de azúcar, casi todo agregado: el jarabe de glucosa está en segundo lugar.',
          paraVos: 'Para bajar grasa, este azúcar suma calorías que no sacian: al rato vas a tener hambre de nuevo.',
        },
        proteina_baja: {
          porQue: 'Solo 1,6 g de proteína cada 100 calorías.',
          paraVos: 'Priorizás la proteína: este producto casi no te acerca a tu meta del día.',
        },
      },
    },
    en: {
      detectado: 'cereal bar',
      titular: 'More candy than healthy snack.',
      motivoLinea: 'Lots of added sugar and almost no protein: adds calories fast and doesn’t fill you up.',
      cuandoSi: 'Only before an intense workout of more than an hour, or after many hours without food.',
      cuandoNo: 'As a routine snack or pre-workout: a normal session doesn’t need it.',
      resumen: {
        maloPorque:
          'Glucose syrup in second place and palm oil: almost all the sugar is added and the fat is mostly saturated.',
        excesoDe: 'Sugar (24 g) and saturated fat (6 g).',
        bajoEn: 'Protein: 1.6 g per 100 calories.',
        loRescatable: 'Whole oats add 5 g of fiber. Not enough to make up for the sugar.',
      },
      deDondeViene: [
        { nombre: 'Sugar', cantidad: '24 g', texto: 'Almost all added: glucose syrup, sugar and chocolate. Oats add very little.' },
        { nombre: 'Fat', cantidad: '16 g', texto: '6 g saturated and about 10 g unsaturated. The saturated fat comes from palm oil and chocolate.' },
        { nombre: 'Fiber', cantidad: '5 g', texto: 'From the whole oats, not added. It really fills you up.' },
      ],
      aporta: [{ titulo: 'Oat beta-glucans', texto: 'Soluble fiber: helps lower cholesterol and slows sugar into your blood.' }],
      noSePuedeSaber: ['Exactly how much of the sugar is added: the label only declares the total.'],
      sugerencia: 'Look for a bar with less than 10 g of sugar per 100 g. Nut-and-oat bars without syrup usually make it.',
      dato: {
        titulo: 'Why does glucose syrup count as sugar?',
        texto:
          'It’s starch already "cut" into sugar. Your body absorbs it as fast as table sugar, even with a different name on the label.',
      },
      etiquetas: {},
    },
  },

  skyr: {
    es: {
      detectado: 'yogur tipo skyr',
      titular: 'Proteína de sobra con muy pocas calorías.',
      motivoLinea: '17 g de proteína cada 100 calorías: llena mucho y suma poco.',
      cuandoSi: 'En el desayuno, entre comidas o después de entrenar.',
      cuandoNo: 'No hay un momento malo; si lo endulzás, que sea con fruta.',
      resumen: {
        buenoPorque: 'Leche descremada y cultivos, nada más. Mucha proteína, casi sin grasa ni azúcar agregado.',
      },
      deDondeViene: [
        { nombre: 'Azúcar', cantidad: '4 g', texto: 'Es la lactosa propia de la leche. No tiene azúcar agregado.' },
        { nombre: 'Proteína', cantidad: '11 g', texto: 'Viene de la leche concentrada, no de aislados agregados.' },
      ],
      aporta: [{ titulo: 'Calcio', texto: 'Para huesos y músculos.' }],
      noSePuedeSaber: [],
      sugerencia: null,
      dato: {
        titulo: '¿Por qué el skyr tiene más proteína que un yogur común?',
        texto: 'Se cuela y se le saca parte del suero: queda más concentrado. Hacen falta unos 3 a 4 litros de leche por kilo.',
      },
      etiquetas: {},
    },
  },

  nueces: {
    es: {
      detectado: 'nueces',
      titular: 'Un gran alimento, en porciones chicas.',
      motivoLinea: 'Grasas buenas y fibra, pero 650 calorías cada 100 g: un puñado alcanza.',
      cuandoSi: 'Un puñado (unos 30 g, unas 200 calorías) en el desayuno o entre comidas.',
      cuandoNo: 'Para picar sin medir, directo de la bolsa.',
      resumen: {
        buenoPorque: 'Un solo ingrediente. Casi toda su grasa es insaturada, con omega-3.',
        excesoDe: 'Calorías: 654 cada 100 g.',
      },
      deDondeViene: [
        { nombre: 'Grasas', cantidad: '65 g', texto: 'Unos 59 g insaturadas, con omega-3 vegetal. Solo 6 g saturadas.' },
        { nombre: 'Fibra', cantidad: '6,7 g', texto: 'Propia de la nuez.' },
      ],
      aporta: [{ titulo: 'Omega-3 (ALA)', texto: 'Salud del corazón y del cerebro, menos inflamación.' }],
      noSePuedeSaber: [],
      sugerencia: null,
      dato: {
        titulo: '¿Las calorías de las nueces cuentan igual?',
        texto: 'Casi: parte de su grasa queda atrapada en la fibra y no se absorbe. Igual son muy calóricas, así que la porción importa.',
      },
      etiquetas: {},
    },
  },

  yogurProteico: {
    es: {
      detectado: 'yogur proteico',
      titular: 'Pinta bien. Falta confirmar con los ingredientes.',
      motivoLinea: '14 g de proteína cada 100 calorías y pocas calorías.',
      cuandoSi: 'Después de entrenar o como snack entre comidas.',
      cuandoNo: 'No hay un momento malo; falta ver si tiene edulcorantes.',
      resumen: { buenoPorque: 'Mucha proteína con pocas calorías.' },
      deDondeViene: [],
      aporta: [],
      noSePuedeSaber: [
        'Si los 6 g de azúcar son de la leche o agregados.',
        'Si tiene edulcorantes o espesantes (procesamiento).',
        'Alérgenos e intolerancias de tu perfil.',
      ],
      sugerencia: null,
      dato: null,
      etiquetas: {},
    },
  },
};

// Qué ficha corresponde a cada texto de ejemplo, para cargarlos en el historial.
export const ejemplosParaHistorial = [
  { id: 'ejemplo-barrita', ficha: barrita, textos: textosEjemplo.barrita },
  { id: 'ejemplo-skyr', ficha: skyr, textos: textosEjemplo.skyr },
  { id: 'ejemplo-nueces', ficha: nueces, textos: textosEjemplo.nueces },
  { id: 'ejemplo-yogur', ficha: yogurProteicoSinIngredientes, textos: textosEjemplo.yogurProteico },
];
