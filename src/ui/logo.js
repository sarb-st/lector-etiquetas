// Logo animado, a partir de los dibujos definitivos de docs/logo/ (ver docs/animaciones.md).
// Marco de escaneo + línea de escaneo + tres objetos (tetrapack → pera → muffin).
// Todos los trazos llevan pathLength="1": así "dibujar" y "borrar" funcionan igual
// en cualquier dibujo, sin importar cuánto mide cada línea.
//
// La bienvenida de index.html tiene una copia fija de este mismo dibujo, para que
// aparezca al instante, antes de que cargue el resto de la app.

// Cada esquina del marco (marco.svg) partida en dos mitades que salen desde su centro,
// así se dibujan "desde el centro de cada esquina hacia afuera".
const MITADES_ESQUINA = ['M12 12 Q10 14 10 18 V28', 'M12 12 Q14 10 18 10 H28'];
const ESPEJOS = ['', 'matrix(-1 0 0 1 100 0)', 'matrix(1 0 0 -1 0 100)', 'matrix(-1 0 0 -1 100 100)'];

const OBJETOS = {
  tetrapack: ['M37 74 V44 L43 35 H57 L63 44 V74 Z', 'M43 35 V29 H57 V35', 'M37 44 H63'],
  pera: [
    'M50 39 C44 39 43 44 42 49 C41 54 35 57 35 65 C35 71 41 75 50 75 C59 75 65 71 65 65 C65 57 59 54 58 49 C57 44 56 39 50 39 Z',
    'M50 39 C49 35 47 33 44 32',
    'M51 37 C51 31 55 28 61 28 C61 33 57 36 51 37 Z',
    'M60 59 L60 59 M60 63 C60 67 58 69 55 70',
  ],
  muffin: [
    'M34 57 H66 L61 75 H39 Z',
    'M45 61 L46 71 M55 61 L54 71',
    'M34 57 C29 57 29 49 35 48 C34 41 41 38 45 41 C47 37 53 37 55 41 C59 38 66 41 65 48 C71 49 71 57 66 57',
    'M50 32 A3.5 3.5 0 1 0 50.01 32',
    'M42 50 L43 49 M50 46 L52 46 M58 50 L59 51',
  ],
};

const trazo = (d) => `<path d="${d}" pathLength="1"/>`;

// clase: "logo-bienvenida" o "logo-carga" (cambia la coreografía, no el dibujo).
export function logoAnimado(clase) {
  const esquinas = ESPEJOS.map(
    (espejo) => `<g${espejo ? ` transform="${espejo}"` : ''}>${MITADES_ESQUINA.map(trazo).join('')}</g>`,
  ).join('');
  const objetos = Object.entries(OBJETOS)
    .map(([nombre, trazos]) => `<g class="objeto ${nombre}">${trazos.map(trazo).join('')}</g>`)
    .join('');
  return `
    <svg class="logo-animado ${clase}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g class="marco">${esquinas}</g>
      <line class="escaneo" x1="18" x2="82" y1="0" y2="0" />
      ${objetos}
    </svg>`;
}
