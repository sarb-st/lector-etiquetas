// Punto de entrada de la fórmula: con la ficha del producto y el perfil,
// calcula todo lo que decide el código (nunca la IA).
// La forma de la ficha está explicada en derivados.js; la del perfil, en objetivo.js.

import { calcularCalidad } from './calidad.js';
import { calcularLineaObjetivo, normalizarPerfil } from './objetivo.js';
import { calcularSirvePara, calcularDeUnVistazo } from './etiquetas.js';
import { derivar } from './derivados.js';

export function analizar(ficha, perfilCrudo) {
  const perfil = normalizarPerfil(perfilCrudo);
  const d = derivar(ficha);
  const calidad = calcularCalidad(ficha, perfil.exigencia);
  const objetivo = calcularLineaObjetivo(ficha, perfil, calidad.nota);

  return {
    nota: calidad.nota,
    provisional: calidad.provisional,
    procesamiento: d.procesamiento, // null = sin datos
    azucarAgregado: d.azucarAgregado, // { hay, casiTodo }, null = no se puede saber
    linea: objetivo.linea,
    sirvePara: calidad.nota === null ? [] : calcularSirvePara(ficha),
    deUnVistazo: d.tieneTabla ? calcularDeUnVistazo(ficha, perfil) : [],
    // Para que la IA explique el porqué sin decidir nada:
    explicacion: {
      puntos: calidad.detalle,
      puntosAntesDeTechos: calidad.puntosAntesDeTechos,
      techos: calidad.techos,
      techoAplicado: calidad.techoAplicado,
      votos: objetivo.votos,
      balance: objetivo.balance,
      excepcion: objetivo.excepcion,
      sinPuntajeMotivo: calidad.sinPuntajeMotivo,
    },
  };
}

export { calcularCalidad, calcularLineaObjetivo, calcularSirvePara, calcularDeUnVistazo, normalizarPerfil };
