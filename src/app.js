// Arranque de la app: navegación entre pantallas y acciones de los botones.
// Las direcciones usan "#/..." para funcionar en GitHub Pages sin servidor.

import { t, idioma } from './i18n/index.js';
import { icono } from './ui/iconos.js';
import { esc } from './ui/comunes.js';
import { pantallaInicio, cargarEjemplos } from './pantallas/inicio.js';
import {
  pantallaResultado,
  contenidoHojaEtiqueta,
  contenidoHojaCambiarTipo,
  montarResultado,
  alternarAnalisis,
  enviarCambioTipo,
  enviarEnvase,
  escribirTextosDe,
} from './pantallas/resultado.js';
import { compartirConOFF, descartarAporte } from './datos/subir-off.js';
import { abrirChat, cerrarChat, chatAbierto, accionChat, enviarChat, entradaChat, teclaChat } from './pantallas/chat.js';
import { pantallaPreguntas, pantallaEditarPregunta, accionPreguntas, entradaPreguntas } from './pantallas/preguntas.js';
import { pantallaPerfil } from './pantallas/perfil.js';
import { pantallaAjustes, accionAjustes, enviarFormularioAjustes, responderCompartirOFF } from './pantallas/ajustes.js';
import { pantallaMisProductos, quitarDeMisProductos } from './pantallas/mis-productos.js';
import { leerPerfil, leerHistorial, buscarEnHistorial } from './datos/almacen.js';
import { pantallaComparar, pantallaElegir, ponerEnCasilla, montarComparar } from './pantallas/comparar.js';
import { pantallaCrearClave } from './pantallas/crear-clave.js';
import { pantallaGuia, pantallaCapitulo, montarGuia } from './pantallas/guia.js';
import { pantallaBuscar, montarBuscar, entradaBuscar, accionBuscar } from './pantallas/buscar.js';
import {
  pantallaMeCaeBien,
  pantallaPuntual,
  pantallaEscanearMcb,
  montarEscanerMcb,
  pantallaResultadoMcb,
  accionMeCaeBien,
  enviarCodigoMcb,
  recibirFotoMcb,
} from './pantallas/me-cae-bien.js';
import {
  empezarReescaneo,
  pantallaEscanear,
  montarEscaner,
  detenerCamara,
  pantallaFotos,
  pantallaProcesando,
  recibirFoto,
  accionAnalizar,
  enviarCodigo,
} from './pantallas/analizar.js';
import { irA, rutaActual } from './ui/rutas.js';

const raiz = document.getElementById('app');
const tabbar = document.getElementById('tabbar');
const hoja = document.getElementById('hoja');

// Cada ruta: qué pantalla dibuja y qué pestaña queda marcada (null = sin barra).
const rutas = [
  { patron: /^\/?$/, tab: 'inicio', dibujar: () => pantallaInicio() },
  {
    patron: /^\/resultado\/(.+)$/,
    tab: null,
    dibujar: (m) => pantallaResultado(decodeURIComponent(m[1])),
    montar: montarResultado,
  },
  { patron: /^\/mis-productos$/, tab: 'misProductos', dibujar: () => pantallaMisProductos() },
  { patron: /^\/guia(?:\/([a-z]+))?$/, tab: 'guia', dibujar: (m) => pantallaGuia(m[1]), montar: montarGuia },
  {
    patron: /^\/guia\/([a-z]+)\/(\d+)$/,
    tab: null,
    dibujar: (m) => pantallaCapitulo(m[1], m[2]),
    montar: montarGuia,
  },
  { patron: /^\/perfil$/, tab: 'perfil', dibujar: () => pantallaPerfil() },
  { patron: /^\/ajustes$/, tab: null, dibujar: () => pantallaAjustes() },
  { patron: /^\/crear-clave$/, tab: null, dibujar: () => pantallaCrearClave() },
  { patron: /^\/preguntas\/editar\/([a-z0-9]+)$/, tab: null, dibujar: (m) => pantallaEditarPregunta(m[1]) },
  { patron: /^\/preguntas\/([a-z]+)(?:\/(\d+))?$/, tab: null, dibujar: (m) => pantallaPreguntas(m[1], m[2]) },
  { patron: /^\/analizar$/, tab: null, dibujar: () => pantallaEscanear(), montar: montarEscaner },
  { patron: /^\/buscar(?:\/comparar\/(a|b))?$/, tab: null, dibujar: (m) => pantallaBuscar(m[1] ?? null), montar: montarBuscar },
  { patron: /^\/analizar\/fotos$/, tab: null, dibujar: () => pantallaFotos() },
  { patron: /^\/analizar\/procesando$/, tab: null, dibujar: () => pantallaProcesando() },
  { patron: /^\/analizar\/comparar\/(a|b)$/, tab: null, dibujar: (m) => pantallaEscanear(m[1]), montar: montarEscaner },
  { patron: /^\/comparar$/, tab: null, dibujar: () => pantallaComparar(), montar: montarComparar },
  { patron: /^\/comparar\/elegir\/(a|b)$/, tab: null, dibujar: (m) => pantallaElegir(m[1]) },
  {
    patron: /^\/comparar\/(a|b)\/(.+)$/,
    tab: null,
    dibujar: (m) => ponerEnCasilla(m[1], decodeURIComponent(m[2])),
    montar: montarComparar,
  },
  { patron: /^\/me-cae-bien$/, tab: null, dibujar: () => pantallaMeCaeBien() },
  { patron: /^\/me-cae-bien\/puntual$/, tab: null, dibujar: () => pantallaPuntual() },
  { patron: /^\/me-cae-bien\/escanear$/, tab: null, dibujar: () => pantallaEscanearMcb(), montar: montarEscanerMcb },
  { patron: /^\/me-cae-bien\/resultado$/, tab: null, dibujar: () => pantallaResultadoMcb() },
];

const pestanas = [
  { clave: 'inicio', ruta: '#/', icono: 'casa' },
  { clave: 'misProductos', ruta: '#/mis-productos', icono: 'marcador' },
  { clave: 'guia', ruta: '#/guia', icono: 'libro' },
  { clave: 'perfil', ruta: '#/perfil', icono: 'persona' },
];

function dibujarTabbar(activa) {
  if (!activa) {
    tabbar.hidden = true;
    raiz.classList.add('sin-tabbar');
    return;
  }
  tabbar.hidden = false;
  raiz.classList.remove('sin-tabbar');
  tabbar.innerHTML = `<ul>${pestanas
    .map(
      (p) => `
      <li><a class="tocable" href="${p.ruta}" ${p.clave === activa ? 'aria-current="page"' : ''}>
        ${icono(p.icono)}<span>${esc(t(`tabs.${p.clave}`))}</span>
      </a></li>`,
    )
    .join('')}</ul>`;
}

function navegar({ mantenerScroll = false } = {}) {
  // Por si se sale con el análisis completo abierto.
  document.body.style.overflow = '';
  const ruta = rutaActual();

  // La primera vez: las preguntas mínimas antes de empezar.
  if (ruta === '/' && !leerPerfil() && leerHistorial().length === 0) {
    irA('#/preguntas/inicio/1');
    return;
  }

  // La cámara se apaga al salir de la pantalla de escaneo.
  detenerCamara();

  for (const r of rutas) {
    const m = ruta.match(r.patron);
    const html = m ? r.dibujar(m) : null;
    if (html) {
      const scroll = window.scrollY;
      raiz.innerHTML = html;
      // Al redibujar la misma pantalla no se repite la animación de entrada.
      if (mantenerScroll) raiz.firstElementChild?.classList.add('quieta');
      dibujarTabbar(r.tab);
      window.scrollTo(0, mantenerScroll ? scroll : 0);
      document.title = t('app.nombre');
      r.montar?.(raiz);
      return;
    }
  }
  irA('#/');
}

const redibujar = () => navegar({ mantenerScroll: true });

// Un solo escuchador para todos los botones con data-accion.
document.addEventListener('click', async (evento) => {
  const boton = evento.target.closest('[data-accion]');
  if (!boton) return;
  const accion = boton.dataset.accion;

  if (
    accionPreguntas(boton, raiz) ||
    accionAjustes(boton, redibujar) ||
    accionAnalizar(boton) ||
    accionMeCaeBien(boton, redibujar) ||
    accionBuscar(boton) ||
    accionChat(boton)
  ) {
    return;
  }

  if (accion === 'alternar-analisis') {
    alternarAnalisis();
  } else if (accion === 'cerrar-analisis') {
    alternarAnalisis(false);
  } else if (accion === 'agregar-foto' || accion === 'no-coinciden') {
    const entrada = buscarEnHistorial(raiz.querySelector('[data-id]')?.dataset.id);
    if (entrada) empezarReescaneo(entrada);
  } else if (accion === 'quitar-producto') {
    quitarDeMisProductos(boton.dataset.id);
    redibujar();
  } else if (accion === 'cargar-ejemplos') {
    await cargarEjemplos();
    navegar();
  } else if (accion === 'cambiar-tipo') {
    hoja.innerHTML = contenidoHojaCambiarTipo(raiz.querySelector('[data-id]')?.dataset.id);
    hoja.showModal();
  } else if (accion === 'abrir-etiqueta') {
    const id = raiz.querySelector('[data-id]')?.dataset.id;
    hoja.innerHTML = contenidoHojaEtiqueta(id, boton.dataset.clave, boton.dataset.tipo);
    hoja.showModal();
  } else if (accion === 'cerrar-hoja') {
    hoja.close();
  } else if (accion === 'abrir-chat') {
    abrirChat(raiz.querySelector('[data-id]')?.dataset.id, boton);
  } else if (accion === 'off-si' || accion === 'off-no') {
    const id = raiz.querySelector('[data-id]')?.dataset.id;
    responderCompartirOFF(accion === 'off-si');
    if (accion === 'off-si') compartirConOFF(id);
    else descartarAporte(id);
    redibujar();
  } else if (accion === 'escribir-textos') {
    await escribirTextosDe(raiz.querySelector('[data-id]')?.dataset.id, boton);
    redibujar();
  }
});

// Cuando llegan los textos de un análisis que se está mirando, se redibuja en el lugar.
// Si hay una hoja abierta, espera a que se cierre; el análisis completo queda como estaba.
window.addEventListener('entrada-actualizada', (evento) => {
  const id = evento.detail.id;
  const actualizar = () => {
    if (raiz.querySelector('.pantalla-resultado')?.dataset.id !== id) return;
    const abierta = document.querySelector('.hoja-analisis')?.dataset.estado === 'abierta';
    redibujar();
    if (abierta) alternarAnalisis(true);
  };
  if (hoja.open) hoja.addEventListener('close', actualizar, { once: true });
  else if (chatAbierto()) window.addEventListener('chat-cerrado', actualizar, { once: true });
  else actualizar();
});

// En el chat, Enter manda la pregunta.
document.addEventListener('keydown', teclaChat);

// El chat se cierra con su animación (también con Escape), y al cerrarse se actualiza la caja.
const dialogoChat = document.getElementById('chat');
dialogoChat.addEventListener('cancel', (evento) => {
  evento.preventDefault();
  cerrarChat();
});
window.addEventListener('chat-cerrado', () => {
  if (raiz.querySelector('.pantalla-resultado')) redibujar();
});

// Escape cierra el análisis completo.
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && document.querySelector('.hoja-analisis[data-estado="abierta"]')) alternarAnalisis(false);
});

// Si la foto de un producto no carga (por ejemplo, sin internet), queda la inicial.
document.addEventListener(
  'error',
  (evento) => {
    if (evento.target?.matches?.('.producto-foto img, .foto-mini img, .foto-podio img')) evento.target.remove();
  },
  true,
);

document.addEventListener('input', (evento) => {
  if (evento.target.matches('.preguntas [data-campo]')) entradaPreguntas(evento.target);
  else if (!entradaChat(evento.target)) entradaBuscar(evento.target);
});

document.addEventListener('submit', (evento) => {
  const formulario = evento.target;
  if (formulario.dataset.formulario === 'tipo') {
    evento.preventDefault();
    enviarCambioTipo(formulario)
      .then(() => {
        hoja.close();
        redibujar();
      })
      .catch(() => {});
    return;
  }
  if (enviarChat(formulario)) {
    evento.preventDefault();
    return;
  }
  if (enviarEnvase(formulario)) {
    evento.preventDefault();
    redibujar();
  } else if (enviarFormularioAjustes(formulario, redibujar) || enviarCodigo(formulario) || enviarCodigoMcb(formulario)) {
    evento.preventDefault();
  }
});

document.addEventListener('change', (evento) => {
  if (evento.target.matches('input[type="file"][data-foto]')) recibirFoto(evento.target, redibujar);
  if (evento.target.matches('input[type="file"][data-foto-mcb]')) recibirFotoMcb(evento.target);
});

// Tocar fuera de la hoja la cierra.
hoja.addEventListener('click', (evento) => {
  if (evento.target === hoja) hoja.close();
});
hoja.addEventListener('close', () => {
  hoja.innerHTML = '';
});

// Cambio de pantalla (ver ui/rutas.js): la dirección de la página no cambia.
window.addEventListener('cambio-de-ruta', () => {
  if (hoja.open) hoja.close();
  const chat = document.getElementById('chat');
  if (chat.open) chat.close();
  navegar();
});

// Los enlaces de la app (href="#/...") cambian de pantalla sin tocar la dirección.
document.addEventListener('click', (evento) => {
  const enlace = evento.target.closest('a[href^="#/"]');
  if (!enlace || evento.defaultPrevented || evento.metaKey || evento.ctrlKey) return;
  evento.preventDefault();
  if (enlace.getAttribute('aria-disabled') === 'true') return;
  irA(enlace.getAttribute('href'));
});

// Bienvenida: la primera vez dura un poco más y saluda; después es un guiño corto.
// Se cuenta desde que empezó a cargar la página, así nunca suma espera de más.
function despedirBienvenida(primeraVez) {
  const bienvenida = document.getElementById('bienvenida');
  if (!bienvenida) return;
  bienvenida.querySelector('.nombre').textContent = t('app.nombre');
  if (primeraVez) {
    // La primera vez: el logo completo (tetrapack → pera → muffin) y un saludo.
    bienvenida.querySelector('.saludo').textContent = t('bienvenida.saludo');
    bienvenida.classList.add('con-saludo');
  } else {
    // Las demás: un guiño corto.
    bienvenida.classList.add('corta');
  }
  const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const duracion = reducido ? 600 : primeraVez ? 4300 : 2000;
  const falta = Math.max(0, duracion - performance.now());
  let salio = false;
  const salir = () => {
    if (salio) return;
    salio = true;
    bienvenida.classList.add('saliendo');
    setTimeout(() => bienvenida.remove(), 300);
  };
  setTimeout(salir, falta);
  // Un toque la saltea: nunca hace esperar.
  bienvenida.addEventListener('pointerdown', salir, { once: true });
}

document.documentElement.lang = idioma();
document.title = t('app.nombre');
despedirBienvenida(!leerPerfil() && leerHistorial().length === 0);
navegar();

// Para abrir sin conexión y poder instalarla en la pantalla de inicio.
// (No en las pruebas de flujo: ahí la app corre desde tests/.)
if ('serviceWorker' in navigator && !location.pathname.includes('/tests/')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
