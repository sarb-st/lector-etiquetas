// "¿Me cae bien?": solo alérgenos e intolerancias, sin juicio nutricional.
// Direcciones: #/me-cae-bien (lo tuyo o algo puntual), #/me-cae-bien/puntual,
// #/me-cae-bien/escanear y #/me-cae-bien/resultado.

import { t } from '../i18n/index.js';
import { icono } from '../ui/iconos.js';
import { esc } from '../ui/comunes.js';
import { leerPerfil } from '../datos/almacen.js';
import { leerClave } from './ajustes.js';
import { nombreOpcion } from './preguntas.js';
import { iniciarLector, visorCamara, detenerCamara, empezarAnalisisDesde } from './analizar.js';
import { buscarEnOpenFoodFacts } from '../datos/open-food-facts.js';
import { prepararFoto } from '../datos/fotos.js';
import { chequear, restriccionesDelPerfil, INTOLERANCIAS, DIETAS, EVITA_RAPIDOS } from '../ia/chequeo.js';
import { ALERGENOS } from '../ia/instrucciones.js';

let estado = nuevoEstado();

function nuevoEstado() {
  return { modo: null, restricciones: [], codigo: null, off: null, foto: null, resultado: null, error: null, cargando: false, aviso: null };
}

// Nombre visible de una restricción ("alergia:gluten" → "Gluten").
export function nombreRestriccion(clave) {
  const [tipo, valor] = clave.split(/:(.*)/s);
  if (tipo === 'alergia') return nombreOpcion('restricciones1', valor);
  if (tipo === 'intolerancia') return nombreOpcion('restricciones2', valor);
  if (tipo === 'dieta') return nombreOpcion('restricciones1', valor);
  if (tipo === 'evita' && EVITA_RAPIDOS.includes(valor)) return nombreOpcion('restricciones2', valor);
  return valor;
}

function barra(volver = '#/') {
  return `
    <header class="barra-superior">
      <a class="boton-redondo tocable" href="${volver}" aria-label="${esc(t('resultado.volver'))}">${icono('atras')}</a>
      <span class="progreso-texto">${esc(t('inicio.meCaeBien'))}</span>
      <span class="espaciador" aria-hidden="true"></span>
    </header>`;
}

function sinClave() {
  return `
    <div class="pantalla">
      ${barra()}
      <div class="en-construccion">
        <h1>${esc(t('analizar.sinClaveTitulo'))}</h1>
        <p>${esc(t('analizar.sinClaveTexto'))}</p>
        <a class="boton-principal tocable centrado" href="#/ajustes">${esc(t('analizar.irAjustes'))}</a>
      </div>
    </div>`;
}

// ---------- ¿Lo tuyo o algo puntual? ----------

export function pantallaMeCaeBien() {
  if (!leerClave()) return sinClave();
  estado = nuevoEstado();
  const propias = restriccionesDelPerfil(leerPerfil());
  const resumen = propias.length
    ? propias.map(nombreRestriccion).join(' · ')
    : t('meCaeBien.sinRestricciones');
  return `
    <div class="pantalla">
      ${barra()}
      <div class="encabezado-pregunta">
        <h1>${esc(t('meCaeBien.pregunta'))}</h1>
        <p class="ayuda">${esc(t('meCaeBien.ayuda'))}</p>
      </div>
      <div class="opciones-tarjetas">
        <button type="button" class="opcion-tarjeta tocable" data-accion="mcb-mio" ${propias.length ? '' : 'disabled'}>
          <span class="marca-eleccion" aria-hidden="true">${icono('persona', 'sm')}</span>
          <span><strong>${esc(t('meCaeBien.loMio'))}</strong><span class="desc">${esc(resumen)}</span></span>
        </button>
        <a class="opcion-tarjeta tocable" href="#/me-cae-bien/puntual">
          <span class="marca-eleccion" aria-hidden="true">${icono('escudo', 'sm')}</span>
          <span><strong>${esc(t('meCaeBien.puntual'))}</strong><span class="desc">${esc(t('meCaeBien.puntualSub'))}</span></span>
        </a>
      </div>
      ${propias.length ? '' : `<a class="link-flecha tocable" href="#/preguntas/editar/restricciones1">${esc(t('meCaeBien.cargarRestricciones'))}${icono('derecha', 'sm')}</a>`}
    </div>`;
}

// ---------- Algo puntual ----------

function grupoPastillas(titulo, claves) {
  const botones = claves
    .map((clave) => {
      const elegida = estado.restricciones.includes(clave);
      return `<button type="button" class="opcion-pastilla tocable" data-accion="mcb-alternar" data-clave="${esc(clave)}" aria-pressed="${elegida}">
        ${elegida ? icono('tilde', 'sm') : ''}${esc(nombreRestriccion(clave))}</button>`;
    })
    .join('');
  return `<div class="bloque-pregunta"><h2 class="rotulo-bloque">${esc(titulo)}</h2><div class="opciones-pastillas" role="group">${botones}</div></div>`;
}

export function pantallaPuntual() {
  if (!leerClave()) return sinClave();
  if (estado.modo !== 'puntual') {
    estado = nuevoEstado();
    estado.modo = 'puntual';
  }
  return `
    <div class="pantalla preguntas">
      ${barra('#/me-cae-bien')}
      <div class="encabezado-pregunta">
        <h1>${esc(t('meCaeBien.puntualTitulo'))}</h1>
        <p class="ayuda">${esc(t('meCaeBien.puntualAyuda'))}</p>
      </div>
      ${grupoPastillas(t('preguntas.restricciones1.bloques.alergias'), ALERGENOS.map((a) => `alergia:${a}`))}
      ${grupoPastillas(t('preguntas.restricciones2.bloques.intolerancias'), INTOLERANCIAS.map((i) => `intolerancia:${i}`))}
      ${grupoPastillas(t('preguntas.restricciones1.bloques.alimentacion'), DIETAS.map((d) => `dieta:${d}`))}
      ${grupoPastillas(t('meCaeBien.otros'), EVITA_RAPIDOS.map((e) => `evita:${e}`))}
      <div class="barra-acciones">
        <a class="boton-principal tocable centrado ${estado.restricciones.length ? '' : 'deshabilitado'}"
          href="#/me-cae-bien/escanear" ${estado.restricciones.length ? '' : 'aria-disabled="true" tabindex="-1"'}>${esc(t('preguntas.siguiente'))}</a>
      </div>
    </div>`;
}

// ---------- Escanear o sacar foto ----------

export function pantallaEscanearMcb() {
  if (!leerClave()) return sinClave();
  if (!estado.modo) {
    location.hash = '#/me-cae-bien';
    return '<div class="pantalla"></div>';
  }
  const aviso = estado.aviso ? `<div class="aviso-parcial" role="status">${icono('info')}<p class="texto">${esc(t(`meCaeBien.aviso_${estado.aviso}`))}</p></div>` : '';
  return `
    <div class="pantalla escaner">
      ${barra(estado.modo === 'puntual' ? '#/me-cae-bien/puntual' : '#/me-cae-bien')}
      ${aviso}
      ${visorCamara(t('analizar.apunta'))}
      <form class="fila-clave" data-formulario="codigo-mcb">
        <label class="visualmente-oculto" for="campo-codigo">${esc(t('analizar.escribirCodigo'))}</label>
        <input id="campo-codigo" class="campo-texto" name="codigo" inputmode="numeric" pattern="[0-9]*"
          autocomplete="off" placeholder="${esc(t('analizar.escribirCodigo'))}" />
        <button type="submit" class="boton-principal chico tocable">${esc(t('analizar.buscar'))}</button>
      </form>
      <section class="tarjeta-foto">
        <p class="rotulo-paso">${icono('escanear', 'sm')}${esc(t('meCaeBien.fotoIngredientes'))}</p>
        <p class="ayuda-bloque">${esc(t('meCaeBien.fotoAyuda'))}</p>
        <div class="acciones-foto">
          <label class="boton-principal tocable" for="foto-mcb-camara">${esc(t('analizar.sacarFoto'))}</label>
          <label class="boton-pastilla grande tocable" for="foto-mcb-galeria">${esc(t('analizar.galeria'))}</label>
        </div>
        <input id="foto-mcb-camara" class="visualmente-oculto" type="file" accept="image/*" capture="environment" data-foto-mcb />
        <input id="foto-mcb-galeria" class="visualmente-oculto" type="file" accept="image/*" data-foto-mcb />
      </section>
    </div>`;
}

export function montarEscanerMcb(raiz) {
  return iniciarLector(raiz, usarCodigo);
}

async function usarCodigo(codigo) {
  const limpio = String(codigo).replace(/\D/g, '');
  if (limpio.length < 6) return;
  estado.codigo = limpio;
  estado.cargando = true;
  estado.resultado = null;
  estado.error = null;
  irAResultado();
  const encontrado = await buscarEnOpenFoodFacts(limpio);
  if (!encontrado?.datos.ingredientes?.trim()) {
    estado.cargando = false;
    estado.aviso = encontrado ? 'sinIngredientes' : 'noEncontrado';
    location.hash = '#/me-cae-bien/escanear';
    return;
  }
  estado.off = encontrado.completo ? encontrado.datos : null;
  await correr({ texto: encontrado.datos.ingredientes, trazas: encontrado.datos.trazas });
}

export async function recibirFotoMcb(entrada) {
  const archivo = entrada.files?.[0];
  if (!archivo) return;
  try {
    estado.foto = await prepararFoto(archivo);
  } catch {
    alert(t('analizar.fotoInvalida'));
    return;
  }
  detenerCamara();
  estado.cargando = true;
  estado.resultado = null;
  estado.error = null;
  irAResultado();
  await correr({ foto: estado.foto });
}

async function correr(entrada) {
  try {
    estado.resultado = await chequear(entrada, estado.restricciones);
  } catch (error) {
    estado.error = error.tipo ?? 'otro';
  }
  estado.cargando = false;
  irAResultado();
}

function irAResultado() {
  if (location.hash === '#/me-cae-bien/resultado') window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = '#/me-cae-bien/resultado';
}

// ---------- Resultado ----------

const ICONO_ESTADO = { no_apto: 'cruz', revisar: 'alerta', apto: 'tilde' };

// Lista de restricciones con su estado (la usa también el resultado del análisis).
export function htmlRestricciones(r) {
  return r.restricciones
    .map(
      (x) => `
      <li class="fila-restriccion">
        <span class="circulo estado-${x.estado}" aria-hidden="true">${icono(ICONO_ESTADO[x.estado], 'sm')}</span>
        <div>
          <p class="titulo"><strong>${esc(nombreRestriccion(x.clave))}</strong><span class="etiqueta-estado estado-${x.estado}">${esc(t(`meCaeBien.estado_${x.estado}`))}</span></p>
          ${x.ingredientes.length ? `<p class="ingredientes">${x.ingredientes.map((i) => `<span class="ingrediente estado-${x.estado}">${esc(i.texto)}</span> ${esc(i.traduccion)}`).join(' · ')}</p>` : ''}
          ${x.explicacion ? `<p class="explicacion">${esc(x.explicacion)}</p>` : ''}
        </div>
      </li>`,
    )
    .join('');
}

export function pantallaResultadoMcb() {
  if (estado.cargando) {
    return `
      <div class="pantalla procesando">
        <div class="cargador" aria-hidden="true"><span></span><span></span><span></span></div>
        <h1>${esc(t('meCaeBien.revisando'))}</h1>
      </div>`;
  }
  if (estado.error) {
    return `
      <div class="pantalla">
        ${barra('#/me-cae-bien/escanear')}
        <div class="en-construccion">
          <h1>${esc(t('analizar.errorTitulo'))}</h1>
          <p>${esc(t(`analizar.error_${estado.error}`))}</p>
          <a class="boton-principal tocable centrado" href="#/me-cae-bien/escanear">${esc(t('analizar.reintentar'))}</a>
        </div>
      </div>`;
  }
  const r = estado.resultado;
  if (!r) {
    location.hash = '#/me-cae-bien';
    return '<div class="pantalla"></div>';
  }
  const noAptas = r.restricciones.filter((x) => x.estado === 'no_apto').map((x) => nombreRestriccion(x.clave));
  const subtitulo =
    r.general === 'no_apto'
      ? t('meCaeBien.contiene', { lista: noAptas.join(', ') })
      : t(`meCaeBien.sub_${r.general}`);

  const filas = htmlRestricciones(r);

  return `
    <div class="pantalla">
      ${barra('#/me-cae-bien/escanear')}
      <div class="producto-cabecera">
        <span class="producto-foto" aria-hidden="true">${esc(r.nombre?.trim()?.[0] ?? '?')}</span>
        <div>
          <h1>${esc(r.nombre || t('meCaeBien.producto'))}</h1>
          <p class="meta">${esc(t(estado.modo === 'puntual' ? 'meCaeBien.revisadoPuntual' : 'meCaeBien.revisadoPerfil'))} · <a href="#/me-cae-bien">${esc(t('resultado.cambiar'))}</a></p>
        </div>
      </div>
      <section class="veredicto estado-${r.general}" role="status">
        ${icono(r.general === 'no_apto' ? 'prohibido' : ICONO_ESTADO[r.general], 'lg')}
        <div><h2>${esc(t(`meCaeBien.veredicto_${r.general}`))}</h2><p>${esc(subtitulo)}</p></div>
      </section>
      <ul class="tarjeta lista-restricciones">${filas}</ul>
      ${
        r.trazas
          ? `<div class="caja-punteada">${icono('alerta')}<div><strong>${esc(t('meCaeBien.trazas'))}</strong><p class="trazas-original">"${esc(r.trazas)}"</p>${r.trazasTraduccion ? `<p>${esc(r.trazasTraduccion)}</p>` : ''}<p class="ayuda-bloque">${esc(t('meCaeBien.trazasNota'))}</p></div></div>`
          : ''
      }
      <p class="nota-legal">${esc(t('meCaeBien.avisoFijo'))}</p>
      <button type="button" class="boton-secundario tocable" data-accion="mcb-nutricional">${esc(t('meCaeBien.verNutricional'))}</button>
    </div>`;
}

// ---------- Acciones ----------

export function accionMeCaeBien(boton, redibujar) {
  const accion = boton.dataset.accion;
  if (accion === 'mcb-mio') {
    estado = nuevoEstado();
    estado.modo = 'mio';
    estado.restricciones = restriccionesDelPerfil(leerPerfil());
    location.hash = '#/me-cae-bien/escanear';
    return true;
  }
  if (accion === 'mcb-alternar') {
    const clave = boton.dataset.clave;
    estado.restricciones = estado.restricciones.includes(clave)
      ? estado.restricciones.filter((c) => c !== clave)
      : [...estado.restricciones, clave];
    redibujar();
    return true;
  }
  if (accion === 'mcb-nutricional') {
    empezarAnalisisDesde({ codigo: estado.codigo, off: estado.off, fotoIngredientes: estado.foto });
    return true;
  }
  return false;
}

export function enviarCodigoMcb(formulario) {
  if (formulario.dataset.formulario !== 'codigo-mcb') return false;
  detenerCamara();
  usarCodigo(formulario.codigo.value);
  return true;
}
