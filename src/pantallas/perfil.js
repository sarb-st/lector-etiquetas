// Resumen editable del perfil (pestaña "Perfil").

import { t } from '../i18n/index.js';
import { icono } from '../ui/iconos.js';
import { esc } from '../ui/comunes.js';
import { leerPerfil } from '../datos/almacen.js';
import { PASOS, bloqueVisible, completitud } from '../perfil/preguntas.js';
import { nombreOpcion } from './preguntas.js';

// La pregunta 5 tiene dos pantallas pero se muestra como una sola fila.
const FILAS = PASOS.filter((p) => p.id !== 'restricciones2').map((p) =>
  p.id === 'restricciones1' ? { ...p, partes: ['restricciones1', 'restricciones2'] } : { ...p, partes: [p.id] },
);

function respuestasDe(fila, perfil) {
  const partes = [];
  for (const pasoId of fila.partes) {
    const p = PASOS.find((x) => x.id === pasoId);
    for (const bloque of p.bloques) {
      if (!bloqueVisible(bloque, perfil)) continue;
      const valor = perfil[bloque.campo];
      if (bloque.tipo === 'texto') {
        if (valor?.trim()) partes.push(valor.trim());
      } else if (Array.isArray(valor)) {
        partes.push(...valor.map((v) => nombreOpcion(pasoId, v)));
      } else if (valor) {
        partes.push(nombreOpcion(pasoId, valor));
      }
    }
    if (p.extra && perfil[p.extra]?.trim()) partes.push(`“${perfil[p.extra].trim()}”`);
  }
  return partes;
}

function bloqueCompletitud(perfil) {
  const { respondidas, total, porcentaje } = completitud(perfil);
  const completo = respondidas === total;
  return `
    <section class="bloque-completitud ${completo ? 'completo' : ''}">
      <div class="fila">
        <span class="porcentaje">${porcentaje}%</span>
        <span class="texto">
          <strong>${esc(t(completo ? 'perfil.completo' : 'perfil.completar'))}</strong>
          <span>${esc(t('perfil.respondidas', { n: respondidas, total }))}</span>
        </span>
      </div>
      <div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${porcentaje}"
        aria-label="${esc(t('perfil.completitud'))}"><span style="width: ${porcentaje}%"></span></div>
      ${
        completo
          ? ''
          : `<a class="boton-principal tocable" href="#/preguntas/faltantes/1">${esc(t('perfil.completarBoton'))}</a>
             <p class="ayuda">${esc(t('perfil.completarSub'))}</p>`
      }
    </section>`;
}

export function pantallaPerfil() {
  const perfil = leerPerfil() ?? {};

  const filas = FILAS.map((fila) => {
    const respuestas = respuestasDe(fila, perfil);
    const titulo = t(`preguntas.${fila.id}.titulo`);
    return `
      <li>
        <a class="fila-perfil tocable" href="#/preguntas/editar/${fila.id}">
          <span class="numero" aria-hidden="true">${fila.numero}</span>
          <span class="texto">
            <span class="pregunta">${esc(titulo)}</span>
            <span class="respuesta ${respuestas.length ? '' : 'vacia'}">${esc(respuestas.length ? respuestas.join(' · ') : t('perfil.sinResponder'))}</span>
          </span>
          ${icono('derecha')}
        </a>
      </li>`;
  }).join('');

  return `
    <div class="pantalla">
      <header class="barra-superior">
        <h1 class="titulo-pantalla">${esc(t('perfil.titulo'))}</h1>
        <a class="boton-redondo tocable" href="#/ajustes" aria-label="${esc(t('ajustes.titulo'))}">${icono('ajustes')}</a>
      </header>
      <p class="bajada">${esc(t('perfil.bajada'))}</p>
      ${bloqueCompletitud(perfil)}
      <ul class="lista-perfil">${filas}</ul>
      <p class="nota-legal">${esc(t('perfil.privacidad'))}</p>
    </div>`;
}
