import { t, idioma, numero } from '../i18n/index.js';
import { icono } from '../ui/iconos.js';
import {
  esc,
  claseBanda,
  nombreBanda,
  iconoLinea,
  iconoSirvePara,
  textosEnIdioma,
  resultadoActual,
} from '../ui/comunes.js';
import { buscarEnHistorial, actualizarFicha, actualizarEntrada } from '../datos/almacen.js';
import { CATEGORIAS } from '../puntaje/reglas.js';
import { leerClave } from './ajustes.js';
import { reescribirTextos } from '../ia/analisis.js';
import { porcionDe } from '../puntaje/derivados.js';
import { htmlRestricciones, nombreRestriccion } from './me-cae-bien.js';

const NIVELES_PROCESAMIENTO = ['natural', 'minimo', 'procesado', 'ultra'];
const ICONO_CHIP = { exceso: 'alerta', flojo: 'menos', bueno: 'mas' };

function cabecera(entrada, textos) {
  const { ficha } = entrada;
  const n = ficha.nutrientes;
  const unidad = ficha.esBebida ? t('resultado.por100ml') : t('resultado.por100g');
  const inicial = ficha.nombre?.trim()?.[0] ?? '?';
  const detectado = textos.detectado || ficha.tipoDetectado;
  return `
    <div class="producto-cabecera">
      <span class="producto-foto" aria-hidden="true">${esc(inicial)}</span>
      <div>
        <h1>${esc(ficha.nombre)}</h1>
        ${detectado ? `<p class="meta">${esc(t('resultado.detecte'))} ${esc(detectado)} · <button type="button" data-accion="cambiar-tipo">${esc(t('resultado.cambiar'))}</button></p>` : ''}
        ${n?.kcal != null ? `<p class="meta">${esc(unidad)} · ${esc(numero(n.kcal, 0))} ${esc(t('resultado.kcal'))}</p>` : ''}
      </div>
    </div>
    ${marcaFuente(entrada)}
    ${bloqueEnvase(entrada)}`;
}

// Si los datos vienen de Open Food Facts, se dice y se ofrece confirmarlos con fotos.
function marcaFuente(entrada) {
  if (entrada.fuente !== 'open_food_facts') return '';
  return `
    <p class="marca-fuente">
      ${icono('info', 'sm')}<span>${esc(t('resultado.datosOFF'))}</span>
      <button type="button" data-accion="no-coinciden">${esc(t('resultado.confirmarConFoto'))}</button>
    </p>`;
}

// Cuánto trae el envase y qué aporta lo que se come de una vez.
function bloqueEnvase(entrada) {
  const { ficha } = entrada;
  const n = ficha.nutrientes;
  const porcion = porcionDe(ficha);
  const unidad = ficha.esBebida ? 'ml' : 'g';
  let linea = '';
  if (porcion && n?.kcal != null) {
    const factor = porcion.gramos / 100;
    const partes = [`${numero(n.kcal * factor, 0)} ${t('resultado.kcal')}`];
    if (n.proteina != null) partes.push(t('resultado.gProteina', { v: numero(n.proteina * factor, 0) }));
    const rotulo =
      porcion.tipo === 'envase'
        ? t('resultado.envaseEntero', { v: numero(porcion.gramos, 0), u: unidad })
        : t('resultado.porcionTipica', { v: numero(porcion.gramos, 0), u: unidad });
    linea = `<p class="linea-porcion"><strong>${esc(rotulo)}:</strong> ${esc(partes.join(' · '))}</p>`;
  }
  const formulario =
    ficha.contenidoEnvase == null
      ? `
      <form class="fila-envase" data-formulario="envase" data-id="${esc(entrada.id)}">
        <label for="campo-envase">${esc(t('resultado.cuantoTrae'))}</label>
        <span class="campo-con-unidad">
          <input id="campo-envase" class="campo-texto" name="gramos" inputmode="decimal" autocomplete="off" placeholder="400" />
          <span aria-hidden="true">${unidad}</span>
        </span>
        <button type="submit" class="boton-pastilla tocable">${esc(t('ajustes.guardar'))}</button>
      </form>`
      : '';
  if (!linea && !formulario) return '';
  return `<div class="tarjeta bloque-envase">${linea}${formulario}</div>`;
}

export function enviarEnvase(formulario) {
  if (formulario.dataset.formulario !== 'envase') return false;
  const gramos = Number(String(formulario.gramos.value).replace(',', '.'));
  if (!Number.isFinite(gramos) || gramos <= 0) {
    formulario.gramos.focus();
    return true;
  }
  actualizarFicha(formulario.dataset.id, { contenidoEnvase: gramos });
  return true;
}

function avisoParcial(resultado) {
  const falta = resultado.nota === null ? 'parcialFaltaTabla' : resultado.provisional ? 'parcialFaltaIngredientes' : null;
  if (!falta) return '';
  return `
    <div class="aviso-parcial" role="status">
      ${icono('alerta')}
      <p class="texto"><strong>${esc(t('resultado.parcialTitulo'))}</strong>${esc(t(`resultado.${falta}`))}</p>
      <button type="button" class="boton-pastilla tocable" data-accion="agregar-foto">${icono('mas', 'sm')}${esc(t('resultado.agregarFoto'))}</button>
    </div>`;
}

// Resultado del chequeo automático de alérgenos e intolerancias, arriba de todo.
function avisoRestricciones(entrada) {
  const r = entrada.chequeo;
  if (!r) return '';
  const noAptas = r.restricciones.filter((x) => x.estado === 'no_apto').map((x) => nombreRestriccion(x.clave));
  const subtitulo =
    r.general === 'no_apto' ? t('meCaeBien.contiene', { lista: noAptas.join(', ') }) : t(`meCaeBien.sub_${r.general}`);
  return `
    <details class="veredicto-chico estado-${r.general}">
      <summary>
        ${icono(r.general === 'no_apto' ? 'prohibido' : r.general === 'revisar' ? 'alerta' : 'escudo')}
        <span><strong>${esc(t(`meCaeBien.veredicto_${r.general}`))}</strong> ${esc(subtitulo)}</span>
      </summary>
      <ul class="lista-restricciones">${htmlRestricciones(r)}</ul>
      ${r.trazas ? `<p class="ayuda-bloque">${esc(t('meCaeBien.trazas'))}: "${esc(r.trazas)}"</p>` : ''}
      <p class="ayuda-bloque">${esc(t('meCaeBien.avisoFijo'))}</p>
    </details>`;
}

function bloqueNota(resultado) {
  const { nota, provisional, procesamiento } = resultado;
  const nivel = NIVELES_PROCESAMIENTO.indexOf(procesamiento) + 1;
  const textoProcesamiento = procesamiento ? t(`procesamiento.${procesamiento}`) : t('resultado.sinDatos');

  // Solo con ingredientes no hay nota: se muestra el procesamiento.
  if (nota === null) {
    return `
      <section class="bloque-nota banda-provisional">
        <div>
          <p class="etiqueta-chica">${esc(t('resultado.calidad'))}</p>
          <p class="banda-nombre">${esc(t('resultado.sinNota'))}</p>
        </div>
        <div class="procesamiento">
          <p class="etiqueta-chica">${esc(t('resultado.procesamiento'))}</p>
          <div class="barritas" aria-hidden="true">${[1, 2, 3, 4].map((i) => `<span class="${i <= nivel ? 'lleno' : ''}"></span>`).join('')}</div>
          <p class="nivel">${esc(textoProcesamiento)}</p>
        </div>
      </section>`;
  }
  const rotulo = provisional ? `${t('resultado.calidad')} · ${t('resultado.provisional')}` : t('resultado.calidad');

  const barritas = [1, 2, 3, 4].map((i) => `<span class="${i <= nivel ? 'lleno' : ''}"></span>`).join('');
  const segmentos = Array.from({ length: 10 }, (_, i) => `<span class="${i < nota ? 'lleno' : ''}"></span>`).join('');

  return `
    <section class="bloque-nota ${claseBanda(nota, provisional)}"
      aria-label="${esc(`${rotulo}: ${nota} ${t('resultado.deDiez')}, ${nombreBanda(nota)}. ${t('resultado.procesamiento')}: ${textoProcesamiento}`)}">
      <div aria-hidden="true">
        <p class="etiqueta-chica">${esc(rotulo)}</p>
        <p class="numero-nota"><span class="grande">${esc(nota)}</span><span class="de-diez">/10</span></p>
        <p class="banda-nombre">${esc(nombreBanda(nota))}</p>
      </div>
      <div class="procesamiento" aria-hidden="true">
        <p class="etiqueta-chica">${esc(t('resultado.procesamiento'))}</p>
        <div class="barritas">${barritas}</div>
        <p class="nivel">${esc(textoProcesamiento)}</p>
      </div>
      <div class="segmentos" aria-hidden="true">${segmentos}</div>
    </section>`;
}

function bloqueLinea(resultado, textos) {
  const { linea } = resultado;
  if (!linea) return '';
  return `
    <div class="bloque-linea ${linea}">
      ${icono(iconoLinea[linea], 'lg')}
      <div>
        <strong>${esc(t(`lineas.${linea}`))}</strong>
        ${textos.motivoLinea ? `<p>${esc(textos.motivoLinea)}</p>` : ''}
      </div>
    </div>`;
}

function textoChip(chip) {
  return t(`chips.${chip.clave}`, { v: chip.valor == null ? '' : numero(chip.valor) });
}

function deUnVistazo(resultado) {
  if (resultado.deUnVistazo.length === 0) return '';
  const chips = resultado.deUnVistazo
    .map(
      (chip) => `
      <button type="button" class="chip ${chip.tipo} tocable" data-accion="abrir-etiqueta" data-clave="${esc(chip.clave)}" data-tipo="${esc(chip.tipo)}">
        ${icono(ICONO_CHIP[chip.tipo], 'sm')}${esc(textoChip(chip))}
      </button>`,
    )
    .join('');
  return `
    <h2 class="titulo-seccion"><span>${esc(t('resultado.deUnVistazo'))}</span><span>${esc(t('resultado.tocaParaSaber'))}</span></h2>
    <div class="chips">${chips}</div>`;
}

function sirvePara(resultado) {
  if (resultado.sirvePara.length === 0) return '';
  const chips = resultado.sirvePara
    .map(
      (clave) => `
      <button type="button" class="chip sirve tocable" data-accion="abrir-etiqueta" data-clave="${esc(clave)}" data-tipo="sirve">
        ${icono(iconoSirvePara[clave], 'sm')}${esc(t(`sirvePara.${clave}`))}${icono('info', 'sm')}
      </button>`,
    )
    .join('');
  return `
    <h2 class="titulo-seccion"><span>${esc(t('resultado.sirvePara'))}</span></h2>
    <div class="chips">${chips}</div>`;
}

function cuando(textos) {
  if (!textos.cuandoSi && !textos.cuandoNo) return '';
  const fila = (clase, iconoNombre, rotulo, texto) =>
    texto
      ? `<div class="${clase}">${icono(iconoNombre)}<div><p class="rotulo">${esc(rotulo)}</p><p>${esc(texto)}</p></div></div>`
      : '';
  return `
    <div class="tarjeta cuando">
      ${fila('si', 'tilde', t('resultado.cuandoSi'), textos.cuandoSi)}
      ${fila('no', 'prohibido', t('resultado.cuandoNo'), textos.cuandoNo)}
    </div>`;
}

function analisisCompleto(resultado, textos) {
  const r = textos.resumen ?? {};
  const filaResumen = (clase, rotulo, texto) =>
    texto ? `<dt class="${clase}">${esc(rotulo)}</dt><dd>${esc(texto)}</dd>` : '';
  // Si la nota es baja, lo malo va primero; si es buena, lo bueno.
  const malo = filaResumen('malo', t('resultado.maloPorque'), r.maloPorque);
  const bueno = filaResumen('bueno', t('resultado.buenoPorque'), r.buenoPorque);
  const filas = [
    ...(resultado.nota <= 4 ? [malo, bueno] : [bueno, malo]),
    filaResumen('', t('resultado.excesoDe'), r.excesoDe),
    filaResumen('', t('resultado.bajoEn'), r.bajoEn),
    filaResumen('bueno', t('resultado.loRescatable'), r.loRescatable),
  ].join('');

  const origen = (textos.deDondeViene ?? [])
    .map(
      (o) => `<div><p class="fila"><span>${esc(o.nombre)}</span><span>${esc(o.cantidad)}</span></p><p>${esc(o.texto)}</p></div>`,
    )
    .join('');

  const aporta = (textos.aporta ?? []).map((a) => `<p><strong>${esc(a.titulo)}:</strong> ${esc(a.texto)}</p>`).join('');

  const noSe = textos.noSePuedeSaber ?? [];

  return `
    <section class="analisis" aria-labelledby="titulo-analisis">
      <div class="manija" aria-hidden="true"></div>
      <div class="encabezado">
        <h2 id="titulo-analisis">${esc(t('resultado.analisisCompleto'))}</h2>
        <span class="nota-mini ${claseBanda(resultado.nota, resultado.provisional)}" aria-hidden="true">${esc(resultado.nota)}</span>
      </div>

      ${filas ? `<div><h3 class="titulo-seccion">${esc(t('resultado.resumen'))}</h3><dl class="resumen">${filas}</dl></div>` : ''}
      ${origen ? `<div><h3 class="titulo-seccion">${esc(t('resultado.deDondeViene'))}</h3><div class="origen">${origen}</div></div>` : ''}
      ${aporta ? `<div><h3 class="titulo-seccion">${esc(t('resultado.loQueAporta'))}</h3>${aporta}</div>` : ''}
      ${
        noSe.length > 0
          ? `<div class="caja-punteada">${icono('pregunta')}<div><strong>${esc(t('resultado.noSePuedeSaber'))}</strong><ul>${noSe.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`
          : ''
      }
      ${textos.sugerencia ? `<div class="caja-sugerencia"><strong>${esc(t('resultado.sugerencia'))}</strong><p>${esc(textos.sugerencia)}</p></div>` : ''}
      ${
        textos.dato
          ? `<div class="caja-dato"><p class="rotulo">${icono('lamparita', 'sm')}${esc(t('resultado.dato').toUpperCase())}</p><h3>${esc(textos.dato.titulo)}</h3><p>${esc(textos.dato.texto)}</p></div>`
          : ''
      }
      <button type="button" class="boton-secundario tocable" data-accion="no-coinciden">${icono('bandera', 'sm')}${esc(t('resultado.noCoinciden'))}</button>
    </section>`;
}

export function pantallaResultado(id) {
  const entrada = buscarEnHistorial(id);
  if (!entrada) {
    return `<div class="pantalla"><div class="en-construccion"><h1>${esc(t('resultado.noEncontrado'))}</h1><a class="boton-pastilla" href="#/">${esc(t('resultado.volver'))}</a></div></div>`;
  }
  const resultado = resultadoActual(entrada);
  const textos = textosEnIdioma(entrada.textos, idioma());

  return `
    <div class="pantalla" data-id="${esc(entrada.id)}">
      <header class="barra-superior">
        <a class="boton-redondo tocable" href="#/" aria-label="${esc(t('resultado.volver'))}">${icono('atras')}</a>
        <a class="boton-pastilla tocable" href="#/comparar/a/${encodeURIComponent(entrada.id)}">${icono('balanza', 'sm')}${esc(t('resultado.comparar'))}</a>
      </header>
      ${avisoParcial(resultado)}
      ${avisoRestricciones(entrada)}
      ${cabecera(entrada, textos)}
      ${bloqueNota(resultado)}
      ${textos.titular ? `<p class="titular">${esc(textos.titular)}</p>` : ''}
      ${bloqueLinea(resultado, textos)}
      ${deUnVistazo(resultado)}
      ${sirvePara(resultado)}
      ${cuando(textos)}
      ${resultado.nota === null ? '' : analisisCompleto(resultado, textos)}
    </div>`;
}

// Hoja para corregir el tipo de producto detectado ("Detecté: … · cambiar").
export function contenidoHojaCambiarTipo(id) {
  const entrada = buscarEnHistorial(id);
  if (!entrada) return '';
  const textos = textosEnIdioma(entrada.textos, idioma());
  const actual = textos.detectado || entrada.ficha.tipoDetectado || '';
  const opciones = CATEGORIAS.map(
    (c) => `<option value="${c}" ${c === entrada.ficha.categoria ? 'selected' : ''}>${esc(t(`categorias.${c}`))}</option>`,
  ).join('');
  return `
    <div class="manija" aria-hidden="true"></div>
    <div class="cabecera">
      <h2 id="hoja-titulo">${esc(t('resultado.cambiarTipoTitulo'))}</h2>
      <button type="button" class="boton-redondo tocable" data-accion="cerrar-hoja" aria-label="${esc(t('hoja.cerrar'))}">${icono('cruz')}</button>
    </div>
    <form class="formulario-tipo" data-formulario="tipo" data-id="${esc(id)}">
      <label class="rotulo-bloque" for="campo-tipo">${esc(t('resultado.queEs'))}</label>
      <input id="campo-tipo" class="campo-texto" name="tipo" value="${esc(actual)}" autocomplete="off" required />
      <label class="rotulo-bloque" for="campo-categoria">${esc(t('resultado.categoria'))}</label>
      <select id="campo-categoria" class="campo-texto" name="categoria">${opciones}</select>
      <p class="ayuda-bloque">${esc(t('resultado.categoriaAyuda'))}</p>
      <label class="fila-casilla">
        <input type="checkbox" name="reescribir" ${leerClave() ? 'checked' : 'disabled'} />
        <span>${esc(t('resultado.reescribir'))}</span>
      </label>
      <p class="mensaje-formulario" role="status" aria-live="polite"></p>
      <button type="submit" class="boton-principal tocable">${esc(t('ajustes.guardar'))}</button>
    </form>`;
}

// Guarda el tipo nuevo; si se pidió, Claude reescribe los textos. Devuelve una promesa.
export async function enviarCambioTipo(formulario) {
  const id = formulario.dataset.id;
  const tipo = formulario.tipo.value.trim();
  if (!tipo) return;
  actualizarFicha(id, { tipoDetectado: tipo, categoria: formulario.categoria.value, tipoDudoso: false });
  const entrada = buscarEnHistorial(id);
  // El tipo visible se corrige al instante, en el idioma actual.
  const textos = { ...(entrada.textos ?? {}) };
  textos[idioma()] = { ...(textos[idioma()] ?? {}), detectado: tipo };
  actualizarEntrada(id, { textos });

  if (formulario.reescribir.checked) {
    const mensaje = formulario.querySelector('.mensaje-formulario');
    const boton = formulario.querySelector('[type="submit"]');
    mensaje.textContent = t('resultado.reescribiendo');
    boton.disabled = true;
    try {
      const nuevos = await reescribirTextos(buscarEnHistorial(id));
      nuevos[idioma()] = { ...nuevos[idioma()], detectado: tipo };
      actualizarEntrada(id, { textos: nuevos });
    } catch (error) {
      mensaje.textContent = t(`analizar.error_${error.tipo ?? 'otro'}`);
      mensaje.classList.add('error');
      boton.disabled = false;
      throw error;
    }
  }
}

// Contenido de la hoja que se abre al tocar una etiqueta.
export function contenidoHojaEtiqueta(id, clave, tipo) {
  const entrada = buscarEnHistorial(id);
  const textos = textosEnIdioma(entrada?.textos, idioma());
  const propio = textos.etiquetas?.[clave] ?? {};
  const esSirve = tipo === 'sirve';
  const chip = entrada ? resultadoActual(entrada).deUnVistazo.find((c) => c.clave === clave) : null;
  const titulo = esSirve ? t(`sirvePara.${clave}`) : chip ? textoChip(chip) : clave;
  const iconoNombre = esSirve ? iconoSirvePara[clave] : ICONO_CHIP[tipo];
  const claseIcono = `tipo-${esSirve ? 'sirve' : tipo}`;

  return `
    <div class="manija" aria-hidden="true"></div>
    <div class="cabecera">
      <span class="icono-caja ${claseIcono}">${icono(iconoNombre)}</span>
      <h2 id="hoja-titulo">${esc(titulo)}</h2>
      <button type="button" class="boton-redondo tocable" data-accion="cerrar-hoja" aria-label="${esc(t('hoja.cerrar'))}">${icono('cruz')}</button>
    </div>
    <section><p class="rotulo">${esc(t('hoja.queSignifica'))}</p><p>${esc(t(`significados.${clave}`))}</p></section>
    ${propio.porQue ? `<section><p class="rotulo">${esc(t('hoja.porQue'))}</p><p>${esc(propio.porQue)}</p></section>` : ''}
    ${propio.paraVos ? `<section class="para-vos"><p class="rotulo">${esc(t('hoja.paraVos'))}</p><p>${esc(propio.paraVos)}</p></section>` : ''}
    <a class="link-guia tocable" href="#/guia">${icono('libro')}<span>${esc(t('hoja.leerMas'))}</span>${icono('derecha')}</a>`;
}
