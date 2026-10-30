// Analizar un producto: código de barras primero; si no está, fotos de la tabla y los ingredientes.
// Direcciones: #/analizar (cámara), #/analizar/fotos, #/analizar/procesando.

import { t } from '../i18n/index.js';
import { icono } from '../ui/iconos.js';
import { logoAnimado } from '../ui/logo.js';
import { esc } from '../ui/comunes.js';
import { leerPerfil, buscarEnHistorial } from '../datos/almacen.js';
import { leerClave } from './ajustes.js';
import { grupoRespondido } from '../perfil/preguntas.js';
import { buscarEnOpenFoodFacts } from '../datos/open-food-facts.js';
import { prepararFoto } from '../datos/fotos.js';
import { analizarProducto } from '../ia/analisis.js';

const URL_ZXING = 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.2.1/+esm';

// Estado del análisis en curso (se pierde al salir de la app, a propósito).
let estado = nuevoEstado();
let controlesCamara = null;
// Si el análisis se pidió desde "Comparar", a dónde volver con el resultado.
let paraComparar = null;

function nuevoEstado() {
  return {
    codigo: null,
    off: null,
    fotos: {},
    aviso: null,
    paso: null,
    error: null,
    reemplazarId: null,
    pregunta: null,
    fichaElegida: null,
  };
}

// "Los datos no coinciden con el envase": se vuelve a analizar con fotos y se
// reemplaza el resultado guardado.
export function empezarReescaneo(entrada) {
  estado = nuevoEstado();
  paraComparar = null;
  estado.codigo = entrada.codigo ?? null;
  estado.reemplazarId = entrada.id;
  estado.aviso = 'reescaneo';
  location.hash = '#/analizar/fotos';
}

function barra(volver = '#/') {
  return `
    <header class="barra-superior">
      <a class="boton-redondo tocable" href="${volver}" aria-label="${esc(t('resultado.volver'))}">${icono('cruz')}</a>
      <span class="progreso-texto">${esc(t('analizar.titulo'))}</span>
      <span class="espaciador" aria-hidden="true"></span>
    </header>`;
}

// ---------- Antes de empezar ----------

// Devuelve el HTML de un aviso, o una dirección a la que hay que ir, o null si se puede seguir.
function requisitos() {
  if (!leerClave()) {
    return {
      html: `
        <div class="pantalla">
          ${barra()}
          <div class="en-construccion">
            <h1>${esc(t('analizar.sinClaveTitulo'))}</h1>
            <p>${esc(t('analizar.sinClaveTexto'))}</p>
            <a class="boton-principal tocable centrado" href="#/ajustes">${esc(t('analizar.irAjustes'))}</a>
          </div>
        </div>`,
    };
  }
  if (!grupoRespondido(leerPerfil(), 'puntaje')) return { ir: '#/preguntas/puntaje/1' };
  return null;
}

// ---------- Cámara y código de barras ----------

// lugar: 'a' o 'b' cuando se escanea un producto para comparar.
export function pantallaEscanear(lugar = null) {
  paraComparar = lugar;
  const r = requisitos();
  if (r?.ir) {
    location.hash = r.ir;
    return '<div class="pantalla"></div>';
  }
  if (r?.html) return r.html;
  estado = nuevoEstado();
  return `
    <div class="pantalla escaner">
      ${barra()}
      ${visorCamara(t('analizar.apunta'))}
      <form class="fila-clave" data-formulario="codigo">
        <label class="visualmente-oculto" for="campo-codigo">${esc(t('analizar.escribirCodigo'))}</label>
        <input id="campo-codigo" class="campo-texto" name="codigo" inputmode="numeric" pattern="[0-9]*"
          autocomplete="off" placeholder="${esc(t('analizar.escribirCodigo'))}" />
        <button type="submit" class="boton-principal chico tocable">${esc(t('analizar.buscar'))}</button>
      </form>
      <a class="boton-secundario tocable" href="#/analizar/fotos">${icono('escanear', 'sm')}${esc(t('analizar.sinCodigo'))}</a>
    </div>`;
}

// Prende la cámara en el <video> de la pantalla y avisa cuando lee un código.
// La usan "Analizar" y "¿Me cae bien?".
export async function iniciarLector(raiz, alDetectar) {
  const video = raiz.querySelector('#video-escaner');
  if (!video) return;
  const mensaje = raiz.querySelector('.estado-camara');
  try {
    // Lector solo de códigos de barras de productos (EAN, UPC): es más rápido que buscar
    // todos los formatos, sobre todo en el iPhone.
    const { BrowserMultiFormatOneDReader } = await import(URL_ZXING);
    if (!raiz.contains(video)) return;
    const lector = new BrowserMultiFormatOneDReader(undefined, { delayBetweenScanAttempts: 100 });
    const restricciones = {
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    };
    controlesCamara = await lector.decodeFromConstraints(restricciones, video, (resultado) => {
      if (!resultado) return;
      detenerCamara();
      navigator.vibrate?.(60);
      alDetectar(resultado.getText());
    });
    // Si en unos segundos no lee nada, un consejo.
    setTimeout(() => {
      if (controlesCamara && raiz.contains(mensaje)) mensaje.textContent = t('analizar.consejoCamara');
    }, 6000);
  } catch {
    mensaje.textContent = t('analizar.camaraNoDisponible');
    mensaje.classList.add('error');
  }
}

// El visor de la cámara, igual en las dos pantallas.
export function visorCamara(textoAyuda) {
  return `
    <div class="visor">
      <video id="video-escaner" playsinline muted autoplay aria-label="${esc(t('analizar.camara'))}"></video>
      <div class="marco" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
      <p class="estado-camara" role="status" aria-live="polite">${esc(textoAyuda)}</p>
    </div>`;
}

export function montarEscaner(raiz) {
  return iniciarLector(raiz, usarCodigo);
}

export function detenerCamara() {
  controlesCamara?.stop();
  controlesCamara = null;
}

async function usarCodigo(codigo) {
  const limpio = String(codigo).replace(/\D/g, '');
  if (limpio.length < 6) return;
  estado.codigo = limpio;

  // 1. Ya analizado en este teléfono: resultado al instante.
  if (buscarEnHistorial(`codigo-${limpio}`)) {
    irAlResultado(`codigo-${limpio}`);
    return;
  }
  // 2. Open Food Facts.
  estado.paso = 'buscando';
  location.hash = '#/analizar/procesando';
  const encontrado = await buscarEnOpenFoodFacts(limpio);
  if (encontrado?.completo) {
    estado.off = encontrado.datos;
    await correrAnalisis();
    return;
  }
  // 3. No está o le faltan datos: antes de pedir las fotos, un paso que lo explica
  //    (sin saltar de golpe del escaneo a la cámara de fotos).
  estado.aviso = encontrado ? 'incompleto' : 'noEncontrado';
  estado.paso = 'sinDatos';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

// ---------- Fotos ----------

function tarjetaFoto(clave, numero, opcional = false) {
  const foto = estado.fotos[clave];
  const titulo = t(`analizar.foto_${clave}`) + (opcional ? ` · ${t('preguntas.opcional')}` : '');
  const ayuda = t(`analizar.foto_${clave}_ayuda`);
  const entradas = `
    <input id="foto-${clave}-camara" class="visualmente-oculto" type="file" accept="image/*" capture="environment" data-foto="${clave}" />
    <input id="foto-${clave}-galeria" class="visualmente-oculto" type="file" accept="image/*" data-foto="${clave}" />`;

  if (foto) {
    return `
      <section class="tarjeta-foto lista">
        <img src="${foto.vistaPrevia}" alt="${esc(titulo)}" />
        <div class="texto">
          <p class="rotulo-paso">${icono('tilde', 'sm')}${numero}. ${esc(titulo)}</p>
          <label class="link-flecha tocable" for="foto-${clave}-camara">${esc(t('analizar.repetir'))}</label>
        </div>
        ${entradas}
      </section>`;
  }
  return `
    <section class="tarjeta-foto">
      <p class="rotulo-paso"><span class="numero">${numero}</span>${esc(titulo)}</p>
      <p class="ayuda-bloque">${esc(ayuda)}</p>
      <div class="acciones-foto">
        <label class="boton-principal tocable" for="foto-${clave}-camara">${icono('escanear', 'sm')}${esc(t('analizar.sacarFoto'))}</label>
        <label class="boton-pastilla grande tocable" for="foto-${clave}-galeria">${esc(t('analizar.galeria'))}</label>
      </div>
      ${entradas}
    </section>`;
}

export function pantallaFotos() {
  const r = requisitos();
  if (r?.ir) {
    location.hash = r.ir;
    return '<div class="pantalla"></div>';
  }
  if (r?.html) return r.html;
  // El frente es opcional: solo cuentan la tabla y los ingredientes.
  const cantidad = ['tabla', 'ingredientes'].filter((k) => estado.fotos[k]).length;
  // "No está en la base" ya se explicó en el paso anterior: acá no se repite.
  const yaExplicado = ['noEncontrado', 'incompleto'].includes(estado.aviso);
  const aviso =
    estado.aviso && !yaExplicado
      ? `<div class="aviso-parcial" role="status">${icono('info')}<p class="texto">${esc(t(`analizar.aviso_${estado.aviso}`))}</p></div>`
      : '';
  return `
    <div class="pantalla fotos">
      ${barra('#/analizar')}
      ${aviso}
      <div class="encabezado-pregunta">
        <h1>${esc(t('analizar.fotosTitulo'))}</h1>
        <p class="ayuda">${esc(t('analizar.fotosAyuda'))}</p>
      </div>
      ${tarjetaFoto('tabla', 1)}
      ${tarjetaFoto('ingredientes', 2)}
      ${tarjetaFoto('frente', 3, true)}
      ${cantidad === 1 ? `<p class="ayuda-bloque">${esc(t('analizar.unaFoto'))}</p>` : ''}
      <div class="barra-acciones">
        <button type="button" class="boton-principal tocable" data-accion="analizar-fotos" ${cantidad === 0 ? 'disabled' : ''}>
          ${esc(t('analizar.analizar'))}
        </button>
      </div>
    </div>`;
}

export async function recibirFoto(entrada, redibujar) {
  const archivo = entrada.files?.[0];
  if (!archivo) return;
  try {
    estado.fotos[entrada.dataset.foto] = await prepararFoto(archivo);
  } catch {
    alert(t('analizar.fotoInvalida'));
  }
  redibujar();
}

// ---------- Procesando ----------

const PASOS = ['buscando', 'leyendo', 'calculando', 'escribiendo'];

export function pantallaProcesando() {
  // El código se leyó, pero el producto no está completo en la base: se explica y se ofrece seguir con fotos.
  if (estado.paso === 'sinDatos') {
    return `
      <div class="pantalla procesando paso-sin-datos">
        <div class="logo-en-app">${logoAnimado('logo-quieto')}</div>
        <p class="codigo-leido">${icono('tilde', 'sm')}${esc(t('analizar.codigoLeido', { codigo: estado.codigo ?? '' }))}</p>
        <h1>${esc(t(`analizar.sinDatosTitulo_${estado.aviso}`))}</h1>
        <p class="ayuda-bloque">${esc(t('analizar.sinDatosTexto'))}</p>
        <a class="boton-principal tocable centrado" href="#/analizar/fotos">${icono('escanear', 'sm')}${esc(t('analizar.sacarLasFotos'))}</a>
        <a class="boton-pastilla grande tocable centrado" href="#/">${esc(t('analizar.cancelar'))}</a>
      </div>`;
  }
  // Claude no está segura del tipo de producto: pregunta antes de analizar.
  if (estado.pregunta) {
    const opciones = estado.pregunta.alternativas
      .map(
        (tipo) => `
        <button type="button" class="opcion-tarjeta tocable" data-accion="elegir-tipo" data-tipo="${esc(tipo)}">
          <span class="marca-eleccion" aria-hidden="true"></span><span><strong>${esc(tipo)}</strong></span>
        </button>`,
      )
      .join('');
    return `
      <div class="pantalla">
        ${barra()}
        <div class="encabezado-pregunta">
          <h1>${esc(t('analizar.tipoDudosoTitulo'))}</h1>
          <p class="ayuda">${esc(t('analizar.tipoDudosoAyuda'))}</p>
        </div>
        <div class="opciones-tarjetas">${opciones}</div>
      </div>`;
  }
  if (estado.error) {
    const conAjustes = ['sin_clave', 'clave_invalida', 'clave_rechazada', 'sin_saldo'].includes(estado.error.tipo);
    return `
      <div class="pantalla">
        ${barra()}
        <div class="en-construccion">
          <h1>${esc(t('analizar.errorTitulo'))}</h1>
          <p>${esc(t(`analizar.error_${estado.error.tipo}`))}</p>
          ${estado.error.detalle ? `<p class="detalle-tecnico">${esc(t('analizar.detalleTecnico'))}: ${esc(estado.error.detalle)}</p>` : ''}
          ${
            conAjustes
              ? `<a class="boton-principal tocable centrado" href="#/ajustes">${esc(t('analizar.irAjustes'))}</a>`
              : `<button type="button" class="boton-principal tocable" data-accion="reintentar-analisis">${esc(t('analizar.reintentar'))}</button>`
          }
          <a class="boton-pastilla grande tocable centrado" href="#/analizar/fotos">${esc(t('analizar.otrasFotos'))}</a>
        </div>
      </div>`;
  }
  return `
    <div class="pantalla procesando">
      <div class="logo-en-app">${logoAnimado('logo-carga')}</div>
      <h1>${esc(t('analizar.procesandoTitulo'))}</h1>
      <ol class="pasos-analisis" aria-live="polite">${listaPasos()}</ol>
      <p class="ayuda-bloque">${esc(t('analizar.procesandoAyuda'))}</p>
    </div>`;
}

function listaPasos() {
  const actual = PASOS.indexOf(estado.paso);
  return PASOS.filter((p) => p !== 'buscando' || estado.codigo)
    .map((p) => {
      const i = PASOS.indexOf(p);
      const clase = i < actual ? 'hecho' : i === actual ? 'actual' : '';
      return `<li class="${clase}">${i < actual ? icono('tilde', 'sm') : '<span class="punto" aria-hidden="true"></span>'}${esc(t(`analizar.paso_${p}`))}</li>`;
    })
    .join('');
}

async function correrAnalisis() {
  estado.error = null;
  const redibujar = () => {
    if (location.hash === '#/analizar/procesando') window.dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = '#/analizar/procesando';
  };
  // Al avanzar de paso, si ya se ve la pantalla de espera, se cambia solo la lista:
  // así la animación del logo sigue su ciclo sin volver a empezar.
  const avanzar = () => {
    const lista = document.querySelector('.procesando .pasos-analisis');
    if (lista && location.hash === '#/analizar/procesando') lista.innerHTML = listaPasos();
    else redibujar();
  };
  try {
    const fuente = estado.off ? 'open_food_facts' : 'fotos';
    const pedido = {
      fotos: estado.fotos,
      off: estado.off,
      codigo: estado.codigo,
      fuente,
      id: estado.reemplazarId,
      fichaElegida: estado.fichaElegida,
    };
    const r = await analizarProducto(pedido, (paso) => {
      estado.paso = paso;
      avanzar();
    });
    if (r.pregunta) {
      estado.pregunta = r.pregunta;
      redibujar();
      return;
    }
    if (r.error) {
      estado.error = { tipo: r.error, detalle: r.detalle };
      redibujar();
      return;
    }
    estado = nuevoEstado();
    irAlResultado(r.entrada.id);
  } catch (error) {
    estado.error = { tipo: error.tipo ?? 'otro', detalle: error.detalle || error.message || '' };
    redibujar();
  }
}

function irAlResultado(id) {
  if (paraComparar) {
    const lugar = paraComparar;
    paraComparar = null;
    location.hash = `#/comparar/${lugar}/${encodeURIComponent(id)}`;
    return;
  }
  location.hash = `#/resultado/${encodeURIComponent(id)}`;
}

// Desde "¿Me cae bien?": seguir con el análisis nutricional del mismo producto.
export function empezarAnalisisDesde({ codigo = null, off = null, fotoIngredientes = null }) {
  estado = nuevoEstado();
  paraComparar = null;
  estado.codigo = codigo;
  if (off) {
    estado.off = off;
    estado.paso = 'leyendo';
    location.hash = '#/analizar/procesando';
    correrAnalisis();
    return;
  }
  if (fotoIngredientes) estado.fotos.ingredientes = fotoIngredientes;
  estado.aviso = 'faltaTabla';
  location.hash = '#/analizar/fotos';
}

// ---------- Acciones ----------

export function accionAnalizar(boton) {
  const accion = boton.dataset.accion;
  if (accion === 'analizar-fotos') {
    estado.off = null;
    correrAnalisis();
    return true;
  }
  if (accion === 'reintentar-analisis') {
    correrAnalisis();
    return true;
  }
  if (accion === 'elegir-tipo' && estado.pregunta) {
    estado.fichaElegida = { ...estado.pregunta.ficha, tipoDetectado: boton.dataset.tipo, tipoDudoso: false };
    estado.pregunta = null;
    correrAnalisis();
    return true;
  }
  return false;
}

export function enviarCodigo(formulario) {
  if (formulario.dataset.formulario !== 'codigo') return false;
  detenerCamara();
  usarCodigo(formulario.codigo.value);
  return true;
}
