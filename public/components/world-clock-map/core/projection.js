/**
 * World Clock Map — projeção equiretangular (plate carrée).
 * @version 0.2.0
 *
 * A MESMA projeção usada para gerar data/worldmap.js, garantindo que os pontos
 * das cidades e o terminator caiam exatamente sobre os continentes.
 *   x = (lng + 180) / 360 * MAP_W
 *   y = (90  - lat) / 180 * MAP_H
 * Coordenadas de saída no espaço do viewBox do SVG (0..MAP_W, 0..MAP_H).
 */
'use strict';

import { MAP_W, MAP_H } from '../data/worldmap.js';

export { MAP_W, MAP_H };

export function projectX(lng) { return (lng + 180) / 360 * MAP_W; }
export function projectY(lat) { return (90 - lat) / 180 * MAP_H; }

export function project(lat, lng) {
  return { x: projectX(lng), y: projectY(lat) };
}

/** Percentuais [0..100] — úteis para posicionar chips/HTML sobre o SVG responsivo. */
export function projectPct(lat, lng) {
  return { left: (lng + 180) / 360 * 100, top: (90 - lat) / 180 * 100 };
}
