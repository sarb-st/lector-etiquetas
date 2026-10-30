// Diagnóstico de conexión: prueba por separado cada paso que necesita un análisis,
// para saber cuál falla en un teléfono. Ninguna prueba gasta saldo.

import { leerClave } from '../pantallas/ajustes.js';
import { limpiarClave, probarClave } from './cliente.js';

const API = 'https://api.anthropic.com/v1/models';

async function medir(nombre, prueba) {
  const inicio = performance.now();
  try {
    const detalle = await prueba();
    return { nombre, ok: true, detalle, ms: Math.round(performance.now() - inicio) };
  } catch (error) {
    const causa = error?.cause ? ` · causa: ${error.cause?.name ?? ''} ${error.cause?.message ?? error.cause}` : '';
    return { nombre, ok: false, detalle: `${error?.name ?? 'Error'}: ${error?.message ?? error}${causa}`, ms: Math.round(performance.now() - inicio) };
  }
}

// Devuelve la lista de pruebas con su resultado.
export async function diagnosticar() {
  const clave = limpiarClave(leerClave());
  const resultados = [];

  // 1. Internet en general (Open Food Facts).
  resultados.push(
    await medir('internet', async () => {
      const r = await fetch('https://world.openfoodfacts.org/api/v2/product/3017620422003.json?fields=code');
      return `HTTP ${r.status}`;
    }),
  );

  // 2. Llegar a Claude sin clave: tiene que contestar "HTTP 401" (falta la clave).
  //    Si falla acá, algo del teléfono o de la red bloquea a Claude.
  resultados.push(
    await medir('claude_simple', async () => {
      const r = await fetch(API, {
        headers: { 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      });
      return `HTTP ${r.status}`;
    }),
  );

  // 3. Llegar a Claude con los encabezados mínimos y la clave, sin la librería.
  if (clave) {
    resultados.push(
      await medir('claude_clave', async () => {
        const r = await fetch(API, {
          headers: {
            'x-api-key': clave,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
        });
        return `HTTP ${r.status}`;
      }),
    );

    // 4. Lo mismo, pero con la librería oficial (como en un análisis).
    resultados.push(
      await medir('claude_libreria', async () => {
        const { modelo } = await probarClave();
        return modelo;
      }),
    );
  }

  return {
    resultados,
    navegador: navigator.userAgent,
    instalada: window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true,
  };
}
