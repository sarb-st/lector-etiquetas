// Preguntas del perfil, una pantalla por paso.
// Direcciones:
//   #/preguntas/<grupo>/<n>        grupo: inicio, puntaje, consejos o todo
//   #/preguntas/editar/<paso>      una sola pregunta, desde el perfil
// Cada paso se guarda al tocar "Siguiente", así no se pierde nada si se sale a mitad.

import { t, texto } from '../i18n/index.js';
import { icono } from '../ui/iconos.js';
import { esc } from '../ui/comunes.js';
import { leerPerfil, guardarPerfil } from '../datos/almacen.js';
import { PASOS, GRUPOS, paso as buscarPaso, bloqueVisible, pasosFaltantes } from '../perfil/preguntas.js';

const VALORES_INICIALES = { alimentacion: 'todo', exigencia: 'equilibrada' };

let sesion = null;

function iniciarSesion(grupo, pasos) {
  const clave = `${grupo}:${pasos.join(',')}`;
  if (sesion?.clave === clave) return;
  sesion = { clave, grupo, pasos, borrador: { ...VALORES_INICIALES, ...(leerPerfil() ?? {}) }, avisoMaximo: null };
}

function destinoFinal(grupo) {
  if (grupo === 'inicio') return '#/';
  // Las preguntas del puntaje aparecen antes del primer escaneo: al terminar, se escanea.
  if (grupo === 'puntaje') return '#/analizar';
  return '#/perfil';
}

function rutaPaso(indice) {
  if (sesion.grupo === 'editar') return `#/preguntas/editar/${sesion.pasos[0]}`;
  return `#/preguntas/${sesion.grupo}/${indice + 1}`;
}

// Nombre visible de una opción (algunas tienen título y descripción).
export function nombreOpcion(pasoId, opcion) {
  const valor = texto(`preguntas.${pasoId}.opciones.${opcion}`);
  if (!valor) return opcion;
  return typeof valor === 'string' ? valor : valor.titulo;
}

function hayRespuestaEn(pasoActual) {
  return pasoActual.bloques.some((b) => {
    if (b.tipo === 'unica') return false;
    const v = sesion.borrador[b.campo];
    return Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());
  });
}

function dibujarOpciones(pasoActual, bloque) {
  const elegidas = sesion.borrador[bloque.campo];
  const lista = Array.isArray(elegidas) ? elegidas : elegidas ? [elegidas] : [];
  const conTarjeta = bloque.conDescripcion;

  const botones = bloque.opciones
    .map((opcion) => {
      const elegida = lista.includes(opcion);
      const valor = texto(`preguntas.${pasoActual.id}.opciones.${opcion}`);
      const titulo = typeof valor === 'string' ? valor : valor?.titulo ?? opcion;
      const descripcion = typeof valor === 'object' ? valor?.texto : null;
      const esPrincipal = bloque.ordenado && lista[0] === opcion && lista.length > 1;
      const atributos = `type="button" data-accion="opcion" data-campo="${esc(bloque.campo)}" data-opcion="${esc(opcion)}" aria-pressed="${elegida}"`;

      if (conTarjeta) {
        return `
          <button ${atributos} class="opcion-tarjeta tocable ${bloque.casillas ? 'con-casilla' : ''}">
            <span class="marca-eleccion" aria-hidden="true">${elegida ? icono('tilde', 'sm') : ''}</span>
            <span><strong>${esc(titulo)}</strong>${descripcion ? `<span class="desc">${esc(descripcion)}</span>` : ''}</span>
          </button>`;
      }
      return `
        <button ${atributos} class="opcion-pastilla tocable">
          ${elegida ? icono('tilde', 'sm') : ''}${esc(titulo)}${esPrincipal ? `<span class="insignia">${esc(t('preguntas.principal'))}</span>` : ''}
        </button>`;
    })
    .join('');

  return `<div class="${conTarjeta ? 'opciones-tarjetas' : 'opciones-pastillas'}" role="group">${botones}</div>`;
}

function dibujarBloque(pasoActual, bloque) {
  const rotulo = texto(`preguntas.${pasoActual.id}.bloques.${bloque.campo}`);
  const ayuda = texto(`preguntas.${pasoActual.id}.ayudas.${bloque.campo}`);
  const cabecera = `
    ${rotulo ? `<h2 class="rotulo-bloque">${esc(rotulo)}</h2>` : ''}
    ${ayuda ? `<p class="ayuda-bloque">${esc(ayuda)}</p>` : ''}`;

  if (bloque.tipo === 'texto') {
    const ejemplo = texto(`preguntas.${pasoActual.id}.ejemplos.${bloque.campo}`) ?? '';
    return `
      <div class="bloque-pregunta">
        ${cabecera}
        <input class="campo-texto" type="text" data-campo="${esc(bloque.campo)}"
          value="${esc(sesion.borrador[bloque.campo] ?? '')}" placeholder="${esc(ejemplo)}"
          aria-label="${esc(rotulo || ejemplo)}" autocomplete="off" />
      </div>`;
  }
  const aviso =
    sesion.avisoMaximo === bloque.campo
      ? `<p class="aviso-maximo" role="status">${esc(t('preguntas.maximo', { n: bloque.max }))}</p>`
      : '';
  return `<div class="bloque-pregunta">${cabecera}${dibujarOpciones(pasoActual, bloque)}${aviso}</div>`;
}

function dibujarPaso(indice) {
  const pasoActual = buscarPaso(sesion.pasos[indice]);
  const ultimo = indice === sesion.pasos.length - 1;
  const base = `preguntas.${pasoActual.id}`;
  // El contador sigue el orden en que aparecen las pantallas de este recorrido
  // (1 de 4, 2 de 4…), no el número de la pregunta en la definición.
  const total = sesion.pasos.length;
  const mostrarProgreso = total > 1;
  const segmentos = Array.from({ length: total }, (_, i) => `<span class="${i <= indice ? 'lleno' : ''}"></span>`).join('');

  let textoBoton = ultimo ? t('preguntas.listo') : t('preguntas.siguiente');
  if (pasoActual.botonSinRespuesta && !hayRespuestaEn(pasoActual)) textoBoton = t(`preguntas.${pasoActual.botonSinRespuesta}`);

  const bloques = pasoActual.bloques
    .filter((b) => bloqueVisible(b, sesion.borrador))
    .map((b) => dibujarBloque(pasoActual, b))
    .join('');

  const ejemploExtra = texto(`${base}.ejemplo`);
  const extra = pasoActual.extra
    ? `
      <div class="bloque-pregunta">
        <label class="rotulo-bloque" for="campo-extra">${esc(t('preguntas.algoMas'))} <span class="opcional">${esc(t('preguntas.opcional'))}</span></label>
        <input id="campo-extra" class="campo-texto" type="text" data-campo="${esc(pasoActual.extra)}"
          value="${esc(sesion.borrador[pasoActual.extra] ?? '')}" placeholder="${esc(ejemploExtra ?? '')}" autocomplete="off" />
      </div>`
    : '';

  const indicacion = texto(`${base}.indicacion`);

  return `
    <div class="pantalla preguntas" data-indice="${indice}">
      <header class="barra-superior">
        <button type="button" class="boton-redondo tocable" data-accion="preguntas-cerrar" aria-label="${esc(t('preguntas.cerrar'))}">${icono('cruz')}</button>
        <span class="progreso-texto">${mostrarProgreso ? esc(t('preguntas.progreso', { n: indice + 1, total })) : ''}</span>
        <span class="espaciador" aria-hidden="true"></span>
      </header>
      ${mostrarProgreso ? `<div class="progreso" style="grid-template-columns: repeat(${total}, 1fr)" aria-hidden="true">${segmentos}</div>` : ''}

      <div class="encabezado-pregunta">
        <h1>${esc(t(`${base}.titulo`))}</h1>
        <p class="ayuda">${esc(t(`${base}.ayuda`))}</p>
        ${indicacion ? `<p class="indicacion">${esc(indicacion)}</p>` : ''}
      </div>

      ${bloques}
      ${extra}

      <div class="barra-acciones">
        ${indice > 0 ? `<button type="button" class="boton-pastilla grande tocable" data-accion="preguntas-atras">${esc(t('preguntas.atras'))}</button>` : ''}
        <button type="button" class="boton-principal tocable" data-accion="preguntas-siguiente">${esc(textoBoton)}</button>
      </div>
    </div>`;
}

// ---------- Entradas desde el enrutador ----------

export function pantallaPreguntas(grupo, numero) {
  if (grupo === 'faltantes') {
    // La lista de faltantes se arma una vez al empezar, para que no cambie a mitad del recorrido.
    if (sesion?.grupo !== 'faltantes') {
      const faltan = pasosFaltantes(leerPerfil());
      if (faltan.length === 0) return null;
      sesion = null;
      iniciarSesion('faltantes', faltan);
    }
    const indice = Math.min(Math.max(Number(numero || 1) - 1, 0), sesion.pasos.length - 1);
    return dibujarPaso(indice);
  }
  const pasos = GRUPOS[grupo];
  if (!pasos) return null;
  iniciarSesion(grupo, pasos);
  const indice = Math.min(Math.max(Number(numero || 1) - 1, 0), pasos.length - 1);
  return dibujarPaso(indice);
}

export function pantallaEditarPregunta(pasoId) {
  if (!buscarPaso(pasoId)) return null;
  // Si la pregunta 5 se edita, se muestran sus dos pantallas.
  const pasos = pasoId.startsWith('restricciones') ? ['restricciones1', 'restricciones2'] : [pasoId];
  iniciarSesion('editar', pasos);
  return dibujarPaso(0);
}

// ---------- Acciones ----------

function elegirOpcion(campo, opcion) {
  const pasoActual = PASOS.find((p) => p.bloques.some((b) => b.campo === campo));
  const bloque = pasoActual.bloques.find((b) => b.campo === campo);
  sesion.avisoMaximo = null;

  if (bloque.tipo === 'unica') {
    sesion.borrador[campo] = opcion;
    return;
  }
  const actuales = [...(sesion.borrador[campo] ?? [])];
  const exclusivas = bloque.exclusivas ?? [];
  if (actuales.includes(opcion)) {
    sesion.borrador[campo] = actuales.filter((o) => o !== opcion);
  } else if (exclusivas.includes(opcion)) {
    sesion.borrador[campo] = [opcion];
  } else {
    const sinExclusivas = actuales.filter((o) => !exclusivas.includes(o));
    if (bloque.max && sinExclusivas.length >= bloque.max) {
      sesion.avisoMaximo = campo;
      return;
    }
    sesion.borrador[campo] = [...sinExclusivas, opcion];
  }
}

// Guarda las respuestas y marca la pantalla actual como respondida.
function guardarBorrador(pasoId) {
  const hechos = new Set(sesion.borrador.pasosRespondidos ?? []);
  hechos.add(pasoId);
  sesion.borrador.pasosRespondidos = [...hechos];
  guardarPerfil(sesion.borrador);
}

// Devuelve true si la acción era de esta pantalla.
export function accionPreguntas(boton, raiz) {
  const accion = boton.dataset.accion;
  const pantalla = raiz.querySelector('.preguntas');
  if (!pantalla || !sesion) return false;
  const indice = Number(pantalla.dataset.indice);

  if (accion === 'opcion') {
    elegirOpcion(boton.dataset.campo, boton.dataset.opcion);
    const scroll = window.scrollY;
    raiz.innerHTML = dibujarPaso(indice);
    raiz.firstElementChild?.classList.add('quieta');
    window.scrollTo(0, scroll);
    raiz.querySelector(`[data-campo="${boton.dataset.campo}"][data-opcion="${boton.dataset.opcion}"]`)?.focus();
    return true;
  }
  if (accion === 'preguntas-siguiente') {
    guardarBorrador(sesion.pasos[indice]);
    if (indice < sesion.pasos.length - 1) {
      location.hash = rutaPaso(indice + 1);
    } else {
      const destino = destinoFinal(sesion.grupo);
      sesion = null;
      location.hash = destino;
    }
    return true;
  }
  if (accion === 'preguntas-atras') {
    history.back();
    return true;
  }
  if (accion === 'preguntas-cerrar') {
    const destino = destinoFinal(sesion.grupo);
    sesion = null;
    location.hash = destino;
    return true;
  }
  return false;
}

// Los campos de texto se guardan en el borrador mientras se escribe.
export function entradaPreguntas(campo) {
  if (!sesion || !campo.dataset.campo) return;
  sesion.borrador[campo.dataset.campo] = campo.value;
  // El botón de la pregunta 5 cambia de "No tengo restricciones" a "Siguiente".
  const boton = document.querySelector('[data-accion="preguntas-siguiente"]');
  const pasoActual = buscarPaso(sesion.pasos[Number(document.querySelector('.preguntas')?.dataset.indice)]);
  if (boton && pasoActual?.botonSinRespuesta) {
    const ultimo = sesion.pasos.indexOf(pasoActual.id) === sesion.pasos.length - 1;
    boton.textContent = hayRespuestaEn(pasoActual)
      ? t(ultimo ? 'preguntas.listo' : 'preguntas.siguiente')
      : t(`preguntas.${pasoActual.botonSinRespuesta}`);
  }
}
