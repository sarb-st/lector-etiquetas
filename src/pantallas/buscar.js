// Buscar un alimento sin código de barras (fruta, verdura, carne, pan, queso, fiambre al corte)
// en el BLS incluido en la app. Direcciones:
//   #/buscar                 desde el inicio o desde "Analizar"
//   #/buscar/comparar/<a|b>  para poner el alimento en una casilla de "Comparar"

import { t, numero } from '../i18n/index.js';
import { icono } from '../ui/iconos.js';
import { esc } from '../ui/comunes.js';
import { cargarBLS, blsCargado, buscarEn, buscarPorCodigo, fichaDesdeBLS } from '../datos/bls.js';
import { ilustracionDe, svgIlustracion } from '../ui/ilustraciones.js';
import { analizarAlimentoBLS } from './analizar.js';

let textoBuscado = '';

function filas(resultados) {
  if (!textoBuscado.trim()) return `<p class="ayuda-bloque">${esc(t('buscar.ayuda'))}</p>`;
  if (!resultados.length) return `<p class="ayuda-bloque">${esc(t('buscar.nada', { texto: textoBuscado.trim() }))}</p>`;
  return `<ul class="lista-bls">${resultados
    .map(
      (a) => `
      <li><button type="button" class="fila-bls tocable" data-accion="elegir-bls" data-codigo="${esc(a.c)}">
        <span class="foto-mini ilustrada" aria-hidden="true">${svgIlustracion(ilustracionDe(a.c, a.de, a.cat))}</span>
        <span class="texto">
          <span class="nombre">${esc(a.es)}</span>
          <span class="detalle">${esc(t(`categorias.${a.cat}`))} · ${esc(numero(a.n[0], 0))} kcal</span>
        </span>
        ${icono('derecha')}
      </button></li>`,
    )
    .join('')}</ul>`;
}

// Cada vez que se entra, la búsqueda empieza vacía.
export function pantallaBuscar(lugar = null) {
  textoBuscado = '';
  const lista = blsCargado();
  // Atrás: desde Comparar vuelve a Comparar; si no, al inicio.
  const volver = lugar ? '#/comparar' : '#/';
  return `
    <div class="pantalla pantalla-buscar" data-lugar="${esc(lugar ?? '')}">
      <header class="barra-superior">
        <a class="boton-redondo tocable" href="${volver}" aria-label="${esc(t('resultado.volver'))}">${icono('atras')}</a>
        <span class="espaciador" aria-hidden="true"></span>
      </header>
      <h1 class="titulo-pantalla">${esc(t('buscar.titulo'))}</h1>
      <p class="ayuda-bloque">${esc(t('buscar.bajada'))}</p>
      <label class="campo-busqueda">
        ${icono('lupa')}
        <span class="visualmente-oculto">${esc(t('buscar.campo'))}</span>
        <input type="search" class="campo-texto" data-buscar-bls value="${esc(textoBuscado)}"
          placeholder="${esc(t('buscar.ejemplo'))}" autocomplete="off" enterkeyhint="search" />
        <button type="button" class="borrar-busqueda tocable" data-accion="borrar-busqueda" aria-label="${esc(t('buscar.borrar'))}" hidden>${icono('cruz', 'sm')}</button>
      </label>
      <div class="resultados-bls" aria-live="polite">
        ${lista ? filas(buscarEn(lista, textoBuscado)) : `<p class="ayuda-bloque">${esc(t('buscar.cargando'))}</p>`}
      </div>
      <p class="fuente-bls">${esc(t('buscar.fuente'))}</p>
    </div>`;
}

// Carga la base la primera vez y pone el foco en el campo.
export async function montarBuscar(raiz) {
  if (!blsCargado()) {
    await cargarBLS();
    const caja = raiz.querySelector('.resultados-bls');
    if (caja) caja.innerHTML = filas(buscarEn(blsCargado(), textoBuscado));
  }
  raiz.querySelector('[data-buscar-bls]')?.focus();
}

// Mientras se escribe: solo cambia la lista, el campo no se toca.
export function entradaBuscar(campo) {
  if (!campo.matches('[data-buscar-bls]')) return false;
  textoBuscado = campo.value;
  const borrar = document.querySelector('.borrar-busqueda');
  if (borrar) borrar.hidden = !textoBuscado;
  const lista = blsCargado();
  const caja = document.querySelector('.resultados-bls');
  if (lista && caja) caja.innerHTML = filas(buscarEn(lista, textoBuscado));
  return true;
}

export function accionBuscar(boton) {
  if (boton.dataset.accion === 'borrar-busqueda') {
    const campo = document.querySelector('[data-buscar-bls]');
    campo.value = '';
    entradaBuscar(campo);
    campo.focus();
    return true;
  }
  if (boton.dataset.accion !== 'elegir-bls') return false;
  const alimento = buscarPorCodigo(blsCargado() ?? [], boton.dataset.codigo);
  if (!alimento) return true;
  const lugar = document.querySelector('.pantalla-buscar')?.dataset.lugar || null;
  analizarAlimentoBLS(fichaDesdeBLS(alimento), alimento.c, lugar);
  return true;
}
