// Mis productos: lo que dio "Suma a tu objetivo", ordenado por categoría.

import { t } from '../i18n/index.js';
import { icono } from '../ui/iconos.js';
import { esc, resultadoActual, filaProducto } from '../ui/comunes.js';
import { leer, guardar, leerHistorial } from '../datos/almacen.js';
import { CATEGORIAS } from '../puntaje/reglas.js';

function quitados() {
  return new Set(leer('quitadosDeMisProductos') ?? []);
}

export function quitarDeMisProductos(id) {
  const lista = quitados();
  lista.add(id);
  guardar('quitadosDeMisProductos', [...lista]);
}

export function pantallaMisProductos() {
  const fuera = quitados();
  const productos = leerHistorial()
    .filter((e) => !fuera.has(e.id))
    .map((e) => ({ entrada: e, resultado: resultadoActual(e) }))
    .filter(({ resultado }) => resultado.linea === 'suma');

  const porCategoria = new Map();
  for (const p of productos) {
    const categoria = p.entrada.ficha.categoria ?? 'otros';
    if (!porCategoria.has(categoria)) porCategoria.set(categoria, []);
    porCategoria.get(categoria).push(p);
  }
  const ordenadas = [...porCategoria.keys()].sort((a, b) => CATEGORIAS.indexOf(a) - CATEGORIAS.indexOf(b));

  const contenido =
    productos.length === 0
      ? `<div class="vacio"><p>${esc(t('misProductos.vacio'))}</p><a class="boton-pastilla tocable" href="#/analizar">${esc(t('inicio.analizar'))}</a></div>`
      : ordenadas
          .map(
            (categoria) => `
          <h2 class="titulo-seccion"><span>${esc(t(`categorias.${categoria}`))}</span></h2>
          <ul class="lista-productos">
            ${porCategoria
              .get(categoria)
              .map(
                ({ entrada }) => `
              <li class="fila-con-accion">
                ${filaProducto(entrada, `#/resultado/${encodeURIComponent(entrada.id)}`)}
                <button type="button" class="boton-redondo chico tocable" data-accion="quitar-producto" data-id="${esc(entrada.id)}"
                  aria-label="${esc(t('misProductos.quitar', { nombre: entrada.ficha.nombre }))}">${icono('cruz', 'sm')}</button>
              </li>`,
              )
              .join('')}
          </ul>`,
          )
          .join('');

  return `
    <div class="pantalla">
      <header class="barra-superior"><h1 class="titulo-pantalla">${esc(t('tabs.misProductos'))}</h1></header>
      <p class="bajada">${esc(t('misProductos.bajada'))}</p>
      ${contenido}
    </div>`;
}
