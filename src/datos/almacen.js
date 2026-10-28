// Guarda datos solo en el teléfono (localStorage del navegador).
// Todas las apps de usuario.github.io comparten el almacenamiento, así que
// cada clave lleva un prefijo propio de esta app.

const PREFIJO = 'lectorEtiquetas.v1.';

export function leer(clave) {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave);
    return crudo === null ? null : JSON.parse(crudo);
  } catch {
    return null;
  }
}

export function guardar(clave, valor) {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

// ---------- Perfil ----------

export function leerPerfil() {
  return leer('perfil');
}

export function guardarPerfil(perfil) {
  return guardar('perfil', perfil);
}

// ---------- Historial ----------
// Cada entrada: { id, fecha, ficha, resultado, textos, fuente }

export function leerHistorial() {
  return leer('historial') ?? [];
}

export function buscarEnHistorial(id) {
  return leerHistorial().find((entrada) => entrada.id === id) ?? null;
}

// Cambia datos de la ficha de un producto ya guardado (por ejemplo, el tamaño del envase).
export function actualizarFicha(id, cambios) {
  const historial = leerHistorial();
  const entrada = historial.find((e) => e.id === id);
  if (!entrada) return false;
  entrada.ficha = { ...entrada.ficha, ...cambios };
  return guardar('historial', historial);
}

// Cambia otros datos de un producto guardado (por ejemplo, los textos reescritos).
export function actualizarEntrada(id, cambios) {
  const historial = leerHistorial();
  const indice = historial.findIndex((e) => e.id === id);
  if (indice === -1) return false;
  historial[indice] = { ...historial[indice], ...cambios };
  return guardar('historial', historial);
}

export function agregarAlHistorial(entrada) {
  const historial = leerHistorial().filter((e) => e.id !== entrada.id);
  historial.unshift(entrada);
  return guardar('historial', historial);
}
