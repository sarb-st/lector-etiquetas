// Achica las fotos en el teléfono antes de mandarlas: menos costo y menos espera.

const LADO_MAXIMO = 1500;
const CALIDAD_JPEG = 0.85;

function cargarImagen(archivo) {
  return new Promise((resolver, rechazar) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();
    imagen.onload = () => {
      URL.revokeObjectURL(url);
      resolver(imagen);
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      rechazar(new Error('foto_invalida'));
    };
    imagen.src = url;
  });
}

// Devuelve { base64, tipo, vistaPrevia } con la foto en JPEG de hasta 1500 px de lado.
export async function prepararFoto(archivo) {
  const imagen = await cargarImagen(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.naturalWidth, imagen.naturalHeight));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(imagen.naturalWidth * escala);
  lienzo.height = Math.round(imagen.naturalHeight * escala);
  lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  const dataUrl = lienzo.toDataURL('image/jpeg', CALIDAD_JPEG);
  return { base64: dataUrl.split(',')[1], tipo: 'image/jpeg', vistaPrevia: dataUrl };
}
