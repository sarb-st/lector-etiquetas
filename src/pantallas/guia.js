// Guía educativa. Direcciones:
//   #/guia                    la guía del nivel del perfil (pregunta 9)
//   #/guia/<nivel>            la guía de otro nivel
//   #/guia/<nivel>/<número>   un capítulo
// El contenido se carga la primera vez que se abre; mientras tanto se muestra "Cargando".

import { t, idioma } from '../i18n/index.js';
import { icono } from '../ui/iconos.js';
import { esc } from '../ui/comunes.js';
import { NIVELES_GUIA, nivelDelUsuario, cargarGuias, guiasCargadas, markdownAHtml } from '../guia/guia.js';

function cargando() {
  return `<div class="pantalla"><p class="ayuda-bloque guia-cargando">${esc(t('guia.cargando'))}</p></div>`;
}

// Si el contenido no estaba cargado, lo carga y vuelve a dibujar la pantalla.
export async function montarGuia() {
  if (guiasCargadas()) return;
  await cargarGuias();
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

const avisoIdioma = () =>
  idioma() === 'es' ? '' : `<div class="aviso-parcial" role="status">${icono('info')}<p class="texto">${esc(t('guia.soloEspanol'))}</p></div>`;

export function pantallaGuia(nivelPedido) {
  const guias = guiasCargadas();
  if (!guias) return cargando();
  const tuNivel = nivelDelUsuario();
  const nivel = NIVELES_GUIA.includes(nivelPedido) ? nivelPedido : tuNivel;
  const guia = guias[nivel];

  const selector = NIVELES_GUIA.map(
    (n) => `
      <a class="nivel-guia tocable" href="#/guia/${n}" ${n === nivel ? 'aria-current="page"' : ''}>
        <span>${esc(guias[n].titulo)}</span>
        ${n === tuNivel ? `<small>${esc(t('guia.tuNivel'))}</small>` : ''}
      </a>`,
  ).join('');

  const capitulos = guia.capitulos
    .map(
      (c) => `
      <li><a class="fila-capitulo tocable" href="#/guia/${nivel}/${c.n}">
        <span class="numero-capitulo" aria-hidden="true">${c.n}</span>
        <span class="titulo-capitulo">${esc(c.titulo)}</span>
        ${icono('derecha')}
      </a></li>`,
    )
    .join('');

  return `
    <div class="pantalla pantalla-guia">
      <h1 class="titulo-pantalla">${esc(t('inicio.guia'))}</h1>
      <p class="ayuda-bloque">${esc(t('guia.bajada'))}</p>
      ${avisoIdioma()}
      <nav class="selector-niveles" aria-label="${esc(t('guia.niveles'))}">${selector}</nav>
      <ol class="lista-capitulos">${capitulos}</ol>
    </div>`;
}

export function pantallaCapitulo(nivel, numero) {
  const guias = guiasCargadas();
  if (!guias) return cargando();
  if (!NIVELES_GUIA.includes(nivel)) return null;
  const lista = guias[nivel].capitulos;
  const i = lista.findIndex((c) => c.n === Number(numero));
  // Si el capítulo no existe en este nivel (por ejemplo, el 12 fuera de Experto), al índice del nivel.
  if (i < 0) {
    history.replaceState(null, '', `#/guia/${nivel}`);
    return pantallaGuia(nivel);
  }
  const c = lista[i];
  const anterior = lista[i - 1];
  const siguiente = lista[i + 1];
  const enlace = (x, clase, etiqueta) =>
    x
      ? `<a class="paso-capitulo ${clase} tocable" href="#/guia/${nivel}/${x.n}">
          <small>${esc(etiqueta)}</small><span>${esc(`${x.n}. ${x.titulo}`)}</span>
        </a>`
      : '<span></span>';

  return `
    <div class="pantalla pantalla-capitulo">
      <header class="barra-superior">
        <a class="boton-redondo tocable" href="#/guia/${nivel}" aria-label="${esc(t('guia.indice'))}">${icono('atras')}</a>
        <span class="progreso-texto">${esc(guias[nivel].titulo)}</span>
        <span class="espaciador" aria-hidden="true"></span>
      </header>
      ${avisoIdioma()}
      <article class="capitulo">
        <p class="rotulo-capitulo">${esc(t('guia.capitulo', { n: c.n }))}</p>
        <h1>${esc(c.titulo)}</h1>
        ${markdownAHtml(c.md)}
      </article>
      <nav class="pasos-capitulo">
        ${enlace(anterior, 'anterior', t('guia.anterior'))}
        ${enlace(siguiente, 'siguiente', t('guia.siguiente'))}
      </nav>
    </div>`;
}
