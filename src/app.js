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
  enviarCambioTipo,
  enviarEnvase,
} from './pantallas/resultado.js';
import { pantallaPreguntas, pantallaEditarPregunta, accionPreguntas, entradaPreguntas } from './pantallas/preguntas.js';
import { pantallaPerfil } from './pantallas/perfil.js';
import { pantallaAjustes, accionAjustes, enviarFormularioAjustes } from './pantallas/ajustes.js';
import { pantallaMisProductos, quitarDeMisProductos } from './pantallas/mis-productos.js';
import { leerPerfil, leerHistorial, buscarEnHistorial } from './datos/almacen.js';
import { pantallaComparar, pantallaElegir, ponerEnCasilla, montarComparar } from './pantallas/comparar.js';
import { pantallaCrearClave } from './pantallas/crear-clave.js';
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

const raiz = document.getElementById('app');
const tabbar = document.getElementById('tabbar');
const hoja = document.getElementById('hoja');

function enConstruccion(titulo) {
  return `
    <div class="pantalla">
      <header class="barra-superior">
        <a class="boton-redondo tocable" href="#/" aria-label="${esc(t('resultado.volver'))}">${icono('atras')}</a>
      </header>
      <div class="en-construccion">
        <h1>${esc(titulo)}</h1>
        <p>${esc(t('construccion.texto'))}</p>
      </div>
    </div>`;
}

// Cada ruta: qué pantalla dibuja y qué pestaña queda marcada (null = sin barra).
const rutas = [
  { patron: /^\/?$/, tab: 'inicio', dibujar: () => pantallaInicio() },
  { patron: /^\/resultado\/(.+)$/, tab: null, dibujar: (m) => pantallaResultado(decodeURIComponent(m[1])) },
  { patron: /^\/mis-productos$/, tab: 'misProductos', dibujar: () => pantallaMisProductos() },
  { patron: /^\/guia$/, tab: 'guia', dibujar: () => enConstruccion(t('tabs.guia')) },
  { patron: /^\/perfil$/, tab: 'perfil', dibujar: () => pantallaPerfil() },
  { patron: /^\/ajustes$/, tab: null, dibujar: () => pantallaAjustes() },
  { patron: /^\/crear-clave$/, tab: null, dibujar: () => pantallaCrearClave() },
  { patron: /^\/preguntas\/editar\/([a-z0-9]+)$/, tab: null, dibujar: (m) => pantallaEditarPregunta(m[1]) },
  { patron: /^\/preguntas\/([a-z]+)(?:\/(\d+))?$/, tab: null, dibujar: (m) => pantallaPreguntas(m[1], m[2]) },
  { patron: /^\/analizar$/, tab: null, dibujar: () => pantallaEscanear(), montar: montarEscaner },
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
  const ruta = location.hash.replace(/^#/, '') || '/';

  // La primera vez: las preguntas mínimas antes de empezar.
  if (ruta === '/' && !leerPerfil() && leerHistorial().length === 0) {
    location.hash = '#/preguntas/inicio/1';
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
  location.hash = '#/';
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
    accionMeCaeBien(boton, redibujar)
  ) {
    return;
  }

  if (accion === 'agregar-foto' || accion === 'no-coinciden') {
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
  }
});

document.addEventListener('input', (evento) => {
  if (evento.target.matches('.preguntas [data-campo]')) entradaPreguntas(evento.target);
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

window.addEventListener('hashchange', () => {
  if (hoja.open) hoja.close();
  navegar();
});

// Bienvenida: la primera vez dura un poco más y saluda; después es un guiño corto.
// Se cuenta desde que empezó a cargar la página, así nunca suma espera de más.
function despedirBienvenida(primeraVez) {
  const bienvenida = document.getElementById('bienvenida');
  if (!bienvenida) return;
  bienvenida.querySelector('.nombre').textContent = t('app.nombre');
  if (primeraVez) {
    bienvenida.querySelector('.saludo').textContent = t('bienvenida.saludo');
    bienvenida.classList.add('con-saludo');
  }
  const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const duracion = reducido ? 400 : primeraVez ? 1600 : 900;
  const falta = Math.max(0, duracion - performance.now());
  setTimeout(() => {
    bienvenida.classList.add('saliendo');
    setTimeout(() => bienvenida.remove(), 300);
  }, falta);
}

document.documentElement.lang = idioma();
document.title = t('app.nombre');
despedirBienvenida(!leerPerfil() && leerHistorial().length === 0);
navegar();

// Para abrir sin conexión y poder instalarla en la pantalla de inicio.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
