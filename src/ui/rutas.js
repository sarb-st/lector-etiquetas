// Navegación entre pantallas sin cambiar la dirección de la página.
// En el iPhone, una app instalada en la pantalla de inicio olvida el permiso de la cámara
// cada vez que cambia la dirección (el "#/..."). Por eso la pantalla actual se guarda acá
// y en el historial del navegador (history.state), y la dirección queda siempre igual.
// El "atrás" sigue funcionando, y al recargar se vuelve a la misma pantalla.
// Los enlaces siguen escritos como href="#/...": app.js los intercepta.

const DIRECCION = location.pathname + location.search;

const limpiar = (ruta) => {
  const r = String(ruta ?? '').replace(/^#/, '');
  return r.startsWith('/') ? r : '/';
};

// Al abrir: la pantalla guardada (si se recargó) o la de un enlace viejo con "#/...".
let actual = limpiar(history.state?.ruta ?? (location.hash || '/'));
history.replaceState({ ruta: actual }, '', DIRECCION);

export const rutaActual = () => actual;
export const enRuta = (ruta) => actual === limpiar(ruta);

// Avisa a app.js que tiene que dibujar la pantalla actual.
export function redibujarRuta() {
  window.dispatchEvent(new Event('cambio-de-ruta'));
}

// Ir a otra pantalla (suma un paso al "atrás"). Si ya está ahí, la vuelve a dibujar.
export function irA(ruta) {
  const nueva = limpiar(ruta);
  if (nueva !== actual) {
    actual = nueva;
    history.pushState({ ruta: actual }, '', DIRECCION);
  }
  redibujarRuta();
}

// Cambiar la pantalla anotada sin dibujar ni sumar un paso al "atrás".
export function reemplazarRuta(ruta) {
  actual = limpiar(ruta);
  history.replaceState({ ruta: actual }, '', DIRECCION);
}

// El "atrás" del navegador o del gesto.
window.addEventListener('popstate', (evento) => {
  actual = limpiar(evento.state?.ruta ?? '/');
  redibujarRuta();
});
