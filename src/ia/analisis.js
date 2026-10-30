// Un análisis completo: leer la etiqueta, calcular con la fórmula y escribir los textos.

import { pedirJSON } from './cliente.js';
import { ESQUEMA_FICHA, SISTEMA_LECTURA, ESQUEMA_TEXTOS, sistemaTextos } from './instrucciones.js';
import { analizar } from '../puntaje/index.js';
import { normalizarPerfil } from '../puntaje/objetivo.js';
import { leerPerfil, agregarAlHistorial, buscarEnHistorial } from '../datos/almacen.js';
import { idioma } from '../i18n/index.js';
import { chequear, restriccionesDelPerfil, textoDeFicha } from './chequeo.js';
import { miniatura } from '../datos/fotos.js';
import { tipoSugerencia } from '../puntaje/sugerencia.js';

const NOMBRE_IDIOMA = { es: 'español', en: 'inglés' };

// fotos: { tabla?, ingredientes? } con { base64, tipo }. off: datos de Open Food Facts o null.
export async function leerEtiqueta({ fotos = {}, off = null }) {
  const contenido = [];
  if (fotos.tabla) {
    contenido.push({ type: 'text', text: 'Foto de la tabla nutricional:' });
    contenido.push({ type: 'image', source: { type: 'base64', media_type: fotos.tabla.tipo, data: fotos.tabla.base64 } });
  }
  if (fotos.ingredientes) {
    contenido.push({ type: 'text', text: 'Foto de la lista de ingredientes:' });
    contenido.push({
      type: 'image',
      source: { type: 'base64', media_type: fotos.ingredientes.tipo, data: fotos.ingredientes.base64 },
    });
  }
  if (fotos.frente) {
    contenido.push({ type: 'text', text: 'Foto del frente del envase (para el nombre y el contenido neto):' });
    contenido.push({ type: 'image', source: { type: 'base64', media_type: fotos.frente.tipo, data: fotos.frente.base64 } });
  }
  if (off) {
    contenido.push({
      type: 'text',
      text: `Datos de Open Food Facts para este producto (los nutrientes ya están cada 100 g; usalos tal cual, no los cambies):\n${JSON.stringify(off, null, 2)}`,
    });
  }
  const faltantes = [];
  if (!fotos.tabla && !off) faltantes.push('No hay foto de la tabla nutricional: nutrientes es null.');
  if (!fotos.ingredientes && !off) faltantes.push('No hay foto de ingredientes: ingredientes es null y alergenos vacío.');
  contenido.push({
    type: 'text',
    text: `Devolvé la ficha. Idioma del usuario para traducciones y tipoDetectado: ${NOMBRE_IDIOMA[idioma()] ?? 'español'}.${faltantes.length ? '\n' + faltantes.join('\n') : ''}`,
  });

  const { datos } = await pedirJSON({ sistema: SISTEMA_LECTURA, contenido, esquema: ESQUEMA_FICHA, esfuerzo: 'medium' });

  // Lo que no se pidió no puede venir de la IA: sin foto, el dato queda vacío.
  if (!fotos.tabla && !off) datos.nutrientes = null;
  if (!fotos.ingredientes && !off) {
    datos.ingredientes = null;
    datos.alergenos = [];
    datos.trazas = null;
  }
  return datos;
}

// Resumen del perfil para la IA: solo lo que sirve para escribir los textos.
function perfilParaTextos(perfil) {
  const p = perfil ?? {};
  return {
    objetivos: p.objetivos ?? [],
    objetivoExtra: p.objetivoExtra || null,
    prioridades: p.prioridades ?? [],
    dia: p.dia ?? null,
    actividades: p.actividades ?? [],
    actividadDias: p.actividadDias ?? null,
    actividadDuracion: p.actividadDuracion ?? null,
    actividadExtra: p.actividadExtra || null,
    alimentacion: p.alimentacion ?? 'todo',
    salud: p.salud ?? [],
    momentos: p.momentos ?? [],
    dificultades: p.dificultades ?? [],
    exigencia: p.exigencia ?? 'equilibrada',
  };
}

export async function escribirTextos(ficha, resultado, perfil) {
  const nivel = perfil?.nivel ?? 'basico';
  const etiquetas = [...resultado.deUnVistazo.map((c) => c.clave), ...resultado.sirvePara];
  const datos = {
    ficha: {
      nombre: ficha.nombre,
      tipo: ficha.tipoDetectado,
      categoria: ficha.categoria,
      esBebida: ficha.esBebida,
      nutrientesCada100: ficha.nutrientes,
      ingredientes: ficha.ingredientes?.map((i) => i.traduccion || i.texto) ?? null,
      azucarAgregadoEstimado: ficha.azucarAgregadoEstimado,
      contenidoEnvase: ficha.contenidoEnvase,
      porcionIndividual: ficha.porcionIndividual,
      porcionTipicaEstimada: ficha.porcionTipica,
    },
    decidido: {
      nota: resultado.nota,
      provisional: resultado.provisional,
      procesamiento: resultado.procesamiento,
      azucarAgregado: resultado.azucarAgregado,
      lineaDeObjetivo: resultado.linea,
      deUnVistazo: resultado.deUnVistazo,
      sirvePara: resultado.sirvePara,
      tipoSugerencia: tipoSugerencia(resultado.nota),
      porQueEsaNota: resultado.explicacion,
    },
    perfil: perfilParaTextos(perfil),
    etiquetasAExplicar: etiquetas,
  };
  const contenido = [{ type: 'text', text: `Escribí los textos para este análisis:\n${JSON.stringify(datos, null, 2)}` }];
  const { datos: textos } = await pedirJSON({
    sistema: sistemaTextos(idioma(), nivel),
    contenido,
    esquema: ESQUEMA_TEXTOS,
    esfuerzo: 'low',
  });

  // La pantalla espera las explicaciones de cada etiqueta como un diccionario.
  const porClave = {};
  for (const e of textos.etiquetas ?? []) porClave[e.clave] = { porQue: e.porQue, paraVos: e.paraVos };
  textos.etiquetas = porClave;
  return textos;
}

// Todo el recorrido. avisar(paso) informa el avance a la pantalla.
// id: si viene, el resultado reemplaza a uno ya guardado (al corregir datos).
// fichaElegida: la ficha ya leída, después de que la persona eligió el tipo de producto.
export async function analizarProducto({ fotos, off, codigo, fuente, id, fichaElegida = null }, avisar = () => {}) {
  let ficha = fichaElegida;
  if (!ficha) {
    avisar('leyendo');
    ficha = await leerEtiqueta({ fotos, off });
    if (!ficha.legible && !off) return { error: 'ilegible', detalle: ficha.problemaFoto };
    // Si no está segura del tipo (por ejemplo, arroz inflado o galleta de arroz), pregunta antes.
    if (ficha.tipoDudoso && ficha.alternativas?.length >= 2) return { pregunta: { ficha, alternativas: ficha.alternativas } };
  }

  avisar('calculando');
  const perfil = leerPerfil();
  const resultado = analizar(ficha, normalizarPerfil(perfil));
  if (resultado.nota === null && !ficha.ingredientes) return { error: 'sin_datos' };

  avisar('escribiendo');
  // Si el perfil tiene restricciones, el chequeo de "¿Me cae bien?" corre al mismo tiempo.
  const restricciones = restriccionesDelPerfil(perfil);
  const textoIngredientes = textoDeFicha(ficha);
  const [textos, chequeo] = await Promise.all([
    resultado.nota === null ? {} : escribirTextos(ficha, resultado, perfil),
    restricciones.length && textoIngredientes
      ? // Si el chequeo falla, el análisis sigue igual: se puede revisar después en "¿Me cae bien?".
        chequear({ texto: textoIngredientes, trazas: ficha.trazas }, restricciones).catch(() => null)
      : null,
  ]);

  // Foto chiquita para reconocer el producto: la del frente de Open Food Facts,
  // o una miniatura de la foto del frente que sacó la persona.
  let imagen = off?.imagen ?? null;
  if (fotos?.frente?.vistaPrevia) imagen = await miniatura(fotos.frente.vistaPrevia).catch(() => imagen);
  // Al corregir un producto sin foto nueva, se conserva la que ya tenía.
  if (!imagen && id) imagen = buscarEnHistorial(id)?.imagen ?? null;

  const entrada = {
    id: id ?? (codigo ? `codigo-${codigo}` : `foto-${Date.now()}`),
    codigo: codigo ?? null,
    fecha: new Date().toISOString(),
    fuente,
    imagen,
    ficha,
    resultado,
    textos: { [idioma()]: textos },
    chequeo,
  };
  agregarAlHistorial(entrada);
  return { entrada };
}

// Un dato educativo para el pie de una comparación. La decisión ya la tomó el código.
export async function datoComparacion(fichaA, fichaB, comparacion) {
  const perfil = leerPerfil();
  const producto = (f, r) => ({
    nombre: f.nombre,
    tipo: f.tipoDetectado,
    nutrientesCada100: f.nutrientes,
    nota: r.nota,
    lineaDeObjetivo: r.linea,
  });
  const datos = {
    a: producto(fichaA, comparacion.a),
    b: producto(fichaB, comparacion.b),
    decidido: { ganador: comparacion.ganador, empateTecnico: comparacion.empateTecnico, siBuscas: comparacion.siBuscas },
    objetivos: perfil?.objetivos ?? [],
  };
  const sistema = `${sistemaTextos(idioma(), perfil?.nivel ?? 'basico')}

En este pedido escribís solo un dato educativo corto para el pie de una comparación entre dos productos: algo que ayude a entender la diferencia entre ellos o a elegir mejor la próxima vez. Título en forma de pregunta y una o dos frases. No repitas la decisión ni la contradigas.`;
  const { datos: dato } = await pedirJSON({
    sistema,
    contenido: [{ type: 'text', text: JSON.stringify(datos, null, 2) }],
    esquema: {
      type: 'object',
      properties: { titulo: { type: 'string' }, texto: { type: 'string' } },
      required: ['titulo', 'texto'],
      additionalProperties: false,
    },
    esfuerzo: 'low',
    maxTokens: 4000,
  });
  return dato;
}

// Después de corregir el tipo de producto: vuelve a escribir los textos con la ficha nueva.
export async function reescribirTextos(entrada) {
  const perfil = leerPerfil();
  const resultado = analizar(entrada.ficha, normalizarPerfil(perfil));
  if (resultado.nota === null) return entrada.textos;
  const textos = await escribirTextos(entrada.ficha, resultado, perfil);
  return { ...entrada.textos, [idioma()]: textos };
}
