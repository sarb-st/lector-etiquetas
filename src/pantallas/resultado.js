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
  fotoProducto,
} from '../ui/comunes.js';
import { buscarEnOpenFoodFacts } from '../datos/open-food-facts.js';
import { buscarEnHistorial, actualizarFicha, actualizarEntrada } from '../datos/almacen.js';
import { CATEGORIAS } from '../puntaje/reglas.js';
import { leerClave } from './ajustes.js';
import { reescribirTextos } from '../ia/analisis.js';
import { porcionDe } from '../puntaje/derivados.js';
import { partesAzucar, partesGrasa, cucharaditas } from '../puntaje/composicion.js';
import { tipoSugerencia, mejorasSugeridas } from '../puntaje/sugerencia.js';
import { htmlRestricciones, nombreRestriccion } from './me-cae-bien.js';

const NIVELES_PROCESAMIENTO = ['natural', 'minimo', 'procesado', 'ultra'];
const ICONO_CHIP = { exceso: 'alerta', flojo: 'menos', bueno: 'mas' };

function cabecera(entrada, textos) {
  const { ficha } = entrada;
  const n = ficha.nutrientes;
  const unidad = ficha.esBebida ? t('resultado.por100ml') : t('resultado.por100g');
  const detectado = textos.detectado || ficha.tipoDetectado;
  return `
    <div class="producto-cabecera">
      ${fotoProducto(entrada)}
      <div>
        <h1>${esc(ficha.nombre)}</h1>
        ${detectado ? `<p class="meta">${esc(t('resultado.detecte'))} ${esc(detectado)} · <button type="button" data-accion="cambiar-tipo">${esc(t('resultado.cambiar'))}</button></p>` : ''}
        ${n?.kcal != null ? `<p class="meta">${esc(unidad)} · ${esc(numero(n.kcal, 0))} ${esc(t('resultado.kcal'))}</p>` : ''}
      </div>
    </div>
    ${marcaFuente(entrada)}`;
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

// Etiquetas en tres bloques (excesos, puntos flojos, puntos buenos), dos por renglón.
// Un bloque sin etiquetas no aparece.
function deUnVistazo(resultado) {
  if (resultado.deUnVistazo.length === 0) return '';
  const boton = (chip) => `
    <button type="button" class="chip ${chip.tipo} tocable" data-accion="abrir-etiqueta" data-clave="${esc(chip.clave)}" data-tipo="${esc(chip.tipo)}">
      ${icono(ICONO_CHIP[chip.tipo], 'sm')}<span>${esc(textoChip(chip))}</span>
    </button>`;
  const grupos = ['exceso', 'flojo', 'bueno']
    .map((tipo) => resultado.deUnVistazo.filter((c) => c.tipo === tipo))
    .filter((grupo) => grupo.length > 0)
    .map((grupo) => `<div class="grupo-chips ${grupo.length === 1 ? 'solo' : ''}">${grupo.map(boton).join('')}</div>`)
    .join('');
  return `
    <h2 class="titulo-seccion"><span>${esc(t('resultado.deUnVistazo'))}</span><span>${esc(t('resultado.tocaParaSaber'))}</span></h2>
    <div class="grupos-chips">${grupos}</div>`;
}

// "Qué buscar" armado con las etiquetas del producto, para cuando no hay texto escrito.
function textoBuscarGenerico(resultado) {
  const mejoras = mejorasSugeridas(resultado).map((m) => t(`resultado.mejora_${m}`));
  if (mejoras.length === 0) return t('resultado.buscarSinDatos', { nota: resultado.nota });
  return t('resultado.buscarGenerico', { mejoras: mejoras.join(t('resultado.y')) });
}

// Cierre de la pantalla principal: qué buscar en su lugar o, si el producto ya es
// una buena elección, que lo diga (definición, sección 7.2).
function bloqueSugerencia(textos, resultado) {
  // Qué bloque va lo decide la nota: menos de 8, recomendar; 8 o más, felicitar.
  const tipo = tipoSugerencia(resultado.nota);
  if (!tipo) return '';
  let sugerencia = textos.sugerencia;
  // Análisis viejos: la sugerencia era solo un texto.
  if (typeof sugerencia === 'string') sugerencia = { tipo: 'buscar', texto: sugerencia };
  // Si el texto guardado no corresponde al tipo decidido (o falta), se arma uno con los datos.
  if (!sugerencia?.texto || sugerencia.tipo !== tipo) {
    sugerencia = { tipo, texto: tipo === 'ya_es_bueno' ? t('resultado.yaEsBuenoGenerico') : textoBuscarGenerico(resultado) };
  }

  const esBueno = sugerencia.tipo === 'ya_es_bueno';
  return `
    <section class="bloque-sugerencia ${esBueno ? 'ya-es-bueno' : ''}">
      <p class="etiqueta-chica">${icono(esBueno ? 'tilde' : 'lupa', 'sm')}${esc(t(esBueno ? 'resultado.yaEsBueno' : 'resultado.sugerencia'))}</p>
      <p class="texto">${esc(sugerencia.texto)}</p>
    </section>`;
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

// Una tarjeta del análisis completo, con ícono y título.
function tarjetaAnalisis(iconoNombre, titulo, contenido) {
  return `
    <section class="tarjeta-analisis">
      <h3 class="titulo-tarjeta">${icono(iconoNombre, 'sm')}${esc(titulo)}</h3>
      ${contenido}
    </section>`;
}

// De qué nutriente habla cada tarjeta de "De dónde viene". Los análisis nuevos lo
// traen marcado; en los viejos se deduce del nombre.
function tipoNutriente(o) {
  if (o.nutriente && o.nutriente !== 'otro') return o.nutriente;
  const nombre = (o.nombre ?? '').toLowerCase();
  if (/az[uú]car|sugar/.test(nombre)) return 'azucar';
  if (/gras|fat/.test(nombre)) return 'grasas';
  if (/fibr/.test(nombre)) return 'fibra';
  return 'otro';
}

// Barra dividida en dos tonos de azul, con las palabras debajo de cada parte (sin leyendas).
function barraComposicion(partes, descripcion) {
  const visibles = partes.filter((p) => p.valor > 0);
  const tramos = visibles.map((p) => `<span class="tramo ${p.tono}" style="flex-grow: ${p.valor}"></span>`).join('');
  const rotulos = visibles.map((p) => `<span class="${p.tono}">${esc(p.texto)}</span>`).join('');
  return `
    <div class="barra-composicion" role="img" aria-label="${esc(descripcion)}">
      <div class="pista-barra" aria-hidden="true">${tramos}</div>
      <div class="rotulos-barra ${visibles.length === 1 ? 'uno' : ''}" aria-hidden="true">${rotulos}</div>
    </div>`;
}

function detalleAzucar(ficha) {
  const a = partesAzucar(ficha);
  let html = '';
  if (a?.desconocido) {
    html += `<p class="sin-barra">${esc(t(`composicion.${a.desconocido}`))}</p>`;
  } else if (a) {
    const partes =
      a.agregado === 0
        ? [{ valor: a.propio, tono: 'suave', texto: t('composicion.todoPropio') }]
        : a.propio === 0
          ? [{ valor: a.agregado, tono: 'fuerte', texto: t('composicion.todoAgregado') }]
          : [
              { valor: a.agregado, tono: 'fuerte', texto: t('composicion.agregado', { v: numero(a.agregado, 0) }) },
              { valor: a.propio, tono: 'suave', texto: t('composicion.propio', { v: numero(a.propio, 0) }) },
            ];
    html += barraComposicion(partes, partes.map((p) => p.texto).join(', '));
    if (a.estimado) html += `<p class="nota-estimado">${esc(t('composicion.estimado'))}</p>`;
  }
  const c = cucharaditas(ficha);
  if (c) {
    const unidad = t(c.cantidad === 1 ? 'composicion.cucharadita' : 'composicion.cucharaditas');
    html += `
      <p class="cucharaditas">
        ${icono('cuchara')}
        <strong>≈ ${esc(c.cantidad)}</strong>
        <span>${esc(unidad)}<br />${esc(t(`composicion.en_${c.en}`, { v: numero(c.porcionGramos ?? 0, 0) }))}</span>
      </p>`;
  }
  return html;
}

function detalleGrasas(ficha) {
  const g = partesGrasa(ficha);
  if (!g) return '';
  const partes = [
    { valor: g.saturadas, tono: 'fuerte', texto: t('composicion.saturadas', { v: numero(g.saturadas) }) },
    { valor: g.insaturadas, tono: 'suave', texto: t('composicion.insaturadas', { v: numero(g.insaturadas) }) },
  ];
  return barraComposicion(partes, partes.map((p) => p.texto).join(', '));
}

// Análisis completo: una hoja que se asoma abajo al llegar al final y se abre hacia arriba.
function analisisCompleto(resultado, textos, ficha) {
  const r = textos.resumen ?? {};
  const bloque = (clase, rotulo, texto) =>
    texto ? `<div class="bloque-resumen ${clase}"><p class="rotulo">${esc(rotulo)}</p><p>${esc(texto)}</p></div>` : '';
  // Si la nota es baja, lo malo va primero; si es buena, lo bueno.
  const malo = bloque('malo', t('resultado.maloPorque'), r.maloPorque);
  const bueno = bloque('bueno', t('resultado.buenoPorque'), r.buenoPorque);
  const resumen = [
    ...(resultado.nota <= 4 ? [malo, bueno] : [bueno, malo]),
    bloque('exceso', t('resultado.excesoDe'), r.excesoDe),
    bloque('bajo', t('resultado.bajoEn'), r.bajoEn),
    bloque('bueno', t('resultado.loRescatable'), r.loRescatable),
  ].join('');

  const origen = (textos.deDondeViene ?? [])
    .map((o) => {
      const tipo = tipoNutriente(o);
      const extra = tipo === 'azucar' ? detalleAzucar(ficha) : tipo === 'grasas' ? detalleGrasas(ficha) : '';
      return `
      <div class="mini-origen">
        <p class="rotulo">${esc(o.nombre)}</p>
        <p class="cantidad">${esc(o.cantidad)}</p>
        ${extra}
        <p>${esc(o.texto)}</p>
      </div>`;
    })
    .join('');

  const aporta = (textos.aporta ?? [])
    .map((a) => `<li><strong>${esc(a.titulo)}</strong><span>${esc(a.texto)}</span></li>`)
    .join('');

  const noSe = textos.noSePuedeSaber ?? [];

  const cuerpo = `
    ${resumen ? tarjetaAnalisis('portapapeles', t('resultado.resumen'), `<div class="bloques-resumen">${resumen}</div>`) : ''}
    ${origen ? tarjetaAnalisis('capas', t('resultado.deDondeViene'), `<div class="grilla-origen">${origen}</div>`) : ''}
    ${aporta ? tarjetaAnalisis('hojaVerde', t('resultado.loQueAporta'), `<ul class="lista-aporta">${aporta}</ul>`) : ''}
    ${
      noSe.length > 0
        ? `<div class="caja-punteada">${icono('pregunta')}<div><strong>${esc(t('resultado.noSePuedeSaber'))}</strong><ul>${noSe.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`
        : ''
    }
    ${
      textos.dato
        ? `<div class="caja-dato"><p class="rotulo">${icono('lamparita', 'sm')}${esc(t('resultado.dato').toUpperCase())}</p><h3>${esc(textos.dato.titulo)}</h3><p>${esc(textos.dato.texto)}</p></div>`
        : ''
    }
    <button type="button" class="boton-secundario tocable" data-accion="no-coinciden">${icono('bandera', 'sm')}${esc(t('resultado.noCoinciden'))}</button>`;

  // Va fuera de la pantalla (no dentro de ella) para que quede fija a la ventana
  // aunque la pantalla esté haciendo su animación de entrada.
  return `
    <div class="velo-analisis" data-accion="cerrar-analisis" aria-hidden="true"></div>
    <section class="hoja-analisis" data-estado="oculta" aria-labelledby="titulo-analisis">
      <button type="button" class="pestana-analisis" data-accion="alternar-analisis" aria-expanded="false" aria-controls="cuerpo-analisis">
        <span class="manija" aria-hidden="true"></span>
        <span class="fila">
          <span class="titulos">
            <strong id="titulo-analisis">${esc(t('resultado.analisisCompleto'))}</strong>
            <span class="pista visualmente-oculto">${esc(t('resultado.deslizaArriba'))}</span>
          </span>
          <span class="flecha" aria-hidden="true">${icono('arriba')}</span>
        </span>
      </button>
      <div class="cuerpo-analisis" id="cuerpo-analisis">${cuerpo}</div>
    </section>`;
}

// ---------- Comportamiento de la hoja del análisis completo ----------

let vigilarFinal = null;

function estadoHoja(hoja, estado) {
  hoja.dataset.estado = estado;
  const abierta = estado === 'abierta';
  hoja.querySelector('.pestana-analisis').setAttribute('aria-expanded', String(abierta));
  hoja.querySelector('.pista').hidden = abierta;
  document.querySelector('.velo-analisis')?.classList.toggle('visible', abierta);
  document.body.style.overflow = abierta ? 'hidden' : '';
  if (abierta) hoja.querySelector('.cuerpo-analisis').scrollTop = 0;
}

export function alternarAnalisis(abrir) {
  const hoja = document.querySelector('.hoja-analisis');
  if (!hoja) return;
  const abierta = hoja.dataset.estado === 'abierta';
  const quiereAbrir = abrir ?? !abierta;
  // Al cerrar vuelve a quedar asomada (se está al final de la pantalla).
  estadoHoja(hoja, quiereAbrir ? 'abierta' : 'asomada');
}

// Arrastrar la pestaña: hacia arriba abre, hacia abajo cierra. Un toque también alterna.
function activarArrastre(hoja) {
  const pestana = hoja.querySelector('.pestana-analisis');
  let inicioY = null;
  let movio = false;
  pestana.addEventListener('pointerdown', (e) => {
    inicioY = e.clientY;
    movio = false;
    hoja.classList.add('arrastrando');
    pestana.setPointerCapture(e.pointerId);
  });
  pestana.addEventListener('pointermove', (e) => {
    if (inicioY === null) return;
    const dy = e.clientY - inicioY;
    if (Math.abs(dy) > 6) movio = true;
    const abierta = hoja.dataset.estado === 'abierta';
    // Sigue al dedo, sin pasarse de abierta ni de asomada.
    const desplazamiento = abierta ? Math.max(0, dy) : Math.min(0, dy);
    hoja.style.setProperty('--arrastre', `${desplazamiento}px`);
  });
  const soltar = (e) => {
    if (inicioY === null) return;
    const dy = e.clientY - inicioY;
    inicioY = null;
    hoja.classList.remove('arrastrando');
    hoja.style.removeProperty('--arrastre');
    if (!movio) return; // fue un toque: lo maneja el clic
    if (dy < -50) estadoHoja(hoja, 'abierta');
    else if (dy > 50) estadoHoja(hoja, 'asomada');
  };
  pestana.addEventListener('pointerup', soltar);
  pestana.addEventListener('pointercancel', soltar);
  // Si se arrastró, no se cuenta además como toque.
  pestana.addEventListener(
    'click',
    (e) => {
      if (movio) {
        e.stopPropagation();
        movio = false;
      }
    },
    true,
  );
}

// Se llama después de dibujar el resultado.
export function montarResultado(raiz) {
  if (vigilarFinal) window.removeEventListener('scroll', vigilarFinal);
  document.body.style.overflow = '';
  const hoja = raiz.querySelector('.hoja-analisis');
  const centinela = raiz.querySelector('.centinela-analisis');
  if (hoja && centinela) {
    activarArrastre(hoja);
    // Asoma exactamente la pestaña (manija y título), sin dejar ver nada de lo que hay debajo.
    hoja.style.setProperty('--asomada', `${hoja.querySelector('.pestana-analisis').offsetHeight}px`);
    // La pestaña se asoma cuando el final de la pantalla principal entra en la ventana.
    vigilarFinal = () => {
      if (!document.body.contains(centinela)) {
        window.removeEventListener('scroll', vigilarFinal);
        return;
      }
      if (hoja.dataset.estado === 'abierta') return;
      const llego = centinela.getBoundingClientRect().top < window.innerHeight;
      const quiere = llego ? 'asomada' : 'oculta';
      if (hoja.dataset.estado !== quiere) estadoHoja(hoja, quiere);
    };
    window.addEventListener('scroll', vigilarFinal, { passive: true });
    vigilarFinal();
  }
  completarFoto(raiz);
}

// Productos de Open Food Facts analizados antes de que la app guardara la foto: se busca una vez.
async function completarFoto(raiz) {
  const id = raiz.querySelector('[data-id]')?.dataset.id;
  const entrada = id ? buscarEnHistorial(id) : null;
  if (!entrada?.codigo || entrada.imagen || entrada.imagenBuscada) return;
  const encontrado = await buscarEnOpenFoodFacts(entrada.codigo).catch(() => null);
  const imagen = encontrado?.datos.imagen ?? null;
  actualizarEntrada(id, { imagen, imagenBuscada: true });
  const caja = imagen && raiz.querySelector('.producto-cabecera .producto-foto');
  if (caja && raiz.contains(caja)) caja.outerHTML = fotoProducto({ ...entrada, imagen });
}

export function pantallaResultado(id) {
  const entrada = buscarEnHistorial(id);
  if (!entrada) {
    return `<div class="pantalla"><div class="en-construccion"><h1>${esc(t('resultado.noEncontrado'))}</h1><a class="boton-pastilla" href="#/">${esc(t('resultado.volver'))}</a></div></div>`;
  }
  const resultado = resultadoActual(entrada);
  const textos = textosEnIdioma(entrada.textos, idioma());

  return `
    <div class="pantalla pantalla-resultado" data-id="${esc(entrada.id)}">
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
      ${bloqueEnvase(entrada)}
      ${deUnVistazo(resultado)}
      ${sirvePara(resultado)}
      ${cuando(textos)}
      ${bloqueSugerencia(textos, resultado)}
      ${resultado.nota === null ? '' : '<div class="centinela-analisis" aria-hidden="true"></div>'}
    </div>
    ${resultado.nota === null ? '' : analisisCompleto(resultado, textos, entrada.ficha)}`;
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
