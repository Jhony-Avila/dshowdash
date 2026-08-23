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
import { narizPremium } from './faces'; // Golden V3.2 §5: FONTE ÚNICA de nariz

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

/** onda 1427/Golden §46: STUBBLE = pequenos GRUPOS determinísticos de pelo
 *  acompanhando a mandíbula (não linhas verticais repetidas). Cada ponto é um
 *  cluster de 3 flecks; a pele aparece nos vãos (skin reveal §45). */
function fiosBarba(t: TP, ys: number, densidade: number): string {
  // Golden V3.1 §46: stubble = PELOS TAPERED (slivers finos) em ângulos
  // IRREGULARES (pseudo-aleatório determinístico por índice — sem grade/dots).
  const g: string[] = [];
  const rad = Math.PI / 180;
  for (let i = 0; i < densidade; i += 1) {
    const jx = Math.sin(i * 12.9) * 3.4, jy = Math.cos(i * 7.7) * 2.2;
    const x = 84 + (72 / (densidade - 1)) * i + jx;
    const y = ys + Math.abs(x - 120) * -0.28 + jy;
    const ang = (92 + Math.sin(i * 2.1) * 26) * rad;         // quase p/ baixo, variado
    const len = 2.4 + (i % 4) * 0.9;
    const dx = Math.cos(ang) * len, dy = Math.sin(ang) * len;
    const nx = -Math.sin(ang) * 0.65, ny = Math.cos(ang) * 0.65;
    const col = i % 5 === 0 ? alfa('#ffffff', 0.2) : (i % 3 === 0 ? alfa(t.profundo, 0.5) : alfa(t.escuro, 0.62));
    g.push(`<path d="M${(x + nx).toFixed(1)} ${(y + ny).toFixed(1)} L ${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)} L ${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)} Z" fill="${col}"/>`);
  }
  return g.join('');
}

/** onda 1427/Golden §47: quebra de borda inferior — flecks irregulares no
 *  contorno da barba cheia (não shape geométrico perfeito). */
function bordaBarba(t: TP, ys: number): string {
  const g: string[] = [];
  const xs = [92, 102, 112, 120, 128, 138, 148];
  for (let i = 0; i < xs.length; i += 1) {
    const x = xs[i]; const dy = (i % 2 ? 3 : 6) + (i % 3);
    const y = ys + Math.abs(x - 120) * -0.18;
    g.push(`<path d="M${x - 2} ${y} q 2 ${dy} 4 0 z" fill="${alfa(t.escuro, 0.55)}"/>`);
  }
  return g.join('');
}

/** Golden V3 (#219 §45-51): BARBA CHEIA reconstruída — massa densa no
 *  queixo/mandíbula que FADE (dissolve em pele) subindo pelas bochechas, com
 *  costeleta conectando à têmpora, stubble na zona de fade (skin reveal) e
 *  borda quebrada. SEM banda especular horizontal (§48). Bigode entra separado
 *  (extra). Oclusão sob o queixo dá o volume. */
function massaBarba(u: string, t: TP, queixoY: number, extra = ''): string {
  // massa PLENA só do meio da mandíbula p/ baixo (queixo cheio); as bochechas
  // recebem só a zona de fade (stubble → pele).
  const nucleo = `M84 128 C 80 ${queixoY - 10} 92 ${queixoY - 2} 120 ${queixoY + 8}`
    + ` C 148 ${queixoY - 2} 160 ${queixoY - 10} 156 128`
    + ` C 148 138 134 142 120 142 C 106 142 92 138 84 128 Z`;
  const clip = `${u}pxbclip`;
  const cheekFade = `${u}pxbfade`;
  // costeletas (sideburn) conectando à têmpora
  const costeleta = `M80 108 C 78 120 80 130 86 136 L 92 134 C 88 126 86 118 86 110 Z`
    + ` M160 108 C 162 120 160 130 154 136 L 148 134 C 152 126 154 118 154 110 Z`;
  return `<defs>
      <clipPath id="${clip}"><path d="${nucleo}"/></clipPath>
      <linearGradient id="${cheekFade}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${alfa(t.base, 0)}"/><stop offset="0.55" stop-color="${alfa(t.base, 0.5)}"/><stop offset="1" stop-color="${t.base}"/></linearGradient>
    </defs>
    <!-- costeletas -->
    <path d="${costeleta}" fill="url(#${u}pxbrb)"/>
    <!-- zona de fade nas bochechas (barba dissolve em pele subindo) -->
    <path d="M86 112 C 84 124 88 134 96 140 C 110 146 130 146 144 140 C 152 134 156 124 154 112 C 150 128 138 136 120 136 C 102 136 90 128 86 112 Z" fill="url(#${cheekFade})"/>
    <!-- núcleo denso do queixo/mandíbula -->
    <path d="${nucleo}" fill="url(#${u}pxbrb)"/>
    <g clip-path="url(#${clip})">
      <!-- densidade: queixo mais cheio (centro-baixo), mandíbula mais rala nas pontas -->
      <path d="M100 ${queixoY - 2} C 108 ${queixoY + 10} 132 ${queixoY + 10} 140 ${queixoY - 2} C 136 ${queixoY + 12} 104 ${queixoY + 12} 100 ${queixoY - 2} Z" fill="${alfa(t.profundo, 0.45)}"/>
      <!-- leve luz no queixo (não banda horizontal): pontinhos §46 -->
      ${fiosBarba(t, queixoY - 6, 9)}
    </g>
    <!-- stubble na zona de fade (skin reveal) + borda quebrada -->
    <g opacity="0.85">${fiosBarba(t, 122, 11)}${fiosBarba(t, 130, 10)}</g>
    ${bordaBarba(t, queixoY + 6)}
    <!-- oclusão sob o lábio inferior (recorte da boca) -->
    <path d="M107 149 Q 120 154 133 149 Q 129 145 120 145 Q 111 145 107 149 Z" fill="${alfa(t.profundo, 0.4)}"/>${extra}`;
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
  // §6.2: acompanha o brow ridge, menos "faixa preta chapada" — traço principal
  // com leve transparência (não preto puro) e ~10% mais fino.
  const esp = espessura * 0.9;
  const corPrinc = alfa(t.escuro, 0.9);
  return `<g stroke-linecap="round" fill="none">
    <path d="${d}" stroke="${corPrinc}" stroke-width="${esp}"/>
    <path d="${d}" stroke="${alfa(t.claro, 0.32)}" stroke-width="${Math.max(0.7, esp - 2)}" transform="translate(0 -0.7)"/>
    <g transform="translate(240 0) scale(-1 1)">
      <path d="${d}" stroke="${corPrinc}" stroke-width="${esp}"/>
      <path d="${d}" stroke="${alfa(t.claro, 0.32)}" stroke-width="${Math.max(0.7, esp - 2)}" transform="translate(0 -0.7)"/>
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

// ── NARIZES (nar_*) — Golden V3.2 §5: FONTE ÚNICA ──────────────────────
// Cada nar_* é o nariz AUTORITATIVO (único) via narizPremium — a base não
// desenha mais nariz. Fim do `baseNariz` (cápsula de pele opaca) e das
// `narinas` duplicadas: narizPremium já traz asas+narinas integradas. Cada
// id mapeia para um estilo/comprimento; sem geometria empilhada, sem patch.
const comumNar = {
  categoria: 'nariz' as const, raridade: 'comum' as const,
  requerBase: HUMANOIDES, acabamento: 'premium' as const,
  usaCores: ['pele' as const],
};

const NAR_DEFS: Array<[string, string, string, (t: TP) => string]> = [
  ['nar_reto', 'Reto', 'executivo', (t) => narizPremium(t, 'reto', 0)],
  ['nar_fino', 'Fino', 'clássico', (t) => narizPremium(t, 'fino', 0)],
  ['nar_largo', 'Largo', 'casual', (t) => narizPremium(t, 'largo', 0)],
  ['nar_arrebitado', 'Arrebitado', 'casual', (t) => narizPremium(t, 'arrebitado', -1)],
  ['nar_aquilino', 'Aquilino', 'fantasia', (t) => narizPremium(t, 'aquilino', 1)],
  ['nar_botao', 'Botão', 'casual', (t) => narizPremium(t, 'curto', -1)],
  ['nar_forte', 'Forte', 'urbano', (t) => narizPremium(t, 'largo', 1)],
  ['nar_suave', 'Suave', 'clássico', (t) => narizPremium(t, 'fino', -1)],
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
