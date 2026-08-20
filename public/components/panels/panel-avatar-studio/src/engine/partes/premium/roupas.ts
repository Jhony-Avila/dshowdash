// engine/partes/premium/roupas.ts — onda 1411 (MEGA_BRIEFING_01 §2381–§2427,
// §2498–§2510; decisões #159/#166): PRIMEIRAS PARTES do trilho CLASSIC
// PREMIUM — arte NOVA (nunca editar partes/* existentes; premium = sucessor
// em pasta própria), IDs `_px_`, tokens de material (materiais2d) + tinta
// premium por luminância, e hooks do trilho (renderSombra/renderAtras).
//
// Regras do trilho: zero filtros SVG (orçamento §2510), todo def prefixado
// por uid, hooks só desenham quando o motor está em modo premium (opcoes.
// premium) — no modo clássico estas partes rendem como qualquer outra
// (render/renderCorpo), então catálogo com flag OFF nem as lista (§651).
// @version 1.0.0  @created 2026-08-20
import { alfa } from '../../cores';
import { material2d } from '../../materiais2d';
import { PATH_OMBROS } from '../../base-api';
import type { ParteDef } from '../../base-api';

/** Sombra projetada pela cabeça sobre o peito (mesma dos clássicos). */
const SOMBRA_PESCOCO = `<path d="M96 186 c 6 10 42 10 48 0 c -2 12 -46 12 -48 0 z" fill="rgba(0,0,0,0.25)"/>`;

export const ROUPAS_PREMIUM: ParteDef[] = [
  {
    id: 'rou_px_terno',
    categoria: 'roupa',
    nome: 'Terno Premium',
    descricao: 'Alfaiataria com caimento de lã fria e lapela viva — o Executivo, elevado.',
    raridade: 'epico',
    tema: 'executivo',
    usaCores: ['roupa', 'destaque'],
    acabamento: 'premium',
    render: (p, u) => {
      const la = material2d('wool', p.roupa.base);
      const seda = material2d('silk', p.destaque.base);
      return `
      <defs>${la.defs(u)}${seda.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${la.fill(u)}"/>
      <path d="M106 190 l 14 12 l 14 -12 v 50 h -28 z" fill="#f4f6fa"/>
      <path d="M111 196 v 42" stroke="${alfa('#0d1017', 0.10)}" stroke-width="1.2"/>
      <path d="M114 203 l 6 -6 l 6 6 l -6 6 z" fill="${seda.tinta.escuro}"/>
      <path d="M120 208 l -6 9 l 6 23 l 6 -23 z" fill="${seda.fill(u)}"/>
      <path d="M97 186 c 5 7 13 13 22 16 l -13 24 c -8 -12 -11 -26 -9 -40 z" fill="${la.tinta.profundo}"/>
      <path d="M143 186 c -5 7 -13 13 -22 16 l 13 24 c 8 -12 11 -26 9 -40 z" fill="${la.tinta.profundo}"/>
      <path d="M99 189 c 5 6 12 11 20 14" stroke="${alfa(la.tinta.brilho, 0.5)}" stroke-width="1.6" fill="none"/>
      <path d="M141 189 c -5 6 -12 11 -20 14" stroke="${alfa(la.tinta.brilho, 0.35)}" stroke-width="1.4" fill="none"/>
      <path d="M92 196 l 8 -3 l -4 9 z" fill="${la.tinta.claro}"/>
      <path d="M148 196 l -8 -3 l 4 9 z" fill="${la.tinta.meio}"/>
      ${SOMBRA_PESCOCO}
      <rect x="58" y="216" width="12" height="5" rx="2" fill="${alfa('#ffffff', 0.3)}" transform="rotate(-22 64 218)"/>
      <circle cx="97" cy="221" r="1.6" fill="${seda.tinta.brilho}"/>`;
    },
    // sombra de contato PRÓPRIA (trilho §2418): elipse dupla sob os ombros
    renderSombra: (p, _u) => `
      <ellipse cx="120" cy="238" rx="66" ry="7" fill="${alfa('#000000', 0.28)}"/>
      <ellipse cx="120" cy="238" rx="44" ry="4.5" fill="${alfa(p.roupa.profundo, 0.35)}"/>`,
    // volume atrás da figura (§2414): meia-luz que desenha a silhueta
    renderAtras: (p, u) => `
      <defs><radialGradient id="${u}pxtz" cx="0.5" cy="0.35" r="0.7">
        <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.16)}"/>
        <stop offset="1" stop-color="${alfa(p.destaque.claro, 0)}"/>
      </radialGradient></defs>
      <ellipse cx="120" cy="120" rx="104" ry="112" fill="url(#${u}pxtz)"/>`,
    renderCorpo: (p, u) => {
      const seda = material2d('silk', p.destaque.base);
      return `
      <defs>${seda.defs(u)}</defs>
      <path d="M104 108 l 16 22 l 16 -22 l 8 10 l -24 34 l -24 -34 z" fill="#f2f4fa"/>
      <path d="M116 116 l 4 6 l 4 -6 l 4 6 l -8 44 l -8 -44 z" fill="${seda.fill(u)}"/>
      <path d="M104 108 l -8 12 l 14 22 l 10 -12 z" fill="${p.roupa.profundo}"/>
      <path d="M136 108 l 8 12 l -14 22 l -10 -12 z" fill="${p.roupa.profundo}"/>
      <path d="M98 121 l 12 19" stroke="${alfa('#ffffff', 0.18)}" stroke-width="1.4" fill="none"/>`;
    },
  },
  {
    id: 'rou_px_jaqueta',
    categoria: 'roupa',
    nome: 'Jaqueta Premium',
    descricao: 'Couro com memória de uso: dobras que contam história.',
    raridade: 'raro',
    tema: 'urbano',
    usaCores: ['roupa', 'destaque'],
    acabamento: 'premium',
    render: (p, u) => {
      const couro = material2d('leather', p.roupa.base);
      const metal = material2d('metal', p.destaque.base);
      return `
      <defs>${couro.defs(u)}${metal.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${couro.fill(u)}"/>
      <path d="M112 188 v 52" stroke="${metal.fill(u)}" stroke-width="3.4"/>
      <path d="M112 188 v 52" stroke="${alfa('#ffffff', 0.25)}" stroke-width="1" stroke-dasharray="2 3"/>
      <path d="M96 186 c 4 8 10 13 18 16 l -6 10 c -9 -5 -13 -14 -12 -26 z" fill="${couro.tinta.profundo}"/>
      <path d="M144 186 c -4 8 -10 13 -18 16 l 6 10 c 9 -5 13 -14 12 -26 z" fill="${couro.tinta.profundo}"/>
      ${couro.realce(u, 'M52 226 c 10 -18 30 -28 48 -32')}
      <path d="M64 212 l 14 8 l -3 6 l -14 -7 z" fill="${couro.tinta.claro}"/>
      <path d="M176 212 l -14 8 l 3 6 l 14 -7 z" fill="${couro.tinta.meio}"/>
      ${SOMBRA_PESCOCO}
      <rect x="128" y="214" width="9" height="6" rx="1.5" fill="${metal.fill(u)}"/>`;
    },
    renderSombra: (p, _u) => `
      <ellipse cx="120" cy="238" rx="62" ry="6.5" fill="${alfa('#000000', 0.26)}"/>
      <ellipse cx="120" cy="238" rx="40" ry="4" fill="${alfa(p.roupa.profundo, 0.3)}"/>`,
    renderCorpo: (p, u) => {
      const metal = material2d('metal', p.destaque.base);
      return `
      <defs>${metal.defs(u)}</defs>
      <path d="M119 110 v 96" stroke="${metal.fill(u)}" stroke-width="3"/>
      <path d="M100 112 c 4 8 9 13 16 16 l -5 9 c -8 -5 -12 -13 -11 -25 z" fill="${p.roupa.profundo}"/>
      <path d="M140 112 c -4 8 -9 13 -16 16 l 5 9 c 8 -5 12 -13 11 -25 z" fill="${p.roupa.profundo}"/>
      <path d="M96 196 h 18 v 3 h -18 z" fill="${alfa('#000000', 0.2)}"/>`;
    },
  },
];
