/**
 * map/projections.ts — registro de projeções cartográficas.
 * @version 3.0.0
 *
 * NOTA SOBRE ROBINSON: o briefing cita Robinson. d3-geo não a traz embutida (mora em
 * d3-geo-projection, um pacote a mais). A NATURAL EARTH 1 está embutida, é da mesma
 * família de compromisso (pseudo-cilíndrica, distorção equilibrada) e é visualmente
 * indistinguível da Robinson na escala deste painel — foi a escolhida, e o rótulo diz
 * o nome verdadeiro dela em vez de fingir que é Robinson.
 *
 * A ORTOGRÁFICA é o motivo de todo o motor ser d3-geo em vez de MapLibre: nenhum
 * renderizador de tiles projeta um globo de verdade, e o terminador solar em cima de
 * uma esfera é o que dá a leitura "Google Earth" que o briefing pede.
 */
'use strict';

import {
  geoEquirectangular,
  geoNaturalEarth1,
  geoOrthographic,
  geoMercator,
  type GeoProjection,
} from 'd3-geo';

export type ProjectionId = 'equirectangular' | 'naturalEarth' | 'orthographic' | 'mercator';

export interface ProjectionDef {
  id: ProjectionId;
  label: string;
  /** Descrição curta exibida no seletor de camadas. */
  hint: string;
  /** A projeção mostra o globo (esfera recortada) em vez do plano inteiro? */
  isGlobe: boolean;
  factory: () => GeoProjection;
}

export const PROJECTIONS: ProjectionDef[] = [
  {
    id: 'equirectangular',
    label: 'Equiretangular',
    hint: 'Plate carrée — grade regular, ideal para comparar fusos',
    isGlobe: false,
    factory: () => geoEquirectangular(),
  },
  {
    id: 'naturalEarth',
    label: 'Natural Earth',
    hint: 'Pseudo-cilíndrica de compromisso — formas mais fiéis',
    isGlobe: false,
    factory: () => geoNaturalEarth1(),
  },
  {
    id: 'orthographic',
    label: 'Globo',
    hint: 'Ortográfica — a Terra vista do espaço, arrastável',
    isGlobe: true,
    factory: () => geoOrthographic().clipAngle(90),
  },
  {
    id: 'mercator',
    label: 'Mercator',
    hint: 'Conforme — ângulos preservados, polos exagerados',
    isGlobe: false,
    factory: () => geoMercator(),
  },
];

export const PROJECTION_BY_ID: Record<ProjectionId, ProjectionDef> = PROJECTIONS.reduce((m, p) => {
  m[p.id] = p;
  return m;
}, {} as Record<ProjectionId, ProjectionDef>);

export interface ViewState {
  /** Fator de zoom aplicado sobre o enquadramento base. */
  k: number;
  /** Deslocamento em pixels (projeções planas). */
  x: number;
  /** Deslocamento em pixels (projeções planas). */
  y: number;
  /** Rotação [λ, φ, γ] em graus (globo). */
  rotate: [number, number, number];
}

export const INITIAL_VIEW: ViewState = { k: 1, x: 0, y: 0, rotate: [0, 0, 0] };

const SPHERE = { type: 'Sphere' } as const;

/**
 * Margens ocupadas pela interface flutuante, em pixels de cada borda do palco.
 * O mapa é enquadrado DENTRO do que sobra.
 */
export interface Insets { left: number; right: number; top: number; bottom: number }

export const NO_INSETS: Insets = { left: 0, right: 0, top: 0, bottom: 0 };

/**
 * Configura a projeção para o tamanho do canvas, as margens da interface e o estado
 * de navegação.
 *
 * POR QUE AS MARGENS EXISTEM: o mapa é full-bleed e os painéis de vidro flutuam por
 * cima. Sem enquadrar no corredor livre, o painel de Mercados (300px à direita)
 * engolia a Ásia e a Oceania inteiras — Tóquio, Xangai, Hong Kong, Singapura, Mumbai,
 * Dubai e Sydney simplesmente não apareciam num painel cujo propósito é justamente
 * mostrar o mundo todo. Enquadrar no corredor garante que TODA cidade visível tenha
 * onde ser desenhada, e o mapa cresce sozinho quando o usuário fecha painéis.
 *
 * O oceano continua sangrando por baixo do vidro: quem é recortado é a ESFERA, não a
 * pintura de fundo.
 *
 * Enquadramento base por `fitExtent` na esfera inteira e só então o zoom/pan por cima
 * — assim trocar de projeção nunca "perde" o mapa e o zoom se comporta igual em todas.
 */
export function configureProjection(
  def: ProjectionDef,
  width: number,
  height: number,
  view: ViewState,
  insets: Insets = NO_INSETS,
): GeoProjection {
  const projection = def.factory();
  const pad = def.isGlobe ? 18 : 4;

  // MARGEM INTEGRAL, e a razão é medida, não estética.
  //
  // Tentei recuar só 72% da largura dos painéis para o mapa "sangrar" sob o vidro e
  // ficar maior. O preço apareceu na prova visual: as cidades das bordas caíam sob os
  // painéis e o posicionador as descartava — de 15 cidades fixadas, 8 apareciam.
  // Num relógio mundial, ver TODAS as praças que você acompanha vale mais que 200px
  // extras de oceano. Com a margem integral o mapa fica menor e completo.
  //
  // O corredor cresce sozinho quando o usuário fecha painéis: as margens vêm do DOM.
  const FATOR = 1;
  const maxX = width * 0.28;
  const maxY = height * 0.26;
  const l = Math.min(insets.left * FATOR, maxX) + pad;
  const r = Math.min(insets.right * FATOR, maxX) + pad;
  const t = Math.min(insets.top * FATOR, maxY) + pad;
  const b = Math.min(insets.bottom * FATOR, maxY) + pad;

  const x0 = l;
  const y0 = t;
  const x1 = Math.max(x0 + 40, width - r);
  const y1 = Math.max(y0 + 24, height - b);

  projection.fitExtent([[x0, y0], [x1, y1]], SPHERE);

  if (def.isGlobe) {
    // No globo, arrastar gira a Terra: o pan em pixels não se aplica. O centro é o do
    // CORREDOR, não o do palco — senão o globo nasce escondido atrás de um painel.
    projection.rotate(view.rotate);
    projection.scale(projection.scale() * view.k);
    projection.translate([(x0 + x1) / 2, (y0 + y1) / 2]);
  } else {
    const [tx, ty] = projection.translate();
    projection.scale(projection.scale() * view.k);
    projection.translate([tx * view.k + view.x, ty * view.k + view.y]);
    // A rotação horizontal também vale nas planas: permite centralizar o Pacífico.
    projection.rotate([view.rotate[0], 0, 0]);
  }

  return projection;
}

/** Limites de zoom — abaixo de 1 o mapa some, acima de 12 o 50m fica pixelado. */
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 12;

export function clampZoom(k: number): number {
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, k));
}

/**
 * Mantém o pan dentro de um limite razoável para as projeções planas: o usuário pode
 * navegar, mas não empurrar o mapa inteiro para fora da tela e ficar olhando o vazio.
 */
export function clampPan(view: ViewState, width: number, height: number): ViewState {
  if (view.k <= 1) return { ...view, x: 0, y: 0 };
  const maxX = (width * (view.k - 1)) / 2;
  const maxY = (height * (view.k - 1)) / 2;
  return {
    ...view,
    x: Math.max(-maxX, Math.min(maxX, view.x)),
    y: Math.max(-maxY, Math.min(maxY, view.y)),
  };
}

/** Normaliza a latitude de rotação para não virar o globo de cabeça para baixo. */
export function clampRotation(rotate: [number, number, number]): [number, number, number] {
  const lambda = ((rotate[0] + 180) % 360 + 360) % 360 - 180;
  const phi = Math.max(-90, Math.min(90, rotate[1]));
  return [lambda, phi, rotate[2]];
}
