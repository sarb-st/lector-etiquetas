import { t } from '../i18n/index.js';
import { icono } from '../ui/iconos.js';
import { esc, claseBanda, iconoLinea, resultadoActual } from '../ui/comunes.js';
import { leerPerfil, guardarPerfil, leerHistorial, agregarAlHistorial } from '../datos/almacen.js';
import { analizar } from '../puntaje/index.js';
import { completitud } from '../perfil/preguntas.js';

const MAXIMO_RECIENTES = 4;

function filaObjetivo(perfil) {
  const principal = perfil?.objetivos?.[0];
  if (!principal) {
    return `<a class="objetivo-pastilla tocable" href="#/perfil">${esc(t('inicio.sinObjetivo'))}</a>`;
  }
  const prioridad = perfil.prioridades?.[0];
  const texto = prioridad ? `${t(`objetivos.${principal}`)} · ${t(`prioridades.${prioridad}`)}` : t(`objetivos.${principal}`);
  return `
    <span>${esc(t('inicio.tuObjetivo'))}</span>
    <a class="objetivo-pastilla tocable" href="#/perfil">${esc(texto)}</a>`;
}

// Mientras falten preguntas, un acceso corto para completarlas.
function avisoPerfil(perfil) {
  if (!perfil) return '';
  const { porcentaje } = completitud(perfil);
  if (porcentaje === 100) return '';
  return `<a class="link-completar tocable" href="#/perfil">${esc(t('perfil.completarCorto', { p: porcentaje }))}</a>`;
}

function filaProducto(entrada) {
  const resultado = resultadoActual(entrada);
  const nombre = entrada.ficha.nombre;
  const linea = resultado.linea;
  return `
    <li>
      <a class="fila-producto tocable" href="#/resultado/${encodeURIComponent(entrada.id)}">
        <span class="nota-mini ${claseBanda(resultado.nota, resultado.provisional)}"
          aria-label="${esc(`${t('resultado.calidad')} ${resultado.nota} ${t('resultado.deDiez')}`)}">${esc(resultado.nota)}</span>
        <span class="texto">
          <span class="nombre">${esc(nombre)}</span>
          ${linea ? `<span class="detalle linea-${linea}">${icono(iconoLinea[linea], 'sm')}${esc(t(`lineas.${linea}`))}</span>` : ''}
        </span>
        ${icono('derecha')}
      </a>
    </li>`;
}

function recientes(historial) {
  if (historial.length === 0) {
    return `
      <div class="vacio">
        <p>${esc(t('inicio.vacio'))}</p>
        <button class="boton-pastilla tocable" data-accion="cargar-ejemplos">${esc(t('inicio.cargarEjemplos'))}</button>
      </div>`;
  }
  return `<ul class="lista-productos">${historial.slice(0, MAXIMO_RECIENTES).map(filaProducto).join('')}</ul>`;
}

export function pantallaInicio() {
  const perfil = leerPerfil();
  const historial = leerHistorial();

  return `
    <div class="pantalla">
      <header class="barra-superior">
        <span class="marca"><span class="marca-punto" aria-hidden="true"></span>${esc(t('app.nombre'))}</span>
        <a class="boton-redondo tocable" href="#/ajustes" aria-label="${esc(t('ajustes.titulo'))}">${icono('ajustes')}</a>
      </header>

      <div class="objetivo-fila">${filaObjetivo(perfil)}${avisoPerfil(perfil)}</div>

      <a class="bloque-principal tocable" href="#/analizar">
        <span class="icono-caja">${icono('escanear', 'lg')}</span>
        <h2>${esc(t('inicio.analizar'))}</h2>
        <p>${esc(t('inicio.analizarSub'))}</p>
      </a>

      <div class="bloques-dobles">
        <a class="bloque-chico oscuro tocable" href="#/comparar">
          ${icono('balanza', 'lg')}
          <span><h3>${esc(t('inicio.comparar'))}</h3><p>${esc(t('inicio.compararSub'))}</p></span>
        </a>
        <a class="bloque-chico suave tocable" href="#/me-cae-bien">
          ${icono('escudo', 'lg')}
          <span><h3>${esc(t('inicio.meCaeBien'))}</h3><p>${esc(t('inicio.meCaeBienSub'))}</p></span>
        </a>
      </div>

      <h2 class="titulo-seccion">
        <span>${esc(t('inicio.ultimos'))}</span>
        ${historial.length > MAXIMO_RECIENTES ? `<a href="#/mis-productos">${esc(t('inicio.verTodos'))}</a>` : ''}
      </h2>
      ${recientes(historial)}

      <a class="bloque-guia tocable" href="#/guia">
        <span class="icono-caja">${icono('libro')}</span>
        <span class="texto"><h3>${esc(t('inicio.guia'))}</h3><p>${esc(t('inicio.guiaSub'))}</p></span>
        ${icono('derecha')}
      </a>
    </div>`;
}

// Modo de prueba: carga productos de ejemplo mientras no existe el escaneo real.
export async function cargarEjemplos() {
  const { ejemplosParaHistorial } = await import('../datos/textos-ejemplo.js');
  if (!leerPerfil()) {
    guardarPerfil({ objetivos: ['bajar_grasa'], prioridades: ['mas_proteina'], exigencia: 'equilibrada' });
  }
  const perfil = leerPerfil();
  for (const ejemplo of [...ejemplosParaHistorial].reverse()) {
    agregarAlHistorial({
      id: ejemplo.id,
      fecha: new Date().toISOString(),
      fuente: 'ejemplo',
      ficha: ejemplo.ficha,
      textos: ejemplo.textos,
      resultado: analizar(ejemplo.ficha, perfil),
    });
  }
}
