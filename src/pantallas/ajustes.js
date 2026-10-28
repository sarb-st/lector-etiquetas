// Ajustes: clave de la API, modelo, gasto del mes, idioma y Open Food Facts.

import { t, idioma, cambiarIdioma, numero } from '../i18n/index.js';
import { icono } from '../ui/iconos.js';
import { esc } from '../ui/comunes.js';
import { leer, guardar } from '../datos/almacen.js';

export const MODELOS = {
  preciso: { id: 'claude-sonnet-5-5', costoAnalisisCentimos: 3 },
  economico: { id: 'claude-haiku-5-5', costoAnalisisCentimos: 0.2 },
};

const AJUSTES_INICIALES = { modelo: 'preciso', compartirOFF: true };

export function leerAjustes() {
  return { ...AJUSTES_INICIALES, ...(leer('ajustes') ?? {}) };
}

function guardarAjustes(cambios) {
  guardar('ajustes', { ...leerAjustes(), ...cambios });
}

export function leerClave() {
  return leer('claveApi');
}

// Gasto del mes en dólares, sumado con lo que informa la API en cada uso.
export function gastoDelMes() {
  const gasto = leer('gasto');
  const mes = new Date().toISOString().slice(0, 7);
  return gasto?.mes === mes ? gasto.usd : 0;
}

function seccionClave() {
  const clave = leerClave();
  const final = clave ? clave.slice(-4) : '';
  return `
    <section class="tarjeta ajuste">
      <h2 class="rotulo-bloque">${esc(t('ajustes.clave'))}</h2>
      <p class="ayuda-bloque">${esc(t('ajustes.claveAyuda'))}</p>
      ${
        clave
          ? `<p class="estado-clave">${icono('tilde', 'sm')}${esc(t('ajustes.claveGuardada', { final }))}</p>`
          : ''
      }
      <form class="fila-clave" data-formulario="clave">
        <label class="visualmente-oculto" for="campo-clave">${esc(t('ajustes.clave'))}</label>
        <input id="campo-clave" class="campo-texto" type="password" name="clave" autocomplete="off"
          autocapitalize="off" autocorrect="off" spellcheck="false"
          placeholder="${esc(clave ? t('ajustes.claveReemplazar') : 'sk-ant-…')}" />
        <button type="submit" class="boton-principal chico tocable">${esc(t('ajustes.guardar'))}</button>
      </form>
      <p class="mensaje-formulario" role="status" aria-live="polite"></p>
      ${clave ? `<button type="button" class="boton-pastilla grande tocable" data-accion="probar-clave">${esc(t('ajustes.probar'))}</button>` : ''}
      <p class="resultado-prueba" role="status" aria-live="polite"></p>
      <a class="link-flecha tocable" href="#/crear-clave">${esc(t('ajustes.comoCrear'))}${icono('derecha', 'sm')}</a>
    </section>`;
}

function seccionModelo(ajustes) {
  const opcion = (clave) => {
    const elegido = ajustes.modelo === clave;
    return `
      <button type="button" class="opcion-tarjeta tocable" data-accion="elegir-modelo" data-modelo="${clave}" aria-pressed="${elegido}">
        <span class="marca-eleccion" aria-hidden="true">${elegido ? icono('tilde', 'sm') : ''}</span>
        <span>
          <strong>${esc(t(`ajustes.modelo_${clave}`))}</strong>
          <span class="desc">${esc(t(`ajustes.modelo_${clave}_desc`, { c: numero(MODELOS[clave].costoAnalisisCentimos) }))}</span>
        </span>
      </button>`;
  };
  return `
    <section class="tarjeta ajuste">
      <h2 class="rotulo-bloque">${esc(t('ajustes.modelo'))}</h2>
      <div class="opciones-tarjetas">${opcion('preciso')}${opcion('economico')}</div>
    </section>`;
}

function seccionGasto() {
  return `
    <section class="tarjeta ajuste gasto">
      <h2 class="rotulo-bloque">${esc(t('ajustes.gasto'))}</h2>
      <p class="numero-gasto">~${esc(numero(gastoDelMes(), 2))} <span>USD</span></p>
      <p class="ayuda-bloque">${esc(t('ajustes.gastoAyuda'))}</p>
    </section>`;
}

function seccionIdioma() {
  const boton = (codigo, nombre) =>
    `<button type="button" class="segmento tocable" data-accion="elegir-idioma" data-idioma="${codigo}" aria-pressed="${idioma() === codigo}">${nombre}</button>`;
  return `
    <section class="tarjeta ajuste">
      <h2 class="rotulo-bloque">${esc(t('ajustes.idioma'))}</h2>
      <div class="segmentado" role="group">${boton('es', 'Español')}${boton('en', 'English')}</div>
    </section>`;
}

function seccionOpenFoodFacts(ajustes) {
  return `
    <section class="tarjeta ajuste">
      <div class="fila-interruptor">
        <span>
          <h2 class="rotulo-bloque">${esc(t('ajustes.off'))}</h2>
          <p class="ayuda-bloque">${esc(t('ajustes.offAyuda'))}</p>
        </span>
        <button type="button" class="interruptor tocable" role="switch" aria-checked="${ajustes.compartirOFF}"
          data-accion="alternar-off" aria-label="${esc(t('ajustes.off'))}"><span></span></button>
      </div>
    </section>`;
}

export function pantallaAjustes() {
  const ajustes = leerAjustes();
  return `
    <div class="pantalla">
      <header class="barra-superior">
        <a class="boton-redondo tocable" href="#/perfil" aria-label="${esc(t('resultado.volver'))}">${icono('atras')}</a>
        <h1 class="titulo-pantalla">${esc(t('ajustes.titulo'))}</h1>
        <span class="espaciador" aria-hidden="true"></span>
      </header>
      ${seccionClave()}
      ${seccionModelo(ajustes)}
      ${seccionGasto()}
      ${seccionIdioma()}
      ${seccionOpenFoodFacts(ajustes)}
      <p class="nota-legal">${esc(t('ajustes.legal'))}</p>
    </div>`;
}

// Devuelve true si la acción era de esta pantalla.
// Prueba la clave con un pedido mínimo y gratis, y muestra el resultado (o el error real).
async function probar(boton) {
  const salida = document.querySelector('.resultado-prueba');
  salida.className = 'resultado-prueba';
  salida.textContent = t('ajustes.probando');
  boton.disabled = true;
  try {
    const { probarClave } = await import('../ia/cliente.js');
    await probarClave();
    salida.textContent = t('ajustes.pruebaOk');
    salida.classList.add('ok');
  } catch (error) {
    salida.textContent = `${t(`analizar.error_${error.tipo ?? 'otro'}`)} ${error.detalle ? `(${t('analizar.detalleTecnico')}: ${error.detalle})` : ''}`;
    salida.classList.add('error');
  }
  boton.disabled = false;
}

export function accionAjustes(boton, redibujar) {
  const accion = boton.dataset.accion;
  if (accion === 'probar-clave') {
    probar(boton);
    return true;
  }
  if (accion === 'elegir-modelo') {
    guardarAjustes({ modelo: boton.dataset.modelo });
  } else if (accion === 'elegir-idioma') {
    cambiarIdioma(boton.dataset.idioma);
  } else if (accion === 'alternar-off') {
    guardarAjustes({ compartirOFF: !leerAjustes().compartirOFF });
  } else {
    return false;
  }
  redibujar();
  return true;
}

export function enviarFormularioAjustes(formulario, redibujar) {
  if (formulario.dataset.formulario !== 'clave') return false;
  // Se sacan espacios y caracteres invisibles que a veces vienen al pegar.
  const valor = String(formulario.clave.value).replace(/[\s ​-‍⁠﻿]/g, '');
  const mensaje = formulario.parentElement.querySelector('.mensaje-formulario');
  if (!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(valor)) {
    mensaje.textContent = t('ajustes.claveInvalida');
    mensaje.classList.add('error');
    formulario.clave.focus();
    return true;
  }
  guardar('claveApi', valor);
  redibujar();
  return true;
}
