// Subir a Open Food Facts lo que la app leyó de un producto con fotos (con consentimiento).
// Solo se manda lo que OFF no tenía, para no pisar datos de otros; si la persona tocó
// "Los datos no coinciden con el envase", se corrige todo. Ver la definición, sección 12.
//
// Cada teléfono manda además un código anónimo propio (app_uuid), como pide Open Food Facts:
// si alguien sube datos malos, pueden frenar a ese teléfono sin bloquear toda la app.

import { CUENTA_OFF } from './off-cuenta.js';
import { leer, guardar, actualizarEntrada, buscarEnHistorial } from './almacen.js';

const BASE = 'https://world.openfoodfacts.org/cgi';
const APP = { app_name: 'LectorEtiquetas', app_version: '1.0' };

// Nutriente de la ficha → campo de Open Food Facts.
const CAMPOS_NUTRIENTES = {
  kcal: 'energy-kcal',
  grasa: 'fat',
  saturadas: 'saturated-fat',
  carbohidratos: 'carbohydrates',
  azucares: 'sugars',
  fibra: 'fiber',
  proteina: 'proteins',
  sal: 'salt',
};

// Qué foto va en qué lugar de la ficha de OFF (las etiquetas son de supermercados alemanes).
const CAMPOS_FOTOS = { frente: 'front_de', tabla: 'nutrition_de', ingredientes: 'ingredients_de' };

export const cuentaLista = () => Boolean(CUENTA_OFF.usuario && CUENTA_OFF.contrasena);

function codigoTelefono() {
  let id = leer('idTelefonoOFF');
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    guardar('idTelefonoOFF', id);
  }
  return id;
}

// Lo que se puede aportar. offPrevio: lo que OFF ya tenía (o null si el producto no estaba).
// corregir: true si la persona dijo que los datos de OFF no coinciden con el envase.
// Devuelve null si no hay nada para aportar.
export function aporteParaOFF({ codigo, ficha, fotos = {}, offPrevio = null, corregir = false }) {
  if (!codigo || !ficha) return null;
  const falta = (valor) => corregir || valor === null || valor === undefined || valor === '';
  const campos = {};

  if (!offPrevio && ficha.nombre) campos.product_name = ficha.nombre;
  if (ficha.contenidoEnvase && falta(offPrevio?.cantidad)) {
    campos.quantity = `${ficha.contenidoEnvase} ${ficha.esBebida ? 'ml' : 'g'}`;
  }
  let hayNutrientes = false;
  for (const [nuestro, deOFF] of Object.entries(CAMPOS_NUTRIENTES)) {
    const valor = ficha.nutrientes?.[nuestro];
    if (valor === null || valor === undefined || !falta(offPrevio?.nutrientes?.[nuestro])) continue;
    campos[`nutriment_${deOFF}`] = String(valor);
    campos[`nutriment_${deOFF}_unit`] = deOFF === 'energy-kcal' ? 'kcal' : 'g';
    hayNutrientes = true;
  }
  if (hayNutrientes) campos.nutrition_data_per = '100g';
  const ingredientes = ficha.ingredientes?.map((i) => i.texto).join(', ');
  if (ingredientes && falta(offPrevio?.ingredientes)) campos.ingredients_text_de = ingredientes;

  const imagenes = Object.entries(CAMPOS_FOTOS)
    .filter(([clave]) => fotos[clave]?.base64)
    .map(([clave, campo]) => ({ campo, foto: fotos[clave] }));

  if (!Object.keys(campos).length && !imagenes.length) return null;
  return { codigo, campos, imagenes };
}

function aBlob({ base64, tipo }) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: tipo || 'image/jpeg' });
}

async function subir(aporte) {
  const comunes = {
    code: aporte.codigo,
    user_id: CUENTA_OFF.usuario,
    password: CUENTA_OFF.contrasena,
    app_uuid: codigoTelefono(),
    ...APP,
  };
  if (Object.keys(aporte.campos).length) {
    const r = await fetch(`${BASE}/product_jqm2.pl`, { method: 'POST', body: new URLSearchParams({ ...comunes, ...aporte.campos }) });
    const json = await r.json();
    if (json.status !== 1) throw new Error(json.status_verbose || 'Open Food Facts rechazó los datos');
  }
  for (const { campo, foto } of aporte.imagenes) {
    const formulario = new FormData();
    for (const [k, v] of Object.entries(comunes)) formulario.append(k, v);
    formulario.append('imagefield', campo);
    formulario.append(`imgupload_${campo}`, aBlob(foto), `${campo}.jpg`);
    // Una foto que OFF ya tenía igual no es un error: se sigue con la próxima.
    await fetch(`${BASE}/product_image_upload.pl`, { method: 'POST', body: formulario }).catch(() => null);
  }
}

// Aportes esperando la respuesta de la persona (la primera vez se le pregunta).
const pendientes = new Map();

export function guardarAportePendiente(id, aporte) {
  pendientes.set(id, aporte);
}
export const hayAportePendiente = (id) => pendientes.has(id);
export function descartarAporte(id) {
  pendientes.delete(id);
}

// Sube el aporte de un producto y anota cómo salió en su entrada del historial:
// compartidoOFF = 'subiendo' | 'si' | 'error'. Avisa con "entrada-actualizada".
export async function compartirConOFF(id) {
  const aporte = pendientes.get(id);
  if (!aporte || !cuentaLista()) return;
  pendientes.delete(id);
  const avisar = () => window.dispatchEvent(new CustomEvent('entrada-actualizada', { detail: { id } }));
  actualizarEntrada(id, { compartidoOFF: 'subiendo' });
  avisar();
  try {
    await subir(aporte);
    if (buscarEnHistorial(id)) actualizarEntrada(id, { compartidoOFF: 'si' });
  } catch {
    if (buscarEnHistorial(id)) actualizarEntrada(id, { compartidoOFF: 'error' });
  }
  avisar();
}
