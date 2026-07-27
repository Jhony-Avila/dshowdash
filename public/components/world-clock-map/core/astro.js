/**
 * World Clock Map — sombreamento dia/noite (terminator solar) em JS puro.
 * @version 0.2.0
 *
 * Algoritmo astronômico padrão (posição do Sol → ponto subsolar → círculo
 * terminador a 90° do Sol). Nenhuma API externa. Retorna um path SVG da região
 * NOTURNA no espaço do viewBox (mesma projeção equiretangular do mapa), para ser
 * pintado como overlay semitransparente. Recalculado a cada minuto pelo chamador.
 *
 * Referência do método: "day/night terminator" clássico (posição aparente do Sol
 * via longitude eclíptica + obliquidade + GMST). Preciso para uso cartográfico.
 */
'use strict';

import { project, projectX, projectY, MAP_W, MAP_H } from './projection.js';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/** Greenwich Mean Sidereal Time em horas. */
function gmstHours(jd) {
  const d = jd - 2451545.0;
  let h = (18.697374558 + 24.06570982441908 * d) % 24;
  if (h < 0) h += 24;
  return h;
}

/** Longitude eclíptica aparente do Sol (graus). */
function sunEclipticLongitude(jd) {
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = (357.528 + 0.9856003 * n) % 360;
  return L + 1.915 * Math.sin(g * D2R) + 0.020 * Math.sin(2 * g * D2R);
}

/** Obliquidade da eclíptica (graus). */
function obliquity(jd) {
  const n = jd - 2451545.0;
  return 23.4393 - 0.0000004 * n;
}

/** Ascensão reta (alpha) e declinação (delta) do Sol, em graus. */
function sunEquatorial(jd) {
  const lambda = sunEclipticLongitude(jd) * D2R;
  const eps = obliquity(jd) * D2R;
  const alpha = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) * R2D;
  const delta = Math.asin(Math.sin(eps) * Math.sin(lambda)) * R2D;
  return { alpha, delta };
}

/**
 * Ponto subsolar (lat/lng onde o Sol está a pino) para o instante dado.
 * Útil para validação e para um marcador de Sol opcional.
 */
export function subsolarPoint(date) {
  const jd = julianDay(date);
  const { alpha, delta } = sunEquatorial(jd);
  const g = gmstHours(jd);
  let lng = alpha - g * 15;
  lng = ((lng + 180) % 360 + 360) % 360 - 180; // normaliza [-180,180]
  return { lat: delta, lng };
}

/** Latitude do terminador para uma longitude, dado (alpha, delta, GMST). */
function terminatorLat(lng, alpha, delta, g) {
  const H = (g * 15 + lng - alpha) * D2R; // ângulo horário (rad)
  return Math.atan(-Math.cos(H) / Math.tan(delta * D2R)) * R2D;
}

const _r = (n) => Math.round(n * 10) / 10;

/**
 * Path SVG da região NOTURNA no viewBox (0..MAP_W, 0..MAP_H).
 * Amostra a curva do terminador longitude a longitude e fecha no polo escuro:
 *  - declinação > 0 (Sol ao norte): polo SUL no escuro  → fecha embaixo (lat -90)
 *  - declinação < 0 (Sol ao sul):   polo NORTE no escuro → fecha em cima (lat +90)
 */
export function nightPath(date, step) {
  step = step || 1;
  const jd = julianDay(date);
  const { alpha, delta } = sunEquatorial(jd);
  const g = gmstHours(jd);
  // Evita tan(0) exatamente nos equinócios (declinação ~0).
  let decl = delta;
  if (Math.abs(decl) < 0.09) decl = decl < 0 ? -0.09 : 0.09;

  let d = '';
  let first = true;
  for (let lng = -180; lng <= 180; lng += step) {
    const lat = terminatorLat(lng, alpha, decl, g);
    const x = _r(projectX(lng));
    const y = _r(projectY(lat));
    d += (first ? 'M' : 'L') + x + ' ' + y;
    first = false;
  }
  const closeLat = decl > 0 ? -90 : 90;
  const end = project(closeLat, 180);
  const start = project(closeLat, -180);
  d += 'L' + _r(end.x) + ' ' + _r(end.y) + 'L' + _r(start.x) + ' ' + _r(start.y) + 'Z';
  return d;
}

export { MAP_W, MAP_H };
