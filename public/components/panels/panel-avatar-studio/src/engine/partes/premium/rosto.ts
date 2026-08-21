// engine/partes/premium/rosto.ts — onda 1414 (MEGA_BRIEFING_01 Partes 3/4;
// decisões #162/#166/#186): BARBAS, SOBRANCELHAS E NARIZES premium — as
// três categorias faciais novas, como arte NOVA (partes/* intocadas).
//
// Regras do trilho: zero filtros SVG (§2510), defs prefixados por uid,
// tinta premium por luminância. Cores: barba/sobrancelha leem
// `p.barba`/`p.sobrancelha` (canais coresFace, injetados pelo render só
// com as6.face_v2) com fallback no cabelo global; nariz lê a pele.
// Raridade: todas `comum` (#162 — item facial novo não é loot). O beard
// fit por família (#162) é do MOTOR (compat-rosto.fatorBarba) — a arte
// não conhece a base. Sobrancelha é OVERLAY sobre o traço cozido da base:
// pinta por cima, nunca edita a arte da base.
// @version 1.0.0  @created 2026-08-21
import { alfa, tintaPremium } from '../../cores';
import type { Paleta } from '../../cores';
import type { ParteDef } from '../../base-api';
import { HUMANOIDES } from '../cabelos';

type TP = ReturnType<typeof tintaPremium>;
const tpBarba = (p: Paleta): TP => tintaPremium((p.barba ?? p.cabelo).base);
const tpSobr = (p: Paleta): TP => tintaPremium((p.sobrancelha ?? p.cabelo).base);

// ── BARBAS (brb_*) ──────────────────────────────────────────────────────

/** defs do gradiente de pelos (vertical: luz em cima, profundo embaixo). */
function defsPelo(u: string, t: TP): string {
  return `<linearGradient id="${u}pxbrb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.claro}"/>
      <stop offset="0.45" stop-color="${t.base}"/>
      <stop offset="1" stop-color="${t.profundo}"/>
    </linearGradient>`;
}

/** Fios de textura determinísticos ao longo de um arco da mandíbula. */
function fiosBarba(t: TP, ys: number, densidade: number): string {
  const fios: string[] = [];
  for (let i = 0; i < densidade; i += 1) {
    const x = 84 + (72 / (densidade - 1)) * i;
    const y = ys + Math.abs(x - 120) * -0.28 + (i % 3) * 2.2;
    fios.push(`<path d="M${x} ${y} q ${(i % 2 ? 1 : -1) * 1.4} 5 0 8" stroke="${alfa(t.escuro, 0.55)}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`);
  }
  return fios.join('');
}

/** Massa de barba cheia: contorno da mandíbula com recorte da boca. */
function massaBarba(u: string, t: TP, queixoY: number, extra = ''): string {
  return `<path d="M78 116 Q 82 ${queixoY - 10} 96 ${queixoY} Q 120 ${queixoY + 10} 144 ${queixoY} Q 158 ${queixoY - 10} 162 116 L 162 128 Q 150 ${queixoY + 4} 132 ${queixoY + 7} L 120 ${queixoY + 8} L 108 ${queixoY + 7} Q 90 ${queixoY + 4} 78 128 Z" fill="url(#${u}pxbrb)"/>
    <path d="M104 150 Q 120 156 136 150 Q 132 144 120 144 Q 108 144 104 150 Z" fill="${alfa(t.profundo, 0.35)}"/>${extra}`;
}

const bigodePath = (t: TP): string =>
  `<path d="M104 141 Q 112 136.5 119 139.5 L 120 141 L 121 139.5 Q 128 136.5 136 141 Q 130 145.5 121.5 143.5 L 120 142.6 L 118.5 143.5 Q 110 145.5 104 141 Z" fill="${alfa(t.base, 0.96)}"/>
   <path d="M107 140.4 q 6 -2.6 11 -0.8 M133 140.4 q -6 -2.6 -11 -0.8" stroke="${alfa(t.claro, 0.5)}" stroke-width="0.9" fill="none" stroke-linecap="round"/>`;

const comumBarba = {
  categoria: 'barba' as const, raridade: 'comum' as const,
  requerBase: HUMANOIDES, acabamento: 'premium' as const,
  usaCores: ['cabelo' as const],
};

export const BARBAS_PREMIUM: ParteDef[] = [
  {
    ...comumBarba, id: 'brb_rala', nome: 'Barba Rala', tema: 'casual',
    descricao: 'Sombra de dois dias, honesta e cansada de reunião.',
    render: (p) => { const t = tpBarba(p); return `<g opacity="0.55">${fiosBarba(t, 146, 14)}${fiosBarba(t, 154, 11)}</g>`; },
  },
  {
    ...comumBarba, id: 'brb_aparada', nome: 'Barba Aparada', tema: 'executivo',
    descricao: 'Linha da mandíbula desenhada na régua.',
    render: (p, u) => { const t = tpBarba(p); return `<defs>${defsPelo(u, t)}</defs>
      <path d="M80 120 Q 86 158 104 165 Q 120 170 136 165 Q 154 158 160 120 L 160 130 Q 152 162 134 168 L 120 170.5 L 106 168 Q 88 162 80 130 Z" fill="url(#${u}pxbrb)"/>
      ${bigodePath(t)}`; },
  },
  {
    ...comumBarba, id: 'brb_cheia', nome: 'Barba Cheia', tema: 'casual',
    descricao: 'Cobertura completa com pelo em duas luzes.',
    render: (p, u) => { const t = tpBarba(p); return `<defs>${defsPelo(u, t)}</defs>
      ${massaBarba(u, t, 168, bigodePath(t))}
      <path d="M92 150 q 4 8 10 12 M148 150 q -4 8 -10 12" stroke="${alfa(t.claro, 0.4)}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`; },
  },
  {
    ...comumBarba, id: 'brb_cavanhaque', nome: 'Cavanhaque', tema: 'urbano',
    descricao: 'Queixo em foco, resto em silêncio.',
    render: (p, u) => { const t = tpBarba(p); return `<defs>${defsPelo(u, t)}</defs>
      <path d="M108 152 Q 120 149 132 152 Q 134 166 120 169 Q 106 166 108 152 Z" fill="url(#${u}pxbrb)"/>
      ${bigodePath(t)}
      <path d="M113 158 q 7 3 14 0" stroke="${alfa(t.claro, 0.45)}" stroke-width="1" fill="none" stroke-linecap="round"/>`; },
  },
  {
    ...comumBarba, id: 'brb_bigode', nome: 'Bigode', tema: 'clássico',
    descricao: 'Só o bigode. Personalidade não precisa de mais.',
    render: (p) => bigodePath(tpBarba(p)),
  },
  {
    ...comumBarba, id: 'brb_costeleta', nome: 'Costeletas', tema: 'urbano',
    descricao: 'Laterais firmes descendo até a mandíbula.',
    render: (p, u) => { const t = tpBarba(p); return `<defs>${defsPelo(u, t)}</defs>
      <path d="M78 112 L 90 114 Q 90 136 98 146 L 88 144 Q 80 132 78 112 Z" fill="url(#${u}pxbrb)"/>
      <path d="M162 112 L 150 114 Q 150 136 142 146 L 152 144 Q 160 132 162 112 Z" fill="url(#${u}pxbrb)"/>`; },
  },
  {
    ...comumBarba, id: 'brb_longa', nome: 'Barba Longa', tema: 'fantasia',
    descricao: 'Massa que desce do queixo com queda real.',
    render: (p, u) => { const t = tpBarba(p); return `<defs>${defsPelo(u, t)}</defs>
      ${massaBarba(u, t, 166, bigodePath(t))}
      <path d="M100 166 Q 104 190 114 196 Q 120 199 126 196 Q 136 190 140 166 Q 130 176 120 177 Q 110 176 100 166 Z" fill="url(#${u}pxbrb)"/>
      <path d="M112 178 q 2 9 6 13 M128 178 q -2 9 -6 13" stroke="${alfa(t.escuro, 0.5)}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`; },
  },
  {
    ...comumBarba, id: 'brb_lenhador', nome: 'Barba Lenhador', tema: 'casual',
    descricao: 'Volume cheio e largo, textura de machado e café.',
    render: (p, u) => { const t = tpBarba(p); return `<defs>${defsPelo(u, t)}</defs>
      <path d="M76 114 Q 78 168 96 182 Q 120 194 144 182 Q 162 168 164 114 L 164 130 Q 158 176 138 186 L 120 190 L 102 186 Q 82 176 76 130 Z" fill="url(#${u}pxbrb)"/>
      ${massaBarba(u, t, 172, bigodePath(t))}
      <path d="M94 158 q 6 12 14 17 M146 158 q -6 12 -14 17 M120 176 l 0 10" stroke="${alfa(t.claro, 0.35)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`; },
  },
];

// ── SOBRANCELHAS (sbr_*) — overlay sobre o traço cozido da base ─────────

/** Par espelhado: `d` desenha a sobrancelha ESQUERDA (olho em 100,108);
 *  a direita é espelhada em x=120. Leve luz no topo. */
function parSobrancelha(t: TP, d: string, espessura: number): string {
  return `<g stroke-linecap="round" fill="none">
    <path d="${d}" stroke="${t.escuro}" stroke-width="${espessura}"/>
    <path d="${d}" stroke="${alfa(t.claro, 0.35)}" stroke-width="${Math.max(0.8, espessura - 2)}" transform="translate(0 -0.7)"/>
    <g transform="translate(240 0) scale(-1 1)">
      <path d="${d}" stroke="${t.escuro}" stroke-width="${espessura}"/>
      <path d="${d}" stroke="${alfa(t.claro, 0.35)}" stroke-width="${Math.max(0.8, espessura - 2)}" transform="translate(0 -0.7)"/>
    </g>
  </g>`;
}

const comumSobr = {
  categoria: 'sobrancelha' as const, raridade: 'comum' as const,
  requerBase: HUMANOIDES, acabamento: 'premium' as const,
  usaCores: ['cabelo' as const],
};

const SOBR_DEFS: Array<[string, string, string, string, number]> = [
  ['sbr_reta', 'Reta', 'executivo', 'M88 96 L 112 95', 3.4],
  ['sbr_arqueada', 'Arqueada', 'clássico', 'M88 97 Q 100 91 112 95', 3.4],
  ['sbr_grossa', 'Grossa', 'urbano', 'M87 96 Q 100 92.5 113 95', 5],
  ['sbr_fina', 'Fina', 'clássico', 'M89 96 Q 101 92.8 111 95', 2],
  ['sbr_angular', 'Angular', 'gamer', 'M88 97.5 L 103 93 L 112 95.5', 3.6],
  ['sbr_suave', 'Suave', 'casual', 'M89 96.5 Q 100 93.5 111 95.5', 3],
  ['sbr_cheia', 'Cheia', 'casual', 'M86.5 96.5 Q 100 91.8 113.5 95.2', 5.6],
  ['sbr_serena', 'Serena', 'clássico', 'M89 95 Q 100 94 111 96', 3],
  ['sbr_marcada', 'Marcada', 'urbano', 'M87 98 Q 101 92 113 94.5', 4.4],
];

export const SOBRANCELHAS_PREMIUM: ParteDef[] = [
  ...SOBR_DEFS.map(([id, nome, tema, d, esp]): ParteDef => ({
    ...comumSobr, id, nome: `Sobrancelha ${nome}`, tema,
    descricao: `Traço ${nome.toLowerCase()} vivo por cima do cozido da base.`,
    render: (p) => parSobrancelha(tpSobr(p), d, esp),
  })),
  {
    ...comumSobr, id: 'sbr_unida', nome: 'Sobrancelha Unida', tema: 'fantasia',
    descricao: 'Uma linha só, sem pedir desculpa.',
    render: (p) => { const t = tpSobr(p); return `${parSobrancelha(t, 'M88 96 Q 100 92.5 113 95', 4.2)}
      <path d="M113 95 Q 120 94 127 95" stroke="${alfa(t.escuro, 0.85)}" stroke-width="3" fill="none" stroke-linecap="round"/>`; },
  },
];

// ── NARIZES (nar_*) — overlay de pele sobre o nariz integrado ───────────

/** Patch de pele que assenta o overlay sobre o nariz cozido da base. */
function baseNariz(t: TP): string {
  return `<ellipse cx="120" cy="127" rx="10" ry="13" fill="${alfa(t.base, 0.9)}"/>
    <ellipse cx="117" cy="122" rx="4.5" ry="7" fill="${alfa(t.claro, 0.5)}"/>`;
}

function narinas(t: TP, dx: number, y: number, r: number): string {
  return `<ellipse cx="${120 - dx}" cy="${y}" rx="${r}" ry="${r * 0.62}" fill="${alfa(t.profundo, 0.42)}"/>
    <ellipse cx="${120 + dx}" cy="${y}" rx="${r}" ry="${r * 0.62}" fill="${alfa(t.profundo, 0.42)}"/>`;
}

const comumNar = {
  categoria: 'nariz' as const, raridade: 'comum' as const,
  requerBase: HUMANOIDES, acabamento: 'premium' as const,
  usaCores: ['pele' as const],
};

const NAR_DEFS: Array<[string, string, string, (t: TP) => string]> = [
  ['nar_reto', 'Reto', 'executivo', (t) => `${baseNariz(t)}
    <path d="M117 114 L 116.5 130 Q 118 134 121 134" stroke="${alfa(t.escuro, 0.5)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>${narinas(t, 5.5, 133, 2)}`],
  ['nar_fino', 'Fino', 'clássico', (t) => `${baseNariz(t)}
    <path d="M118 113 L 117.5 131 Q 119 133.5 121 133.5" stroke="${alfa(t.escuro, 0.45)}" stroke-width="1.2" fill="none" stroke-linecap="round"/>${narinas(t, 4.2, 133, 1.6)}`],
  ['nar_largo', 'Largo', 'casual', (t) => `${baseNariz(t)}
    <path d="M116 116 Q 113 128 112 132 Q 116 136 120 136 Q 124 136 128 132 Q 127 128 124 116" stroke="${alfa(t.escuro, 0.4)}" stroke-width="1.4" fill="none" stroke-linecap="round"/>${narinas(t, 7, 133.5, 2.6)}`],
  ['nar_arrebitado', 'Arrebitado', 'casual', (t) => `${baseNariz(t)}
    <path d="M117 115 Q 115 127 117 130 Q 119 132.5 122.5 131.5" stroke="${alfa(t.escuro, 0.45)}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="120" cy="129" rx="4.6" ry="3" fill="${alfa(t.claro, 0.55)}"/>${narinas(t, 5.2, 132, 2)}`],
  ['nar_aquilino', 'Aquilino', 'fantasia', (t) => `${baseNariz(t)}
    <path d="M117 113 Q 121 121 119 127 L 117.5 131 Q 119.5 134 122 133.5" stroke="${alfa(t.escuro, 0.55)}" stroke-width="1.7" fill="none" stroke-linecap="round"/>${narinas(t, 5.4, 133, 1.9)}`],
  ['nar_botao', 'Botão', 'casual', (t) => `<ellipse cx="120" cy="128" rx="7.5" ry="8.5" fill="${alfa(t.base, 0.9)}"/>
    <ellipse cx="118" cy="125" rx="3.4" ry="4" fill="${alfa(t.claro, 0.6)}"/>
    <ellipse cx="120" cy="131" rx="5.4" ry="4" fill="${alfa(t.meio, 0.5)}"/>${narinas(t, 4.4, 132.5, 1.7)}`],
  ['nar_forte', 'Forte', 'urbano', (t) => `${baseNariz(t)}
    <path d="M116 113 L 114.5 129 Q 116 134.5 120 135 Q 124 134.5 125.5 129 L 124 113" stroke="${alfa(t.escuro, 0.5)}" stroke-width="1.9" fill="none" stroke-linecap="round"/>${narinas(t, 6.2, 133.5, 2.4)}`],
  ['nar_suave', 'Suave', 'clássico', (t) => `${baseNariz(t)}
    <path d="M117.5 116 Q 116.5 127 118 131.5 Q 119.5 133.5 121.5 133" stroke="${alfa(t.escuro, 0.35)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>${narinas(t, 4.8, 132.8, 1.7)}`],
];

export const NARIZES_PREMIUM: ParteDef[] = NAR_DEFS.map(([id, nome, tema, corpo]): ParteDef => ({
  ...comumNar, id, nome: `Nariz ${nome}`, tema,
  descricao: `Perfil ${nome.toLowerCase()} assentado sobre o nariz da base.`,
  render: (p) => corpo(tintaPremium(p.pele.base)),
}));

// ── OVERLAY DE IDADE (#162): 'adult' é o neutro e não desenha nada ──────

export function overlayIdade(p: Paleta, idade: 'young_adult' | 'mature'): string {
  const t = tintaPremium(p.pele.base);
  if (idade === 'young_adult') {
    return `<g fill="none">
      <ellipse cx="98" cy="126" rx="7" ry="4.4" fill="${alfa('#ffffff', 0.1)}"/>
      <ellipse cx="142" cy="126" rx="7" ry="4.4" fill="${alfa('#ffffff', 0.1)}"/>
      <path d="M96 122 q 4 -2.4 8 -1.2 M136 120.8 q 4 -1.2 8 1.2" stroke="${alfa('#ffffff', 0.16)}" stroke-width="1.4" stroke-linecap="round"/>
    </g>`;
  }
  return `<g stroke="${alfa(t.escuro, 0.32)}" stroke-width="1.2" fill="none" stroke-linecap="round">
    <path d="M104 82 q 16 -4 32 0 M106 88 q 14 -3 28 0"/>
    <path d="M108 130 Q 104 140 106 148 M132 130 Q 136 140 134 148"/>
    <path d="M84 106 q -4 2 -6 5 M84 111 q -3.4 1.6 -5.4 4 M156 106 q 4 2 6 5 M156 111 q 3.4 1.6 5.4 4"/>
    <path d="M108 158 q 12 4 24 0" stroke="${alfa(t.escuro, 0.22)}"/>
  </g>`;
}
