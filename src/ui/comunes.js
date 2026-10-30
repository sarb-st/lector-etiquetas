// Piezas que comparten varias pantallas.

import { t } from '../i18n/index.js';
import { analizar } from '../puntaje/index.js';
import { leerPerfil } from '../datos/almacen.js';
import { icono } from './iconos.js';

// La nota se recalcula al mostrarla, con el perfil y las reglas actuales.
// Mismos datos, mismo resultado: es instantáneo y no gasta nada.
export function resultadoActual(entrada) {
  return analizar(entrada.ficha, leerPerfil());
}

// Escapa texto para meterlo en HTML sin riesgo.
export function esc(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Foto chiquita del producto. Debajo queda la inicial del nombre: si no hay foto,
// o si la foto no carga (sin internet), se ve la inicial.
export function fotoProducto(entrada, clase = 'producto-foto') {
  const inicial = entrada?.ficha?.nombre?.trim()?.[0] ?? '?';
  const imagen = entrada?.imagen
    ? `<img src="${esc(entrada.imagen)}" alt="" decoding="async" referrerpolicy="no-referrer" />`
    : '';
  return `<span class="${clase}" aria-hidden="true"><span class="inicial">${esc(inicial)}</span>${imagen}</span>`;
}

// Fila de producto para las listas (inicio, Mis productos, Comparar):
// foto, nombre, línea de objetivo y la nota a la derecha.
export function filaProducto(entrada, href) {
  const r = resultadoActual(entrada);
  const nota = r.nota ?? '–';
  return `
    <a class="fila-producto tocable" href="${href}">
      ${fotoProducto(entrada, 'foto-mini')}
      <span class="texto">
        <span class="nombre">${esc(entrada.ficha.nombre)}</span>
        ${r.linea ? `<span class="detalle linea-${r.linea}">${icono(iconoLinea[r.linea], 'sm')}${esc(t(`lineas.${r.linea}`))}</span>` : ''}
      </span>
      <span class="nota-mini ${claseBanda(r.nota, r.provisional)}"
        aria-label="${esc(`${t('resultado.calidad')} ${nota} ${t('resultado.deDiez')}`)}">${esc(nota)}</span>
    </a>`;
}

// Color de la nota: 1 a 4 rojo, 5 y 6 ámbar, 7 a 10 verde.
export function claseBanda(nota, provisional = false) {
  if (provisional) return 'banda-provisional';
  if (nota <= 4) return 'banda-bajo';
  if (nota <= 6) return 'banda-medio';
  return 'banda-alto';
}

export function nombreBanda(nota) {
  if (nota <= 2) return t('bandas.evitar');
  if (nota <= 4) return t('bandas.ocasional');
  if (nota <= 6) return t('bandas.aceptable');
  if (nota <= 8) return t('bandas.muyBuena');
  return t('bandas.excelente');
}

export const iconoLinea = { suma: 'pulgarArriba', moderacion: 'mano', resta: 'pulgarAbajo' };

export const iconoSirvePara = {
  musculo: 'pesa',
  saciedad: 'cubiertos',
  corazon: 'corazon',
  energia_sostenida: 'bateria',
  energia_rapida: 'rayo',
};

// Los textos de la IA vienen por idioma; si falta el del usuario, se usa español.
export function textosEnIdioma(textos, idioma) {
  if (!textos) return {};
  return textos[idioma] ?? textos.es ?? {};
}
