// Etiquetas "Sirve para" y "De un vistazo". Ver docs/reglamento-puntaje.md, secciones 3 y 4.

import { SIRVE_PARA, SIRVE_PARA_MAXIMO, VISTAZO } from './reglas.js';
import { derivar, tieneValor } from './derivados.js';
import { calcularVotos } from './objetivo.js';

// Devuelve hasta 2 claves, en orden de prioridad:
// 'musculo', 'saciedad', 'corazon', 'energia_sostenida', 'energia_rapida'.
export function calcularSirvePara(ficha) {
  const d = derivar(ficha);
  const n = d.nutrientes;
  const p = d.proteinaPor100kcal ?? 0;
  const etiquetas = [];

  if (p >= SIRVE_PARA.musculo.proteinaPor100kcal) etiquetas.push('musculo');

  // Saciedad: poca densidad calórica, proteína (o proteína y fibra), y una porción
  // que alcance. Si no se sabe cuánto se come de una vez, no se asigna.
  const r = SIRVE_PARA.saciedad;
  const porcion = d.porcion;
  const porcionAlcanza =
    porcion !== null &&
    (((n.proteina ?? 0) * porcion.gramos) / 100 >= r.porcionProteinaMinima ||
      ((n.fibra ?? 0) * porcion.gramos) / 100 >= r.porcionFibraMinima);
  if (
    tieneValor(n.kcal) &&
    n.kcal <= r.kcalMaximo &&
    (p >= r.proteinaAlta || (p >= r.proteinaFuente && (n.fibra ?? 0) >= r.fibraMinima)) &&
    porcionAlcanza
  ) {
    etiquetas.push('saciedad');
  }

  if (d.grasasBuenas || ficha.pescadoAzul) etiquetas.push('corazon');

  const es = SIRVE_PARA.energia_sostenida;
  if (
    tieneValor(n.carbohidratos) &&
    n.carbohidratos >= es.carbohidratosMinimo &&
    (n.fibra ?? 0) >= es.fibraMinima &&
    (n.azucares ?? 0) <= n.carbohidratos * es.fraccionAzucarMaxima
  ) {
    etiquetas.push('energia_sostenida');
  }

  const er = SIRVE_PARA.energia_rapida;
  const azucarMinimo = ficha.esBebida ? er.azucaresMinimoBebidas : er.azucaresMinimo;
  if (
    tieneValor(n.azucares) &&
    n.azucares >= azucarMinimo &&
    (n.grasa ?? 0) < er.grasaMenosDe &&
    (n.fibra ?? 0) < er.fibraMenosDe
  ) {
    etiquetas.push('energia_rapida');
  }

  return etiquetas.slice(0, SIRVE_PARA_MAXIMO);
}

// Devuelve la lista de etiquetas tocables, con los excesos primero:
// [{ tipo: 'exceso' | 'flojo' | 'bueno', clave, valor }]
// "valor" es el número a mostrar (por ejemplo, 24 en "Exceso de azúcar · 24 g").
export function calcularDeUnVistazo(ficha, perfil) {
  const d = derivar(ficha);
  const n = d.nutrientes;
  const excesos = [];
  const flojos = [];
  const buenos = [];

  if (d.niveles.azucar === 'alto') excesos.push({ tipo: 'exceso', clave: 'exceso_azucar', valor: n.azucares });
  // Con grasas buenas (nueces, aceite de oliva, palta) la grasa alta no es un
  // exceso grave: se muestra como punto flojo suave.
  if (d.niveles.saturadas === 'alto') {
    if (d.grasasBuenas) flojos.push({ tipo: 'flojo', clave: 'saturadas_altas_buena', valor: n.saturadas });
    else excesos.push({ tipo: 'exceso', clave: 'exceso_saturadas', valor: n.saturadas });
  }
  if (d.niveles.sal === 'alto') excesos.push({ tipo: 'exceso', clave: 'exceso_sal', valor: n.sal });
  if (d.niveles.grasa === 'alto') {
    if (d.grasasBuenas) flojos.push({ tipo: 'flojo', clave: 'grasa_alta_buena', valor: n.grasa });
    else excesos.push({ tipo: 'exceso', clave: 'exceso_grasa', valor: n.grasa });
  }

  if (tieneValor(n.kcal) && n.kcal > VISTAZO.caloriasAltasMasDe) {
    flojos.push({ tipo: 'flojo', clave: 'calorias_altas', valor: n.kcal });
  }
  const p = d.proteinaPor100kcal;
  const votosProteina = calcularVotos(perfil).proteina ?? 0;
  if (p !== null && p < VISTAZO.proteinaBajaMenosDe && votosProteina >= VISTAZO.proteinaBajaVotosMinimos) {
    flojos.push({ tipo: 'flojo', clave: 'proteina_baja', valor: redondearUnDecimal(p) });
  }
  if (d.niveles.azucar === 'medio') flojos.push({ tipo: 'flojo', clave: 'azucar_moderado', valor: n.azucares });
  if (d.niveles.sal === 'medio') flojos.push({ tipo: 'flojo', clave: 'sal_moderada', valor: n.sal });

  if (p !== null && p >= VISTAZO.proteinaAltaDesde) {
    buenos.push({ tipo: 'bueno', clave: 'proteina_alta', valor: n.proteina });
  } else if (p !== null && p >= VISTAZO.proteinaBuenaDesde) {
    buenos.push({ tipo: 'bueno', clave: 'proteina_buena', valor: n.proteina });
  }
  if (d.nivelFibra === 2) buenos.push({ tipo: 'bueno', clave: 'fibra_alta', valor: n.fibra });
  else if (d.nivelFibra === 1) buenos.push({ tipo: 'bueno', clave: 'fibra_buena', valor: n.fibra });
  if (d.grasasBuenas) buenos.push({ tipo: 'bueno', clave: 'grasas_buenas', valor: null });
  if (tieneValor(n.kcal) && n.kcal <= VISTAZO.pocasCaloriasHasta) {
    buenos.push({ tipo: 'bueno', clave: 'pocas_calorias', valor: n.kcal });
  }
  if (d.azucarAgregado.hay === false) buenos.push({ tipo: 'bueno', clave: 'sin_azucar_agregado', valor: null });

  return [...excesos, ...flojos, ...buenos];
}

const redondearUnDecimal = (x) => Math.round(x * 10) / 10;
