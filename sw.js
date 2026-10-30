// Service worker: deja que la app abra sin conexión (historial, perfil, Mis productos).
// - Archivos de la app: primero la red (así llegan las actualizaciones); sin red, la copia guardada.
// - Librerías y tipografías de internet: primero la copia guardada (no cambian, tienen versión fija).
// - Claude y Open Food Facts nunca se guardan: siempre van a la red.
// El nombre del caché es propio de esta app, porque usuario.github.io lo comparten todas.

const CACHE = 'lector-etiquetas-v4';
const EXTERNOS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['./', './index.html'])));
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c.startsWith('lector-etiquetas-') && c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

async function primeroLaRed(pedido) {
  const cache = await caches.open(CACHE);
  try {
    const respuesta = await fetch(pedido);
    if (respuesta.ok) cache.put(pedido, respuesta.clone());
    return respuesta;
  } catch (error) {
    const guardada = await cache.match(pedido, { ignoreSearch: true });
    if (guardada) return guardada;
    if (pedido.mode === 'navigate') return cache.match('./index.html');
    throw error;
  }
}

async function primeroLaCopia(pedido) {
  const cache = await caches.open(CACHE);
  const guardada = await cache.match(pedido);
  if (guardada) return guardada;
  const respuesta = await fetch(pedido);
  if (respuesta.ok || respuesta.type === 'opaque') cache.put(pedido, respuesta.clone());
  return respuesta;
}

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);
  if (url.origin === self.location.origin) {
    evento.respondWith(primeroLaRed(pedido));
  } else if (EXTERNOS.includes(url.hostname)) {
    evento.respondWith(primeroLaCopia(pedido));
  }
  // Todo lo demás (Claude, Open Food Facts) pasa directo a la red.
});
