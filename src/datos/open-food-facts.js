// Búsqueda por código de barras en Open Food Facts (base abierta, licencia ODbL).

const CAMPOS = [
  'code',
  'product_name',
  'product_name_de',
  'product_name_es',
  'product_name_en',
  'brands',
  'nutriments',
  'ingredients_text',
  'ingredients_text_de',
  'ingredients_text_es',
  'ingredients_text_en',
  'allergens_tags',
  'traces',
  'categories',
  'quantity',
  'serving_size',
].join(',');

const numero = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)) ? Number(v) : null);

// Devuelve null si no está, o { completo, datos } con lo que tiene.
export async function buscarEnOpenFoodFacts(codigo) {
  let respuesta;
  try {
    respuesta = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigo)}.json?fields=${CAMPOS}`,
    );
  } catch {
    return null;
  }
  if (!respuesta.ok) return null;
  const json = await respuesta.json();
  if (json.status !== 1 || !json.product) return null;

  const p = json.product;
  const n = p.nutriments ?? {};
  const kcal = numero(n['energy-kcal_100g']) ?? (numero(n.energy_100g) !== null ? Math.round(numero(n.energy_100g) / 4.184) : null);
  const nutrientes = {
    kcal,
    grasa: numero(n.fat_100g),
    saturadas: numero(n['saturated-fat_100g']),
    carbohidratos: numero(n.carbohydrates_100g),
    azucares: numero(n.sugars_100g),
    fibra: numero(n.fiber_100g),
    proteina: numero(n.proteins_100g),
    sal: numero(n.salt_100g),
  };
  const ingredientes = p.ingredients_text_de || p.ingredients_text || p.ingredients_text_en || p.ingredients_text_es || '';
  const producto = p.product_name_de || p.product_name || p.product_name_en || p.product_name_es || '';
  const marca = p.brands?.split(',')[0]?.trim() ?? '';
  // Si el nombre ya incluye la marca, no se repite ("Nutella", no "Nutella · Nutella").
  const nombre = marca && !producto.toLowerCase().includes(marca.toLowerCase()) ? `${marca} · ${producto}` : producto || marca;

  // Completo: los nutrientes que usa la fórmula y la lista de ingredientes.
  const imprescindibles = ['kcal', 'grasa', 'saturadas', 'azucares', 'proteina', 'sal'];
  const completo = imprescindibles.every((c) => nutrientes[c] !== null) && ingredientes.trim().length > 0;

  return {
    completo,
    datos: {
      codigo: p.code ?? codigo,
      nombre,
      nutrientes,
      ingredientes,
      trazas: p.traces || null,
      categorias: p.categories || '',
      cantidad: p.quantity || '',
      porcion: p.serving_size || '',
    },
  };
}
