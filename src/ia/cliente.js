// Conexión con la API de Claude, directo desde el teléfono con la clave del usuario.
// Usa la librería oficial de Anthropic, cargada una sola vez y en una versión fija.

import { leer, guardar } from '../datos/almacen.js';
import { leerAjustes, leerClave, MODELOS } from '../pantallas/ajustes.js';

const URL_SDK = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.134.0/+esm';

// Precio en dólares por millón de tokens (consultado el 28/10/2026).
const PRECIOS = {
  'claude-sonnet-5-5': { entrada: 2, salida: 10, cacheLectura: 0.2 },
  'claude-haiku-5-5': { entrada: 0.1, salida: 0.5, cacheLectura: 0.01 },
};

// Saca espacios y caracteres invisibles que a veces se pegan junto con la clave
// (por ejemplo, al copiarla desde Notas en el iPhone).
export function limpiarClave(valor) {
  return String(valor ?? '').replace(/[\s ​-‍⁠﻿]/g, '');
}

export function claveValida(valor) {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(valor);
}

let sdk = null;
async function cliente() {
  const clave = limpiarClave(leerClave());
  if (!clave) throw new ErrorIA('sin_clave');
  if (!claveValida(clave)) throw new ErrorIA('clave_invalida', 'formato');
  if (!sdk) {
    try {
      sdk = (await import(URL_SDK)).default;
    } catch (error) {
      throw new ErrorIA('conexion', `No se pudo cargar la librería de Claude: ${error?.message ?? error}`);
    }
  }
  // La clave es del propio usuario y vive solo en su teléfono: por eso se permite
  // llamar desde el navegador.
  return new sdk({ apiKey: clave, dangerouslyAllowBrowser: true, maxRetries: 2 });
}

export class ErrorIA extends Error {
  // tipo: sin_clave | clave_invalida | sin_saldo | ocupado | conexion | rechazo | incompleto | otro
  // detalle: texto técnico para diagnosticar (se muestra chico en la pantalla de error).
  constructor(tipo, detalle = '') {
    super(detalle || tipo);
    this.tipo = tipo;
    this.detalle = detalle;
  }
}

function costoEnDolares(modelo, usage) {
  const p = PRECIOS[modelo];
  if (!p || !usage) return 0;
  const entrada = (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0);
  const cache = usage.cache_read_input_tokens ?? 0;
  return (entrada * p.entrada + cache * p.cacheLectura + (usage.output_tokens ?? 0) * p.salida) / 1_000_000;
}

function sumarGasto(usd) {
  const mes = new Date().toISOString().slice(0, 7);
  const gasto = leer('gasto');
  const anterior = gasto?.mes === mes ? gasto.usd : 0;
  guardar('gasto', { mes, usd: anterior + usd });
}

// Texto técnico del error, con su causa, para poder diagnosticar desde la pantalla.
function detalleTecnico(error) {
  const partes = [`${error?.name ?? 'Error'}: ${error?.message ?? error}`];
  if (error?.status) partes.unshift(`HTTP ${error.status}`);
  if (error?.cause) partes.push(`causa: ${error.cause?.name ?? ''} ${error.cause?.message ?? error.cause}`.trim());
  return partes.join(' · ');
}

function traducirError(error) {
  const estado = error?.status;
  const mensaje = String(error?.message ?? '').toLowerCase();
  const detalle = detalleTecnico(error);
  if (estado === 401 || estado === 403) return new ErrorIA('clave_invalida', detalle);
  if (estado === 400 && mensaje.includes('credit balance')) return new ErrorIA('sin_saldo', detalle);
  if (estado === 429 || estado === 529 || (estado >= 500 && estado < 600)) return new ErrorIA('ocupado', detalle);
  if (!estado) return new ErrorIA('conexion', detalle);
  return new ErrorIA('otro', detalle);
}

// Pedido mínimo y gratis para comprobar que la clave y la conexión funcionan.
export async function probarClave() {
  const api = await cliente();
  const { modelo: claveModelo } = leerAjustes();
  const modelo = MODELOS[claveModelo]?.id ?? MODELOS.preciso.id;
  try {
    await api.models.retrieve(modelo);
    return { modelo };
  } catch (error) {
    throw traducirError(error);
  }
}

// Hace un pedido que devuelve JSON con la forma del esquema.
// contenido: lista de bloques (texto e imágenes) del mensaje del usuario.
export async function pedirJSON({ sistema, contenido, esquema, esfuerzo = 'medium', maxTokens = 16000 }) {
  const api = await cliente();
  const { modelo: claveModelo } = leerAjustes();
  const modelo = MODELOS[claveModelo]?.id ?? MODELOS.preciso.id;

  const pedido = {
    model: modelo,
    max_tokens: maxTokens,
    system: sistema,
    messages: [{ role: 'user', content: contenido }],
    output_config: { effort: esfuerzo, format: { type: 'json_schema', schema: esquema } },
  };

  let respuesta;
  try {
    if (modelo === 'claude-sonnet-5-5') {
      // Si un filtro de seguridad rechaza el pedido por error, la API lo reintenta
      // sola con otro modelo en el mismo llamado.
      respuesta = await api.beta.messages.create({
        ...pedido,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      });
    } else {
      respuesta = await api.messages.create(pedido);
    }
  } catch (error) {
    throw traducirError(error);
  }

  const costo = costoEnDolares(respuesta.model ?? modelo, respuesta.usage);
  sumarGasto(costo);

  if (respuesta.stop_reason === 'refusal') throw new ErrorIA('rechazo');
  if (respuesta.stop_reason === 'max_tokens') throw new ErrorIA('incompleto');

  const texto = respuesta.content.find((b) => b.type === 'text')?.text;
  try {
    return { datos: JSON.parse(texto), costo };
  } catch {
    throw new ErrorIA('incompleto');
  }
}
