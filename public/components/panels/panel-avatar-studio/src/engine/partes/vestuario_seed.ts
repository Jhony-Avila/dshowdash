// engine/partes/vestuario_seed.ts — COMPLEMENTO mínimo de vestuário separado
// (decisão #50). A arte canônica de calça/calçado já existe em premium/vestuario.ts
// (rin_jeans/rin_social/rin_jogger; ace_px_tenis/social/bota); este arquivo apenas
// COMPLETA os mínimos do briefing (≥5 calças, ≥5 calçados) com peças NOVAS e
// ISOLADAS — nada aqui altera arte existente (byte-stability trivial: ids novos).
//
// TODAS as peças deste arquivo são SEED e estão marcadas para revisão visual do
// Jhony (VESTUARIO_SEED_IDS): geometria ancorada no scaffold de corpo (240×400)
// — pernas y≈208→330 (split em x=120), calçado y≈330→372 — mas sem validação
// visual humana. `render:()=>''` no busto (contrato dos slots corporais #154);
// a arte vive em `renderCorpo` (corpo inteiro), como as peças premium.
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

/** Peças SEED (revisão visual pendente — mantê-las isoladas p/ aprovar/ajustar). */
export const VESTUARIO_SEED_IDS: readonly string[] = [
  'rin_shorts', 'rin_futurista', 'ace_tenis_futuro',
];

function gradVert(u: string, tag: string, claro: string, base: string, profundo: string): string {
  return `<linearGradient id="${u}${tag}" x1="0" y1="0" x2="0" y2="1">`
    + `<stop offset="0" stop-color="${claro}"/><stop offset="0.5" stop-color="${base}"/>`
    + `<stop offset="1" stop-color="${profundo}"/></linearGradient>`;
}

// Silhueta base das duas pernas (cós em y=208, barra em y≈326; split no centro x=120).
const PERNAS_SEED =
  'M94 208 h52 v8 l-4 112 q-1 6 -7 6 h-10 q-6 0 -7 -6 l-5 -74 -5 74 q-1 6 -7 6 h-10 q-6 0 -7 -6 l-4 -112 z';

// ── CALÇAS SEED (roupa_inferior) ────────────────────────────────────────
const comumRinSeed = {
  categoria: 'roupa_inferior' as const,
  raridade: 'incomum' as const,
  usaCores: ['roupa' as const, 'destaque' as const],
  render: () => '', // busto não desenha (só corpo inteiro)
};

export const ROUPAS_INFERIORES_SEED: ParteDef[] = [
  {
    ...comumRinSeed, id: 'rin_shorts', nome: 'Bermuda', tema: 'casual',
    descricao: 'Bermuda de verão — barra na altura do joelho.',
    renderCorpo: (p, u) => `
      <defs>${gradVert(u, 'sh', p.roupa.claro, p.roupa.base, p.roupa.profundo)}
        <clipPath id="${u}shc"><rect x="84" y="200" width="72" height="72"/></clipPath></defs>
      <g clip-path="url(#${u}shc)"><path d="${PERNAS_SEED}" fill="url(#${u}sh)"/></g>
      <path d="M120 216 v52" stroke="${alfa('#000000', 0.16)}" stroke-width="2"/>
      <path d="M90 268 h28 M122 268 h28" stroke="${alfa('#000000', 0.22)}" stroke-width="3"/>`,
  },
  {
    ...comumRinSeed, id: 'rin_futurista', raridade: 'raro', nome: 'Calça Tron', tema: 'cyberpunk',
    descricao: 'Corte técnico com linhas de energia laterais.',
    renderCorpo: (p, u) => `
      <defs>${gradVert(u, 'ft', p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PERNAS_SEED}" fill="url(#${u}ft)"/>
      <path d="M120 216 v108" stroke="${alfa('#000000', 0.18)}" stroke-width="2"/>
      <path d="M97 214 q6 60 6 112 M143 214 q-6 60 -6 112" stroke="${p.destaque.base}" stroke-width="1.8" fill="none"/>
      <path d="M99 300 h8 M133 300 h8" stroke="${p.destaque.claro}" stroke-width="2.4" stroke-linecap="round"/>`,
  },
];

// ── CALÇADO SEED (acessorio / slot pes) ─────────────────────────────────
export const CALCADOS_SEED: ParteDef[] = [
  {
    categoria: 'acessorio', slot: 'pes', raridade: 'raro',
    id: 'ace_tenis_futuro', nome: 'Tênis Hover', tema: 'cyberpunk',
    descricao: 'Entressola luminosa com aro de propulsão.',
    usaCores: ['roupa', 'destaque'],
    render: () => '',
    renderCorpo: (p, u) => `
      <defs>${gradVert(u, 'cf', p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="M88 330 h30 v20 c0 6 -4 12 -12 12 h-24 c-8 0 -10 -9 -2 -13 l10 -5 z" fill="url(#${u}cf)"/>
      <path d="M122 330 h30 l0 16 10 5 c8 4 6 13 -2 13 h-24 c-8 0 -12 -6 -12 -12 z" fill="url(#${u}cf)"/>
      <path d="M82 360 h42 q2 6 -2 9 h-42 z M116 360 h42 q4 3 -2 9 h-42 z" fill="${p.destaque.base}"/>
      <path d="M96 338 l14 4 M128 338 l14 4" stroke="${p.destaque.claro}" stroke-width="2.4" stroke-linecap="round"/>`,
  },
];
