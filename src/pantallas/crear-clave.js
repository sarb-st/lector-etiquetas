// Guía paso a paso para crear la clave de la API de Claude (unos 10 minutos, una sola vez).

import { t, texto } from '../i18n/index.js';
import { icono } from '../ui/iconos.js';
import { esc } from '../ui/comunes.js';

const CONSOLA = 'https://platform.claude.com';

export function pantallaCrearClave() {
  const pasos = (texto('crearClave.pasos') ?? [])
    .map(
      (paso, i) => `
      <li class="paso-guia">
        <span class="numero" aria-hidden="true">${i + 1}</span>
        <div>
          <h2>${esc(paso.titulo)}</h2>
          <p>${esc(paso.texto)}</p>
          ${paso.consejo ? `<p class="consejo">${icono('lamparita', 'sm')}<span>${esc(paso.consejo)}</span></p>` : ''}
        </div>
      </li>`,
    )
    .join('');
  return `
    <div class="pantalla">
      <header class="barra-superior">
        <a class="boton-redondo tocable" href="#/ajustes" aria-label="${esc(t('resultado.volver'))}">${icono('atras')}</a>
        <span class="progreso-texto">${esc(t('crearClave.titulo'))}</span>
        <span class="espaciador" aria-hidden="true"></span>
      </header>
      <div class="encabezado-pregunta">
        <h1>${esc(t('crearClave.titular'))}</h1>
        <p class="ayuda">${esc(t('crearClave.bajada'))}</p>
      </div>
      <a class="boton-principal tocable centrado" href="${CONSOLA}" target="_blank" rel="noopener">${esc(t('crearClave.abrirConsola'))}</a>
      <ol class="pasos-guia">${pasos}</ol>
      <div class="caja-sugerencia">
        <strong>${esc(t('crearClave.seguridadTitulo'))}</strong>
        <p>${esc(t('crearClave.seguridad'))}</p>
      </div>
      <a class="boton-principal tocable centrado" href="#/ajustes">${esc(t('crearClave.listo'))}</a>
    </div>`;
}
