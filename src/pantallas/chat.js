// "Preguntá lo que quieras": caja al final del resultado que, al tocarla, crece hasta ocupar la
// pantalla y se vuelve un chat sobre ese producto. La conversación se guarda con el producto
// (entrada.chat = [{ rol: 'persona' | 'app', texto }]). Responde la IA (ver ia/preguntas.js).

import { t } from '../i18n/index.js';
import { icono } from '../ui/iconos.js';
import { esc, fotoProducto } from '../ui/comunes.js';
import { buscarEnHistorial, actualizarEntrada } from '../datos/almacen.js';
import { leerClave } from './ajustes.js';
import { preguntarSobreProducto } from '../ia/preguntas.js';

const dialogo = () => document.getElementById('chat');
let idAbierto = null;
let esperando = false;
const reducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// La caja de la pantalla del resultado.
export function cajaPregunta(entrada) {
  if (entrada.resultado?.nota === null && !entrada.ficha?.ingredientes) return '';
  const chat = entrada.chat ?? [];
  const ultima = [...chat].reverse().find((m) => m.rol === 'app');
  const sinClave = !leerClave();
  return `
    <section class="bloque-pregunta">
      <button type="button" class="caja-pregunta tocable" data-accion="abrir-chat" ${sinClave ? 'disabled' : ''}>
        ${icono('burbuja')}
        <span class="texto">${esc(t(chat.length ? 'chat.seguir' : 'chat.caja'))}</span>
        ${chat.length ? `<span class="contador">${chat.filter((m) => m.rol === 'persona').length}</span>` : ''}
      </button>
      ${ultima ? `<p class="ultima-respuesta">${esc(ultima.texto)}</p>` : ''}
      ${sinClave ? `<p class="ayuda-bloque">${esc(t('chat.sinClave'))}</p>` : ''}
    </section>`;
}

function parrafos(texto) {
  return texto
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function burbujas(chat) {
  return chat.map((m) => `<li class="burbuja ${m.rol}">${parrafos(m.texto)}</li>`).join('');
}

function contenido(entrada) {
  const chat = entrada.chat ?? [];
  return `
    <header class="chat-cabecera">
      ${fotoProducto(entrada, 'foto-mini')}
      <div class="texto">
        <p class="etiqueta-chica">${esc(t('chat.titulo'))}</p>
        <h2 id="chat-titulo">${esc(entrada.ficha.nombre)}</h2>
      </div>
      <button type="button" class="boton-redondo tocable" data-accion="cerrar-chat" aria-label="${esc(t('chat.cerrar'))}">${icono('abajo')}</button>
    </header>
    <div class="chat-cuerpo">
      ${chat.length ? '' : `<p class="chat-vacio">${esc(t('chat.vacio'))}</p>`}
      <ol class="chat-mensajes" aria-live="polite">${burbujas(chat)}</ol>
    </div>
    <form class="chat-pie" data-formulario="chat">
      <label class="visualmente-oculto" for="chat-campo">${esc(t('chat.caja'))}</label>
      <textarea id="chat-campo" name="pregunta" rows="1" enterkeyhint="send" placeholder="${esc(t('chat.placeholder'))}"></textarea>
      <button type="submit" class="boton-enviar tocable" aria-label="${esc(t('chat.enviar'))}">${icono('enviar')}</button>
    </form>`;
}

// El alto visible cambia cuando aparece el teclado del iPhone: el chat se ajusta a eso.
function ajustarAlTeclado() {
  const d = dialogo();
  const vv = window.visualViewport;
  if (!d?.open || !vv) return;
  d.style.setProperty('--alto-chat', `${vv.height}px`);
  d.style.setProperty('--arriba-chat', `${vv.offsetTop}px`);
  bajarAlFinal();
}
window.visualViewport?.addEventListener('resize', ajustarAlTeclado);
window.visualViewport?.addEventListener('scroll', ajustarAlTeclado);

function bajarAlFinal() {
  const cuerpo = dialogo()?.querySelector('.chat-cuerpo');
  if (cuerpo) cuerpo.scrollTop = cuerpo.scrollHeight;
}

// El recorte que tiene la caja de la pantalla, para que el chat "salga" de ella.
function recorteDesde(caja) {
  if (!caja) return 'inset(100% 0 0 0 round 24px)';
  const r = caja.getBoundingClientRect();
  return `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round 20px)`;
}

export function abrirChat(id, caja) {
  const entrada = buscarEnHistorial(id);
  const d = dialogo();
  if (!entrada || !d) return;
  idAbierto = id;
  d.innerHTML = contenido(entrada);
  d.showModal();
  ajustarAlTeclado();
  bajarAlFinal();
  // El foco en el campo tiene que ir en el mismo toque para que el iPhone abra el teclado.
  d.querySelector('#chat-campo').focus({ preventScroll: true });
  if (!reducido()) {
    d.animate([{ clipPath: recorteDesde(caja) }, { clipPath: 'inset(0 0 0 0 round 0px)' }], {
      duration: 420,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    });
    d.querySelector('.chat-cuerpo').animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], {
      duration: 320,
      delay: 120,
      easing: 'ease-out',
      fill: 'backwards',
    });
  }
}

export function cerrarChat() {
  const d = dialogo();
  if (!d?.open) return;
  const caja = document.querySelector('.caja-pregunta');
  let listo = false;
  const terminar = () => {
    if (listo) return;
    listo = true;
    d.close();
    d.innerHTML = '';
    // Aviso propio (el evento "close" del navegador puede llegar tarde): la pantalla se actualiza.
    window.dispatchEvent(new Event('chat-cerrado'));
  };
  if (reducido()) return terminar();
  const duracion = 320;
  d.animate([{ clipPath: 'inset(0 0 0 0 round 0px)' }, { clipPath: recorteDesde(caja) }], {
    duration: duracion,
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    fill: 'forwards',
  }).onfinish = terminar;
  // Por si el navegador pausa la animación (por ejemplo, con la app en segundo plano).
  setTimeout(terminar, duracion + 100);
}

export const chatAbierto = () => Boolean(dialogo()?.open);

function agregarBurbuja(html, clase) {
  const lista = dialogo()?.querySelector('.chat-mensajes');
  if (!lista) return null;
  dialogo().querySelector('.chat-vacio')?.remove();
  const li = document.createElement('li');
  li.className = `burbuja ${clase}`;
  li.innerHTML = html;
  lista.append(li);
  if (!reducido()) li.animate([{ opacity: 0, transform: 'translateY(8px) scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
  bajarAlFinal();
  return li;
}

async function preguntar(pregunta) {
  const id = idAbierto;
  const entrada = buscarEnHistorial(id);
  if (!entrada || esperando) return;
  esperando = true;
  const anterior = entrada.chat ?? [];
  agregarBurbuja(parrafos(pregunta), 'persona');
  const pensando = agregarBurbuja('<span class="puntos" aria-label="…"><span></span><span></span><span></span></span>', 'app pensando');
  try {
    const respuesta = await preguntarSobreProducto(entrada, anterior, pregunta);
    const chat = [...anterior, { rol: 'persona', texto: pregunta }, { rol: 'app', texto: respuesta }];
    actualizarEntrada(id, { chat });
    pensando?.remove();
    if (idAbierto === id) agregarBurbuja(parrafos(respuesta), 'app');
  } catch (error) {
    pensando?.remove();
    const li = agregarBurbuja(
      `<p>${esc(t(`analizar.error_${error.tipo ?? 'otro'}`))}</p><button type="button" class="link-flecha" data-accion="reintentar-chat">${esc(t('chat.reintentar'))}</button>`,
      'app error',
    );
    // La pregunta que falló no se guarda: se puede volver a mandar.
    li?.previousElementSibling?.classList.add('sin-respuesta');
    if (li) li.dataset.pregunta = pregunta;
  } finally {
    esperando = false;
  }
}

export function enviarChat(formulario) {
  if (formulario.dataset.formulario !== 'chat') return false;
  const campo = formulario.pregunta;
  const pregunta = campo.value.trim();
  if (!pregunta || esperando) return true;
  campo.value = '';
  campo.style.height = '';
  preguntar(pregunta);
  return true;
}

// El campo crece mientras se escribe; Enter manda (Mayúsculas + Enter, renglón nuevo).
export function entradaChat(campo) {
  if (campo.id !== 'chat-campo') return false;
  campo.style.height = 'auto';
  campo.style.height = `${Math.min(campo.scrollHeight, 140)}px`;
  return true;
}

export function teclaChat(evento) {
  if (evento.target.id !== 'chat-campo' || evento.key !== 'Enter' || evento.shiftKey || evento.isComposing) return;
  evento.preventDefault();
  evento.target.form.requestSubmit();
}

export function accionChat(boton) {
  const accion = boton.dataset.accion;
  if (accion === 'cerrar-chat') {
    cerrarChat();
    return true;
  }
  if (accion === 'reintentar-chat') {
    const li = boton.closest('.burbuja');
    const pregunta = li?.dataset.pregunta;
    li?.previousElementSibling?.remove();
    li?.remove();
    if (pregunta) preguntar(pregunta);
    return true;
  }
  return false;
}
