import es from './es.js';
import en from './en.js';
import { leer, guardar } from '../datos/almacen.js';

const idiomas = { es, en };

let actual = leer('idioma') ?? (navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en');

export function idioma() {
  return actual;
}

export function cambiarIdioma(nuevo) {
  if (!idiomas[nuevo]) return;
  actual = nuevo;
  guardar('idioma', nuevo);
  document.documentElement.lang = nuevo;
}

const buscar = (clave, diccionario) => clave.split('.').reduce((o, parte) => o?.[parte], diccionario);

// Devuelve el valor tal cual (texto u objeto), o null si no existe.
export function texto(clave) {
  return buscar(clave, idiomas[actual]) ?? buscar(clave, es) ?? null;
}

// t('resultado.calidad') o t('chips.exceso_azucar', { v: 24 })
export function t(clave, valores = {}) {
  let texto = buscar(clave, idiomas[actual]) ?? buscar(clave, es) ?? clave;
  if (typeof texto !== 'string') return clave;
  for (const [nombre, valor] of Object.entries(valores)) {
    texto = texto.replaceAll(`{${nombre}}`, valor);
  }
  return texto;
}

// Números con la coma o el punto que corresponde al idioma.
export function numero(valor, decimales = 1) {
  return new Intl.NumberFormat(actual === 'es' ? 'es-AR' : 'en-US', { maximumFractionDigits: decimales }).format(valor);
}
