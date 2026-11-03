// Ilustraciones de los alimentos sin código (BLS), en el estilo del logo: trazo redondeado,
// sin relleno, en el color de la app. Reemplazan a la foto, que el BLS no trae.
// La fruta es la pera del logo (docs/logo/pera.svg).

const DIBUJOS = {
  fruta:
    'M50 39 C44 39 43 44 42 49 C41 54 35 57 35 65 C35 71 41 75 50 75 C59 75 65 71 65 65 C65 57 59 54 58 49 C57 44 56 39 50 39 Z M50 39 C49 35 47 33 44 32 M51 37 C51 31 55 28 61 28 C61 33 57 36 51 37 Z M60 63 C60 67 58 69 55 70',
  verdura:
    'M39 44 H61 C61 54 56 66 50 76 C44 66 39 54 39 44 Z M50 44 V30 M50 44 C49 36 45 32 40 30 M50 44 C51 36 55 32 60 30 M43 52 H48 M52 60 H56',
  hongo: 'M28 52 C28 38 39 29 50 29 C61 29 72 38 72 52 Z M43 52 V67 C43 72 57 72 57 67 V52 M40 42 L40 42 M56 38 L56 38',
  carne:
    'M26 46 C26 35 37 29 47 32 C54 34 57 39 64 39 C71 39 75 45 73 53 C71 63 60 69 48 69 C35 69 26 59 26 46 Z M33 50 C35 59 43 63 52 62 M57 50 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0',
  ave: 'M59 33 C68 33 72 42 68 50 C63 59 52 61 46 55 C40 49 42 39 50 35 C53 34 56 33 59 33 Z M47 56 L37 66 M35 63 C31 64 31 69 34 70 C34 73 38 74 40 71',
  pescado: 'M26 50 C35 37 54 36 66 50 C54 64 35 63 26 50 Z M66 50 L76 41 V59 Z M37 47 L37 47 M48 43 C51 47 51 53 48 57',
  huevo: 'M50 27 C41 27 34 44 34 55 C34 65 41 72 50 72 C59 72 66 65 66 55 C66 44 59 27 50 27 Z M58 52 C58 58 56 61 53 63',
  pan: 'M30 51 C30 41 38 36 50 36 C62 36 70 41 70 51 C70 54 68 56 66 57 V70 H34 V57 C32 56 30 54 30 51 Z M42 44 L45 50 M50 43 L53 49 M58 44 L60 49',
  queso: 'M28 44 L52 33 L72 47 V64 H28 Z M28 44 L72 47 M42 54 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M58 57 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0',
  lacteo: 'M42 28 H58 M43 28 V38 L36 48 V70 C36 72 38 74 40 74 H60 C62 74 64 72 64 70 V48 L57 38 V28 M36 56 H64',
  fiambre:
    'M50 50 m-21 0 a21 21 0 1 0 42 0 a21 21 0 1 0 -42 0 M43 43 L43 43 M57 44 L57 44 M47 57 L47 57 M59 57 L59 57 M40 52 L40 52 M51 49 L51 49',
  nuez: 'M50 28 C60 36 64 48 62 58 C60 68 54 72 50 72 C46 72 40 68 38 58 C36 48 40 36 50 28 Z M50 36 C47 46 47 58 50 66',
  semillas:
    'M34 66 C25 55 27 38 36 30 C45 38 45 55 34 66 Z M36 38 V56 M66 66 C57 55 59 38 68 30 C77 38 77 55 66 66 Z M68 38 V56 M50 74 C43 66 44 52 51 46 C58 52 58 66 50 74 Z',
  legumbres:
    'M26 58 C35 43 57 35 74 40 C66 56 44 64 26 58 Z M39 54 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M51 50 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M63 45 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
  cereal:
    'M50 76 V32 M50 42 C44 40 42 36 44 31 C48 33 50 37 50 42 Z M50 42 C56 40 58 36 56 31 C52 33 50 37 50 42 Z M50 54 C44 52 42 48 44 43 C48 45 50 49 50 54 Z M50 54 C56 52 58 48 56 43 C52 45 50 49 50 54 Z M50 66 C44 64 42 60 44 55 C48 57 50 61 50 66 Z M50 66 C56 64 58 60 56 55 C52 57 50 61 50 66 Z',
};

const HONGOS = /pilz|Champignon|Morchel|Trüffel|Pfifferling|Reizker|Hallimasch|Röhrling|kappe/i;
const AVES = /Hähnchen|Huhn|Pute|Truthahn|Ente|Gans|Wachtel|Poularde|Perlhuhn|Fasan|Taube|Rebhuhn|Geflügel|Suppenhuhn/;

// Qué ilustración le toca a un alimento del BLS: por su grupo (primera letra del código),
// su categoría y, cuando hace falta, su nombre en alemán.
export function ilustracionDe(codigo = '', nombreAleman = '', categoria = '') {
  switch (codigo[0]) {
    case 'F':
      return 'fruta';
    case 'G':
      return 'verdura';
    case 'K':
      return HONGOS.test(nombreAleman) ? 'hongo' : 'verdura';
    case 'H':
      return { semillas: 'semillas', legumbres: 'legumbres', frutas_verduras: 'verdura' }[categoria] ?? 'nuez';
    case 'E':
      return 'huevo';
    case 'T':
      return 'pescado';
    case 'U':
      return 'carne';
    case 'V':
      return AVES.test(nombreAleman) ? 'ave' : 'carne';
    case 'B':
      return 'pan';
    case 'M':
      return categoria.startsWith('quesos') ? 'queso' : 'lacteo';
    case 'W':
      return 'fiambre';
    case 'C':
      return 'cereal';
    default:
      return 'fruta';
  }
}

export function svgIlustracion(nombre) {
  const d = DIBUJOS[nombre] ?? DIBUJOS.fruta;
  return `<svg class="ilustracion" viewBox="18 18 64 64" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
}

// Para una entrada del historial que vino del BLS (también las guardadas antes de las ilustraciones).
export function ilustracionDeEntrada(entrada) {
  const bls = entrada?.ficha?.bls;
  if (!bls) return null;
  return entrada.ficha.ilustracion ?? ilustracionDe(bls.codigo, bls.nombreAleman, entrada.ficha.categoria);
}
