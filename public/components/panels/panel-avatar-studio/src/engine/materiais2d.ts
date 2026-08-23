// engine/materiais2d.ts — onda 1411 (MEGA_BRIEFING_01 §2402–§2427, §1509–
// §1518 espelho 2D; decisão #159): TOKENS DE MATERIAL do Classic Premium —
// defs SVG determinísticos (gradiente/realce por material) que as partes
// `_px_` usam em vez de inventar gradiente próprio (o "material lê" §2404).
//
// Contrato: puro (mesma entrada ⇒ mesmos bytes), TODO id de def prefixado
// pelo `uid`, ZERO filtros SVG (orçamento §2510: filtros são raros e ficam
// com o dono da parte; tokens usam só gradientes + strokes). SvgSanitizer
// NÃO foi estendido: os tokens só emitem primitivas já permitidas.
// Consumo típico:
//   const m = material2d('denim', p.roupa.base);
//   `<defs>${m.defs(u)}</defs><path d="…" fill="${m.fill(u)}"/>${m.realce(u, PATH)}`
// @version 1.0.0  @created 2026-08-20
import { alfa } from './cores';
import { tintaPremium } from './cores';
import type { TintaPremium } from './cores';

export type MaterialToken2d =
  | 'cotton' | 'denim' | 'wool' | 'leather' | 'metal'
  | 'technical' | 'satin' | 'silk' | 'glass' | 'emissive';

export const MATERIAIS_2D: readonly MaterialToken2d[] = [
  'cotton', 'denim', 'wool', 'leather', 'metal', 'technical', 'satin', 'silk', 'glass', 'emissive',
];

export interface Material2d {
  token: MaterialToken2d;
  tinta: TintaPremium;
  /** defs do material (gradientes) — ids prefixados por uid+token */
  defs: (uid: string) => string;
  /** referência de preenchimento principal */
  fill: (uid: string) => string;
  /** fragmento de REALCE por cima do shape (recebe o path/geom alvo) */
  realce: (uid: string, path: string) => string;
}

const gid = (uid: string, token: string) => `${uid}m2_${token}`;

/** Gradiente base 3 paradas (suave) — a maioria dos tecidos. */
function gradTecido(id: string, t: TintaPremium, y2 = 1): string {
  return `<linearGradient id="${id}" x1="0.2" y1="0" x2="0.55" y2="${y2}">`
    + `<stop offset="0" stop-color="${t.claro}"/>`
    + `<stop offset="0.45" stop-color="${t.base}"/>`
    + `<stop offset="1" stop-color="${t.escuro}"/></linearGradient>`;
}

/** Fábrica de material — determinística; cada token tem defs próprios. */
export function material2d(token: MaterialToken2d, hexBase: string): Material2d {
  const t = tintaPremium(hexBase);
  const comum = { token, tinta: t, fill: (u: string) => `url(#${gid(u, token)})` };
  switch (token) {
    case 'cotton':
      // §69: MATTE — highlight amplo e fraco, pouca especularidade, liso.
      return {
        ...comum,
        defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0.3" y1="0" x2="0.5" y2="1">`
          + `<stop offset="0" stop-color="${t.claro}"/><stop offset="0.5" stop-color="${t.base}"/><stop offset="1" stop-color="${t.meio}"/></linearGradient>`
          + `<radialGradient id="${gid(u, token)}h" cx="0.4" cy="0.3" r="0.7">`
          + `<stop offset="0" stop-color="${alfa('#ffffff', 0.14)}"/><stop offset="1" stop-color="${alfa('#ffffff', 0)}"/></radialGradient>`,
        realce: (u, d) => `<path d="${d}" fill="url(#${gid(u, token)}h)"/>`,
      };
    case 'wool':
      // §70: difuso, contraste baixo, TRAMA visível, borda macia, sombra rica.
      return {
        ...comum,
        defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0.2" y1="0" x2="0.5" y2="1">`
          + `<stop offset="0" stop-color="${t.base}"/><stop offset="0.5" stop-color="${t.base}"/><stop offset="1" stop-color="${t.escuro}"/></linearGradient>`
          + `<pattern id="${gid(u, token)}p" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">`
          + `<path d="M0 2.5 h5 M2.5 0 v5" stroke="${alfa(t.escuro, 0.16)}" stroke-width="0.7"/></pattern>`,
        realce: (u, d) => `<path d="${d}" fill="url(#${gid(u, token)}p)"/>`,
      };
    case 'denim':
      // §71: twill DIAGONAL + seams + stitching + highlight localizado.
      return {
        ...comum,
        defs: (u) => gradTecido(gid(u, token), t)
          + `<pattern id="${gid(u, token)}p" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">`
          + `<path d="M0 0 v4" stroke="${alfa(t.claro, 0.25)}" stroke-width="0.8"/><path d="M2 0 v4" stroke="${alfa(t.profundo, 0.2)}" stroke-width="0.8"/></pattern>`,
        realce: (u, d) => `<path d="${d}" fill="url(#${gid(u, token)}p)"/>`
          + `<path d="${d}" fill="none" stroke="${alfa(t.profundo, 0.4)}" stroke-width="1.6" stroke-dasharray="5 3" stroke-linecap="round"/>`,
      };
    case 'leather':
      // §72: specular strip + bordas escuras + creases + NÃO plástico.
      return {
        ...comum,
        defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0.1" y1="0" x2="0.6" y2="1">`
          + `<stop offset="0" stop-color="${t.claro}"/><stop offset="0.3" stop-color="${t.base}"/>`
          + `<stop offset="0.7" stop-color="${t.escuro}"/><stop offset="1" stop-color="${t.profundo}"/></linearGradient>`
          + `<linearGradient id="${gid(u, token)}s" x1="0" y1="0" x2="0" y2="1">`
          + `<stop offset="0.32" stop-color="${alfa('#ffffff', 0)}"/><stop offset="0.42" stop-color="${alfa('#ffffff', 0.5)}"/><stop offset="0.52" stop-color="${alfa('#ffffff', 0)}"/></linearGradient>`,
        // specular strip (banda larga) + bordas escuras + creases finas
        realce: (u, d) => `<path d="${d}" fill="url(#${gid(u, token)}s)"/>`
          + `<path d="${d}" fill="none" stroke="${alfa(t.profundo, 0.55)}" stroke-width="2.4"/>`
          + `<path d="${d}" fill="none" stroke="${alfa(t.profundo, 0.3)}" stroke-width="0.9" stroke-dasharray="3 14" stroke-dashoffset="7"/>`,
      };
    case 'metal':
      return {
        ...comum,
        // anisotropia: paradas duras (metal lê por CONTRASTE de banda §2404)
        defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0" y1="0" x2="0.8" y2="1">`
          + `<stop offset="0" stop-color="${t.brilho}"/><stop offset="0.34" stop-color="${t.base}"/>`
          + `<stop offset="0.36" stop-color="${t.profundo}"/><stop offset="0.62" stop-color="${t.escuro}"/>`
          + `<stop offset="0.8" stop-color="${t.claro}"/><stop offset="1" stop-color="${t.base}"/></linearGradient>`,
        realce: (_u, d) => `<path d="${d}" fill="none" stroke="${alfa('#ffffff', 0.5)}" stroke-width="1" stroke-dasharray="4 40"/>`,
      };
    case 'technical':
      // §73: painéis + seams + edge crisp + sheen moderado + detalhes funcionais.
      return {
        ...comum,
        defs: (u) => gradTecido(gid(u, token), t, 0.9)
          + `<pattern id="${gid(u, token)}p" width="16" height="16" patternUnits="userSpaceOnUse">`
          + `<path d="M0 0 h16 M0 0 v16" stroke="${alfa(t.escuro, 0.28)}" stroke-width="0.8"/>`
          + `<path d="M0 15.4 h16" stroke="${alfa(t.brilho, 0.22)}" stroke-width="0.6"/></pattern>`,
        realce: (u, d) => `<path d="${d}" fill="url(#${gid(u, token)}p)"/>`
          + `<path d="${d}" fill="none" stroke="${alfa(t.brilho, 0.45)}" stroke-width="1.4"/>`,
      };
    case 'satin':
      return {
        ...comum,
        defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0" y1="0.1" x2="1" y2="0.9">`
          + `<stop offset="0" stop-color="${t.escuro}"/><stop offset="0.35" stop-color="${t.brilho}"/>`
          + `<stop offset="0.55" stop-color="${t.base}"/><stop offset="1" stop-color="${t.escuro}"/></linearGradient>`,
        realce: () => '',
      };
    case 'silk':
      return {
        ...comum,
        defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0" y1="0" x2="1" y2="1">`
          + `<stop offset="0" stop-color="${t.claro}"/><stop offset="0.4" stop-color="${t.base}"/>`
          + `<stop offset="0.6" stop-color="${t.brilho}"/><stop offset="1" stop-color="${t.meio}"/></linearGradient>`,
        realce: () => '',
      };
    case 'glass':
      return {
        ...comum,
        defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0.2" y1="0" x2="0.7" y2="1">`
          + `<stop offset="0" stop-color="${alfa(t.brilho, 0.85)}"/><stop offset="0.5" stop-color="${alfa(t.base, 0.55)}"/>`
          + `<stop offset="1" stop-color="${alfa(t.escuro, 0.7)}"/></linearGradient>`,
        realce: (_u, d) => `<path d="${d}" fill="none" stroke="${alfa('#ffffff', 0.55)}" stroke-width="1.2" stroke-dasharray="14 30"/>`,
      };
    case 'emissive':
      return {
        ...comum,
        // emissivo SEM filtro (orçamento §2510): halo por camadas de alfa
        defs: (u) => `<radialGradient id="${gid(u, token)}" cx="0.5" cy="0.4" r="0.75">`
          + `<stop offset="0" stop-color="${t.brilho}"/><stop offset="0.6" stop-color="${t.base}"/>`
          + `<stop offset="1" stop-color="${t.escuro}"/></radialGradient>`,
        realce: (_u, d) => `<path d="${d}" fill="none" stroke="${alfa(t.brilho, 0.35)}" stroke-width="3"/>`
          + `<path d="${d}" fill="none" stroke="${alfa(t.brilho, 0.18)}" stroke-width="6"/>`,
      };
    default:
      return { ...comum, defs: (u) => gradTecido(gid(u, token), t), realce: () => '' };
  }
}
