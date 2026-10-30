// Comparar dos productos. Direcciones:
//   #/comparar                  las dos casillas (A y B) y, si están las dos, el resultado
//   #/comparar/<a|b>/<id>       pone un producto del historial en una casilla
//   #/comparar/elegir/<a|b>     elegir un producto de los ya analizados

import { t, numero, idioma } from '../i18n/index.js';
import { leerClave } from './ajustes.js';
import { datoComparacion } from '../ia/analisis.js';
import { icono } from '../ui/iconos.js';
import { esc, claseBanda, iconoLinea, resultadoActual, fotoProducto, filaProducto } from '../ui/comunes.js';
import { leerPerfil, leerHistorial, buscarEnHistorial } from '../datos/almacen.js';
import { comparar } from '../puntaje/comparar.js';

const casillas = { a: null, b: null };
// Datos educativos ya pedidos, para no volver a pagar por el mismo par de productos.
const datos = new Map();

// Después de dibujar la comparación, pide el dato educativo si falta.
export async function montarComparar(raiz) {
  const caja = raiz.querySelector('[data-dato]');
  if (!caja || datos.has(caja.dataset.dato)) return;
  const clave = caja.dataset.dato;
  datos.set(clave, null);
  const a = buscarEnHistorial(casillas.a);
  const b = buscarEnHistorial(casillas.b);
  try {
    const c = comparar(a.ficha, b.ficha, leerPerfil());
    const dato = await datoComparacion(a.ficha, b.ficha, c);
    datos.set(clave, dato);
    const actual = document.querySelector(`[data-dato="${CSS.escape(clave)}"]`);
    if (actual) {
      actual.innerHTML = `<p class="rotulo">${icono('lamparita', 'sm')}${esc(t('resultado.dato').toUpperCase())}</p><h3>${esc(dato.titulo)}</h3><p>${esc(dato.texto)}</p>`;
    }
  } catch {
    // Sin dato no pasa nada: la comparación ya está completa.
    datos.delete(clave);
    document.querySelector(`[data-dato="${CSS.escape(clave)}"]`)?.remove();
  }
}

// Pone el producto en la casilla y deja la dirección en "#/comparar" (sin sumar un paso al "atrás").
export function ponerEnCasilla(lugar, id) {
  if (buscarEnHistorial(id)) casillas[lugar] = id;
  history.replaceState(null, '', '#/comparar');
  return pantallaComparar();
}

function barra(volver = '#/') {
  return `
    <header class="barra-superior">
      <a class="boton-redondo tocable" href="${volver}" aria-label="${esc(t('resultado.volver'))}">${icono('atras')}</a>
      <span class="progreso-texto">${esc(t('comparar.titulo'))}</span>
      <span class="espaciador" aria-hidden="true"></span>
    </header>`;
}

function casilla(lugar) {
  const entrada = casillas[lugar] ? buscarEnHistorial(casillas[lugar]) : null;
  const letra = lugar.toUpperCase();
  if (!entrada) {
    return `
      <section class="casilla vacia">
        <span class="letra" aria-hidden="true">${letra}</span>
        <p class="rotulo-bloque">${esc(t('comparar.producto', { letra }))}</p>
        <a class="boton-principal tocable centrado" href="#/analizar/comparar/${lugar}">${icono('escanear', 'sm')}${esc(t('comparar.escanear'))}</a>
        ${leerHistorial().length ? `<a class="boton-pastilla grande tocable centrado" href="#/comparar/elegir/${lugar}">${esc(t('comparar.elegir'))}</a>` : ''}
      </section>`;
  }
  const r = resultadoActual(entrada);
  return `
    <section class="casilla">
      <span class="letra" aria-hidden="true">${letra}</span>
      <span class="fila-foto-nota">
        ${fotoProducto(entrada, 'foto-mini')}
        <span class="nota-mini ${claseBanda(r.nota, r.provisional)}">${esc(r.nota ?? '–')}</span>
      </span>
      <a class="nombre" href="#/resultado/${encodeURIComponent(entrada.id)}"
        aria-label="${esc(t('comparar.verAnalisis', { nombre: entrada.ficha.nombre }))}">${esc(entrada.ficha.nombre)}</a>
      ${r.linea ? `<span class="detalle linea-${r.linea}">${icono(iconoLinea[r.linea], 'sm')}${esc(t(`lineas.${r.linea}`))}</span>` : ''}
      <a class="link-flecha tocable" href="#/comparar/elegir/${lugar}">${esc(t('resultado.cambiar'))}</a>
    </section>`;
}

function motivo(c, nombres) {
  const g = c.ganador;
  if (c.motivo.tipo === 'sin_nota') return t('comparar.motivo_sin_nota');
  if (c.motivo.tipo === 'empate') return t('comparar.motivo_empate');
  const otro = g === 'a' ? 'b' : 'a';
  const rg = c[g];
  const ro = c[otro];
  if (c.motivo.tipo === 'linea') {
    return t('comparar.motivo_linea', { linea: t(`lineas.${rg.linea}`), otro: nombres[otro], lineaOtro: t(`lineas.${ro.linea}`).toLowerCase() });
  }
  if (c.motivo.tipo === 'aspecto') return t('comparar.motivo_aspecto', { aspecto: t(`comparar.aspecto_${c.motivo.aspecto}`) });
  return c.empateTecnico
    ? t('comparar.motivo_nota_empate', { x: rg.nota, y: ro.nota })
    : t('comparar.motivo_nota', { x: rg.nota, y: ro.nota });
}

function resultadoComparacion(entradaA, entradaB) {
  const c = comparar(entradaA.ficha, entradaB.ficha, leerPerfil());
  const nombres = { a: entradaA.ficha.nombre, b: entradaB.ficha.nombre };
  const ganador = c.ganador === 'a' || c.ganador === 'b' ? c.ganador : null;

  const bloque = ganador
    ? `<section class="bloque-ganador">
        <p class="etiqueta-chica">${esc(t(c.empateTecnico ? 'comparar.empateTecnico' : 'comparar.paraVos'))}</p>
        <h2><span class="letra">${ganador.toUpperCase()}</span>${esc(nombres[ganador])}</h2>
        <p>${esc(motivo(c, nombres))}</p>
      </section>`
    : `<section class="bloque-ganador empate">
        <p class="etiqueta-chica">${esc(t('comparar.empateTecnico'))}</p>
        <p>${esc(motivo(c, nombres))}</p>
      </section>`;

  const avisos = c.avisos
    .map((a) => `<div class="aviso-parcial" role="status">${icono('info')}<p class="texto">${esc(t(`comparar.aviso_${a}`))}</p></div>`)
    .join('');

  const lineas = c.siBuscas
    .map((x) => {
      const n = (entrada) => entrada.ficha.nutrientes ?? {};
      const valor = (entrada) => {
        const datos = n(entrada);
        const campo = { masProteina: 'proteina', menosCalorias: 'kcal', menosGrasa: 'grasa', menosAzucar: 'azucares', masFibra: 'fibra', menosSal: 'sal' }[x.criterio];
        if (!campo) return '';
        return `${numero(datos[campo], campo === 'sal' ? 2 : 1)} ${campo === 'kcal' ? 'kcal' : 'g'}`;
      };
      const va = valor(entradaA);
      const vb = valor(entradaB);
      return `
        <li>
          <span>${esc(t(`comparar.si_${x.criterio}`))}</span>
          <strong><span class="letra chica">${x.ganador.toUpperCase()}</span>${va ? `<span class="valores">${esc(`A ${va} · B ${vb}`)}</span>` : ''}</strong>
        </li>`;
    })
    .join('');

  const claveDato = `${entradaA.id}|${entradaB.id}|${idioma()}`;
  const dato = datos.get(claveDato);
  const cajaDato =
    dato === undefined && !leerClave()
      ? ''
      : `<div class="caja-dato" data-dato="${esc(claveDato)}" aria-live="polite">
          <p class="rotulo">${icono('lamparita', 'sm')}${esc(t('resultado.dato').toUpperCase())}</p>
          ${dato ? `<h3>${esc(dato.titulo)}</h3><p>${esc(dato.texto)}</p>` : `<p>${esc(t('comparar.buscandoDato'))}</p>`}
        </div>`;

  return `
    ${bloque}
    ${avisos}
    ${cajaDato}
    ${
      lineas
        ? `<h2 class="titulo-seccion"><span>${esc(t('comparar.siBuscas'))}</span><span>${esc(t('resultado.por100g'))}</span></h2><ul class="tarjeta lista-si-buscas">${lineas}</ul>`
        : `<p class="ayuda-bloque">${esc(t('comparar.sinDiferencias'))}</p>`
    }`;
}

export function pantallaComparar() {
  const a = casillas.a ? buscarEnHistorial(casillas.a) : null;
  const b = casillas.b ? buscarEnHistorial(casillas.b) : null;
  return `
    <div class="pantalla">
      ${barra()}
      <div class="casillas">${casilla('a')}${casilla('b')}</div>
      ${a && b ? resultadoComparacion(a, b) : `<p class="ayuda-bloque">${esc(t('comparar.ayuda'))}</p>`}
    </div>`;
}

export function pantallaElegir(lugar) {
  const otro = casillas[lugar === 'a' ? 'b' : 'a'];
  const filas = leerHistorial()
    .filter((e) => e.id !== otro)
    .map((e) => `<li>${filaProducto(e, `#/comparar/${lugar}/${encodeURIComponent(e.id)}`)}</li>`)
    .join('');
  return `
    <div class="pantalla">
      ${barra('#/comparar')}
      <h1 class="titulo-pantalla">${esc(t('comparar.elegirTitulo', { letra: lugar.toUpperCase() }))}</h1>
      <ul class="lista-productos">${filas}</ul>
    </div>`;
}
