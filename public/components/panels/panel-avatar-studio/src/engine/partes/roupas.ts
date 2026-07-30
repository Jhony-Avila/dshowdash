// engine/partes/roupas.ts — vestuário (busto/ombros) do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Partem do PATH_OMBROS e cobrem a emenda do pescoço. Slot `roupa` +
// detalhes em `destaque`. Luz do alto-esquerdo, sombra do pescoço incluída.
import { alfa } from '../cores';
import { PATH_OMBROS } from '../base-api';
import type { ParteDef } from '../base-api';

function defsRoupa(u: string, claro: string, base: string, profundo: string): string {
  return `
    <linearGradient id="${u}rou" x1="0.15" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${claro}"/>
      <stop offset="0.4" stop-color="${base}"/>
      <stop offset="1" stop-color="${profundo}"/>
    </linearGradient>`;
}

/** Sombra projetada pela cabeça sobre o peito. */
const SOMBRA_PESCOCO = `<path d="M96 186 c 6 10 42 10 48 0 c -2 12 -46 12 -48 0 z" fill="rgba(0,0,0,0.25)"/>`;

export const ROUPAS: ParteDef[] = [
  {
    id: 'rou_camiseta',
    categoria: 'roupa',
    nome: 'Camiseta',
    descricao: 'Básica de algodão, conforto absoluto.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['roupa'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M98 184 c 8 12 36 12 44 0 c 0 10 -8 16 -22 16 s -22 -6 -22 -16 z" fill="${p.roupa.profundo}"/>
      ${SOMBRA_PESCOCO}
      <path d="M52 226 c 10 -18 30 -28 48 -32" stroke="${alfa('#ffffff', 0.14)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
    renderCorpo: (_p, _u) => `
      <path d="M104 108 q 16 10 32 0 l -4 8 q -12 8 -24 0 z" fill="${alfa('#000000', 0.22)}"/>
      <path d="M96 196 h20 v2 h-20 z" fill="${alfa('#000000', 0.18)}"/>
    `,
  },
  {
    id: 'rou_regata',
    categoria: 'roupa',
    nome: 'Regata Treino',
    descricao: 'Para o dia de treino... de digitação intensa.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['roupa', 'pele'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="M36 240 v-12 c0 -26 32 -44 66 -46 l -22 20 v 38 z" fill="${p.pele.escuro}"/>
      <path d="M204 240 v-12 c0 -26 -32 -44 -66 -46 l 22 20 v 38 z" fill="${p.pele.escuro}"/>
      <path d="M80 202 l 22 -20 c 4 10 32 10 36 0 l 22 20 v 38 h -80 z" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}`,
    renderCorpo: (p, _u) => `
      <path d="M86 108 l 18 0 l -8 26 q -8 -4 -12 -12 z" fill="${p.pele.base}"/>
      <path d="M154 108 l -18 0 l 8 26 q 8 -4 12 -12 z" fill="${p.pele.base}"/>
      <path d="M104 108 q 16 12 32 0 l -3 10 q -13 9 -26 0 z" fill="${alfa('#000000', 0.24)}"/>
    `,
  },
  {
    id: 'rou_social',
    categoria: 'roupa',
    nome: 'Camisa Social',
    descricao: 'Colarinho impecável para fechar contratos.',
    raridade: 'incomum',
    tema: 'executivo',
    usaCores: ['roupa'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}
      <path d="M120 196 l -14 44 h 28 z" fill="${alfa('#ffffff', 0.12)}"/>
      <path d="M98 184 l 22 14 l -14 10 l -12 -16 z" fill="${p.roupa.claro}"/>
      <path d="M142 184 l -22 14 l 14 10 l 12 -16 z" fill="${p.roupa.claro}"/>
      <circle cx="120" cy="216" r="1.8" fill="${p.roupa.profundo}"/>
      <circle cx="120" cy="230" r="1.8" fill="${p.roupa.profundo}"/>`,
    renderCorpo: (_p, _u) => `
      <path d="M104 108 l 16 14 l 16 -14 l 6 6 l -22 18 l -22 -18 z" fill="#f2f4fa"/>
      <path d="M120 140 v 70" stroke="${alfa('#000000', 0.25)}" stroke-width="2"/>
      <circle cx="120" cy="152" r="1.8" fill="${alfa('#000000', 0.4)}"/>
      <circle cx="120" cy="170" r="1.8" fill="${alfa('#000000', 0.4)}"/>
      <circle cx="120" cy="188" r="1.8" fill="${alfa('#000000', 0.4)}"/>
    `,
  },
  {
    id: 'rou_hoodie',
    categoria: 'roupa',
    nome: 'Hoodie Dev',
    descricao: 'Capuz nas costas e cordões — uniforme de quem builda.',
    raridade: 'incomum',
    tema: 'gamer',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="M66 240 c -10 -30 6 -52 24 -58 l 10 14 c -14 22 -14 30 -12 44 z" fill="${p.roupa.profundo}"/>
      <path d="M174 240 c 10 -30 -6 -52 -24 -58 l -10 14 c 14 22 14 30 12 44 z" fill="${p.roupa.profundo}"/>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}
      <path d="M96 184 c 8 14 40 14 48 0 c 4 8 -6 18 -24 18 s -28 -10 -24 -18 z" fill="${p.roupa.profundo}"/>
      <line x1="108" y1="200" x2="106" y2="228" stroke="${p.destaque.base}" stroke-width="3.4" stroke-linecap="round"/>
      <line x1="132" y1="200" x2="134" y2="228" stroke="${p.destaque.base}" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="106" cy="230" r="2.6" fill="${p.destaque.claro}"/>
      <circle cx="134" cy="230" r="2.6" fill="${p.destaque.claro}"/>
      <path d="M84 240 v-20 m 72 20 v-20" stroke="${alfa('#000000', 0.2)}" stroke-width="3"/>`,
    renderCorpo: (p, _u) => `
      <path d="M98 106 q 22 20 44 0 l 4 10 q -26 20 -52 0 z" fill="${p.roupa.profundo}"/>
      <path d="M112 126 l -4 30 M128 126 l 4 30" stroke="#f2f4fa" stroke-width="3" stroke-linecap="round"/>
      <circle cx="108" cy="158" r="2.4" fill="#f2f4fa"/>
      <circle cx="132" cy="158" r="2.4" fill="#f2f4fa"/>
      <path d="M96 176 h48 v26 h-48 z" fill="${alfa('#000000', 0.16)}" rx="6"/>
    `,
  },
  {
    id: 'rou_jaqueta',
    categoria: 'roupa',
    nome: 'Jaqueta Racer',
    descricao: 'Jaqueta esportiva com listras de velocidade.',
    raridade: 'raro',
    tema: 'esporte',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}
      <path d="M40 226 c 2 -20 20 -34 44 -40 l 6 8 c -22 6 -38 18 -42 36 z" fill="${p.destaque.base}"/>
      <path d="M200 226 c -2 -20 -20 -34 -44 -40 l -6 8 c 22 6 38 18 42 36 z" fill="${p.destaque.base}"/>
      <path d="M120 198 v 42" stroke="${p.roupa.profundo}" stroke-width="6"/>
      <path d="M120 198 v 42" stroke="${alfa('#c9d4e8', 0.9)}" stroke-width="2" stroke-dasharray="5 4"/>
      <path d="M94 186 c 8 12 44 12 52 0 l 6 8 c -10 12 -54 12 -64 0 z" fill="${p.roupa.profundo}"/>`,
    renderCorpo: (p, _u) => `
      <path d="M120 110 v 100" stroke="${p.roupa.profundo}" stroke-width="6"/>
      <path d="M120 110 v 100" stroke="${alfa('#ffffff', 0.35)}" stroke-width="1.6"/>
      <path d="M104 108 l 14 18 l -12 8 z" fill="${p.roupa.profundo}"/>
      <path d="M136 108 l -14 18 l 12 8 z" fill="${p.roupa.profundo}"/>
      <path d="M92 206 h56 v6 h-56 z" fill="${p.roupa.profundo}"/>
    `,
  },
  {
    id: 'rou_gamer',
    categoria: 'roupa',
    nome: 'Jersey Pro Player',
    descricao: 'Camisa oficial de time com raio no peito.',
    raridade: 'raro',
    tema: 'gamer',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}
      <path d="M44 222 l 40 -34 l 6 8 l -44 34 z" fill="${alfa(p.destaque.base, 0.85)}"/>
      <path d="M196 222 l -40 -34 l -6 8 l 44 34 z" fill="${alfa(p.destaque.base, 0.85)}"/>
      <path d="M127 202 l -17 19 h 9 l -6 17 l 18 -21 h -9 z" fill="${p.destaque.claro}" stroke="${p.destaque.profundo}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M98 184 c 10 10 34 10 44 0 c 2 6 -8 12 -22 12 s -24 -6 -22 -12 z" fill="${p.roupa.profundo}"/>`,
    renderCorpo: (p, _u) => `
      <path d="M116 132 l 12 0 l -8 14 l 10 0 l -18 26 l 5 -18 l -9 0 z" fill="${p.destaque.claro}"/>
      <path d="M90 112 v 96" stroke="${p.destaque.base}" stroke-width="3"/>
      <path d="M150 112 v 96" stroke="${p.destaque.base}" stroke-width="3"/>
    `,
  },
  {
    id: 'rou_terno',
    categoria: 'roupa',
    nome: 'Terno Executivo',
    descricao: 'Alfaiataria completa com gravata — nível diretoria.',
    raridade: 'epico',
    tema: 'executivo',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M106 190 l 14 12 l 14 -12 v 50 h -28 z" fill="#f4f6fa"/>
      <path d="M114 203 l 6 -6 l 6 6 l -6 6 z" fill="${p.destaque.escuro}"/>
      <path d="M120 208 l -6 9 l 6 23 l 6 -23 z" fill="${p.destaque.base}"/>
      <path d="M97 186 c 5 7 13 13 22 16 l -13 24 c -8 -12 -11 -26 -9 -40 z" fill="${p.roupa.profundo}"/>
      <path d="M143 186 c -5 7 -13 13 -22 16 l 13 24 c 8 -12 11 -26 9 -40 z" fill="${p.roupa.profundo}"/>
      <path d="M97 186 c 5 7 13 13 22 16" stroke="${alfa('#ffffff', 0.14)}" stroke-width="2" fill="none"/>
      <path d="M143 186 c -5 7 -13 13 -22 16" stroke="${alfa('#ffffff', 0.14)}" stroke-width="2" fill="none"/>
      ${SOMBRA_PESCOCO}
      <rect x="58" y="216" width="12" height="5" rx="2" fill="${alfa('#ffffff', 0.3)}" transform="rotate(-22 64 218)"/>`,
    renderCorpo: (p, _u) => `
      <path d="M104 108 l 16 22 l 16 -22 l 8 10 l -24 34 l -24 -34 z" fill="#f2f4fa"/>
      <path d="M116 116 l 4 6 l 4 -6 l 4 6 l -8 44 l -8 -44 z" fill="${p.destaque.base}"/>
      <path d="M104 108 l -8 12 l 14 22 l 10 -12 z" fill="${p.roupa.profundo}"/>
      <path d="M136 108 l 8 12 l -14 22 l -10 -12 z" fill="${p.roupa.profundo}"/>
    `,
  },
  {
    id: 'rou_kimono',
    categoria: 'roupa',
    nome: 'Kimono do Dojo',
    descricao: 'Disciplina de samurai, prazo de sprint.',
    raridade: 'epico',
    tema: 'oriental',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}
      <path d="M96 184 l 24 30 l -14 26 h -20 c -2 -20 2 -40 10 -56 z" fill="${p.roupa.escuro}"/>
      <path d="M144 184 l -24 30 l 14 26 h 20 c 2 -20 -2 -40 -10 -56 z" fill="${p.roupa.escuro}"/>
      <path d="M96 184 l 24 30 l 24 -30" stroke="${alfa('#ffffff', 0.55)}" stroke-width="5" fill="none"/>
      <path d="M100 188 l 20 26 l 20 -26" stroke="${p.destaque.base}" stroke-width="2.4" fill="none"/>
      <rect x="86" y="226" width="68" height="12" fill="${p.destaque.base}"/>
      <rect x="112" y="224" width="16" height="16" rx="2" fill="${p.destaque.escuro}"/>`,
    renderCorpo: (p, _u) => `
      <path d="M104 108 l 34 66 l 0 34 l -14 0 z" fill="${alfa('#000000', 0.18)}"/>
      <path d="M136 108 l -34 66 l 0 8 l 40 -60 z" fill="${alfa('#ffffff', 0.28)}"/>
      <path d="M90 178 h60 v14 h-60 z" fill="${p.destaque.profundo}"/>
      <path d="M90 181 h60 v3 h-60 z" fill="${alfa('#ffffff', 0.25)}"/>
    `,
  },
  {
    id: 'rou_astronauta',
    categoria: 'roupa',
    nome: 'Traje Orbital',
    descricao: 'Homologado para vácuo, reuniões e segundas-feiras.',
    raridade: 'lendario',
    tema: 'espaço',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}ast" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0" stop-color="#f2f4f8"/>
          <stop offset="0.6" stop-color="#d5dae6"/>
          <stop offset="1" stop-color="#aeb6c9"/>
        </linearGradient>
      </defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}ast)"/>
      <path d="M92 182 a 30 18 0 0 0 56 0 l 8 6 a 38 24 0 0 1 -72 0 z" fill="${p.roupa.base}"/>
      <circle cx="78" cy="214" r="11" fill="${p.roupa.base}"/>
      <circle cx="162" cy="214" r="11" fill="${p.roupa.base}"/>
      <circle cx="78" cy="214" r="5" fill="${p.destaque.base}"/>
      <circle cx="162" cy="214" r="5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.4;1" dur="2.4s" repeatCount="indefinite"/>
      </circle>
      <rect x="104" y="206" width="32" height="22" rx="5" fill="#20242c"/>
      <rect x="108" y="210" width="24" height="5" rx="2.5" fill="${p.destaque.base}"/>
      <rect x="108" y="219" width="14" height="4" rx="2" fill="${alfa('#ffffff', 0.4)}"/>
      <path d="M52 226 c 8 -16 24 -26 44 -32" stroke="${alfa('#ffffff', 0.4)}" stroke-width="4" stroke-linecap="round" fill="none"/>
      ${SOMBRA_PESCOCO}`,
    renderCorpo: (p, _u) => `
      <ellipse cx="120" cy="122" rx="22" ry="9" fill="none" stroke="${p.destaque.base}" stroke-width="4"/>
      <rect x="104" y="140" width="14" height="10" rx="2" fill="${p.destaque.base}"/>
      <path d="M138 138 q 12 8 8 26" fill="none" stroke="${alfa('#000000', 0.3)}" stroke-width="4" stroke-linecap="round"/>
      <path d="M96 168 h48 v6 h-48 z" fill="${alfa('#000000', 0.2)}"/>
    `,
  },
  {
    id: 'rou_moletom_dshow',
    categoria: 'roupa',
    nome: 'Moletom Dshow',
    descricao: 'O uniforme não oficial de quem constrói o dash.',
    raridade: 'exclusivo',
    tema: 'dshow',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}
      <path d="M96 184 c 8 14 40 14 48 0 c 4 8 -6 18 -24 18 s -28 -10 -24 -18 z" fill="${p.roupa.profundo}"/>
      <circle cx="120" cy="222" r="15" fill="none" stroke="${p.destaque.base}" stroke-width="3"/>
      <path d="M114 214 v 16 c 8 2 14 -2 14 -8 s -6 -10 -14 -8 z" fill="${p.destaque.base}"/>
      <path d="M64 234 l 20 -10 m 92 10 l -20 -10" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="3" stroke-linecap="round"/>`,
    renderCorpo: (p, _u) => `
      <path d="M112 124 l -4 26 M128 124 l 4 26" stroke="#f2f4fa" stroke-width="3" stroke-linecap="round"/>
      <rect x="110" y="150" width="20" height="20" rx="4" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.55;1" dur="2.8s" repeatCount="indefinite"/>
      </rect>
      <rect x="115" y="155" width="10" height="10" rx="2" fill="#0a0e18"/>
    `,
  },
  {
    id: 'rou_armadura',
    categoria: 'roupa',
    nome: 'Armadura Nexus',
    descricao: 'Peitoral blindado com núcleo de energia pulsante.',
    raridade: 'lendario',
    tema: 'sci-fi',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>
        ${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}
        <radialGradient id="${u}nuc" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.4" stop-color="${p.destaque.claro}"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </radialGradient>
      </defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M44 240 v-8 c 0 -16 10 -28 26 -36 l 14 10 v 34 z" fill="${p.roupa.profundo}"/>
      <path d="M196 240 v-8 c 0 -16 -10 -28 -26 -36 l -14 10 v 34 z" fill="${p.roupa.profundo}"/>
      <path d="M46 210 l 36 -22 l 4 6 l -36 22 z" fill="${alfa(p.destaque.base, 0.65)}"/>
      <path d="M194 210 l -36 -22 l -4 6 l 36 22 z" fill="${alfa(p.destaque.base, 0.65)}"/>
      <path d="M92 196 h 56 l -6 44 h -44 z" fill="${p.roupa.escuro}" stroke="${p.roupa.profundo}" stroke-width="2"/>
      <circle cx="120" cy="216" r="11" fill="url(#${u}nuc)">
        <animate attributeName="r" values="11;12.5;11" dur="2.4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="120" cy="216" r="15" fill="none" stroke="${alfa(p.destaque.base, 0.6)}" stroke-width="2"/>
      <path d="M104 240 l 6 -14 m 26 14 l -6 -14" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="2"/>
      ${SOMBRA_PESCOCO}`,
    renderCorpo: (p, _u) => `
      <circle cx="120" cy="150" r="13" fill="${p.destaque.profundo}" stroke="${p.destaque.claro}" stroke-width="3"/>
      <circle cx="120" cy="150" r="6" fill="${p.destaque.claro}">
        <animate attributeName="opacity" values="1;0.45;1" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <path d="M92 128 l 16 8 l 0 44 l -16 -6 z" fill="${alfa('#ffffff', 0.14)}"/>
      <path d="M148 128 l -16 8 l 0 44 l 16 -6 z" fill="${alfa('#000000', 0.2)}"/>
      <path d="M92 196 h56 v6 h-56 z" fill="${p.destaque.base}"/>
    `,
  },
  // ── 4.6 F2 · Onda 2 (equipamentos) — 8 roupas novas ───────────────
  {
    id: 'rou_polo',
    categoria: 'roupa',
    nome: 'Polo',
    descricao: 'Gola firme, sexta casual garantida.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['roupa'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M100 184 l 20 12 l 20 -12 l 6 8 l -26 14 l -26 -14 z" fill="${p.roupa.claro}"/>
      <path d="M120 196 v 22" stroke="${p.roupa.profundo}" stroke-width="2.4"/>
      <circle cx="120" cy="204" r="1.8" fill="${p.roupa.claro}"/>
      <circle cx="120" cy="212" r="1.8" fill="${p.roupa.claro}"/>
      ${SOMBRA_PESCOCO}`,
    renderCorpo: (p, _u) => `
      <path d="M104 108 l 16 10 l 16 -10 l -4 12 l -12 8 l -12 -8 z" fill="${alfa('#000000', 0.2)}"/>
      <path d="M120 128 v 30" stroke="${alfa(p.roupa.profundo, 0.8)}" stroke-width="2"/>
      <circle cx="120" cy="136" r="1.6" fill="${p.roupa.claro}"/>
      <circle cx="120" cy="146" r="1.6" fill="${p.roupa.claro}"/>
      <path d="M86 190 h 68 v 3 h -68 z" fill="${alfa('#000000', 0.16)}"/>
    `,
  },
  {
    id: 'rou_flanela',
    categoria: 'roupa',
    nome: 'Flanela Xadrez',
    descricao: 'Xadrez de quem commita ouvindo lo-fi.',
    raridade: 'incomum',
    tema: 'casual',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => {
      let xadrez = '';
      for (let i = 0; i < 6; i++) {
        xadrez += `<line x1="${52 + i * 28}" y1="182" x2="${52 + i * 28}" y2="240" stroke="${alfa(p.destaque.base, 0.35)}" stroke-width="7"/>`;
      }
      for (let j = 0; j < 3; j++) {
        xadrez += `<line x1="36" y1="${196 + j * 18}" x2="204" y2="${196 + j * 18}" stroke="${alfa(p.destaque.base, 0.3)}" stroke-width="6"/>`;
      }
      return `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}
        <clipPath id="${u}fx"><path d="${PATH_OMBROS}"/></clipPath></defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <g clip-path="url(#${u}fx)">${xadrez}</g>
      <path d="M98 184 l 22 16 l -12 10 l -14 -18 z" fill="${p.roupa.escuro}"/>
      <path d="M142 184 l -22 16 l 12 10 l 14 -18 z" fill="${p.roupa.escuro}"/>
      ${SOMBRA_PESCOCO}`;
    },
    renderCorpo: (p, _u) => `
      <g opacity="0.5">
        <line x1="98" y1="108" x2="98" y2="200" stroke="${p.destaque.base}" stroke-width="5"/>
        <line x1="124" y1="108" x2="124" y2="200" stroke="${p.destaque.base}" stroke-width="5"/>
        <line x1="150" y1="108" x2="150" y2="200" stroke="${p.destaque.base}" stroke-width="5"/>
        <line x1="86" y1="132" x2="154" y2="132" stroke="${p.destaque.base}" stroke-width="4"/>
        <line x1="86" y1="162" x2="154" y2="162" stroke="${p.destaque.base}" stroke-width="4"/>
      </g>
      <path d="M116 108 l 4 10 l 4 -10 z" fill="${alfa('#000000', 0.25)}"/>
      <path d="M120 118 v 76" stroke="${alfa('#000000', 0.3)}" stroke-width="2.4"/>
    `,
  },
  {
    id: 'rou_colete',
    categoria: 'roupa',
    nome: 'Colete Tático',
    descricao: 'Bolsos para tudo — até para o carregador extra.',
    raridade: 'raro',
    tema: 'aventura',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M84 194 h 26 v 20 h -26 z" fill="${p.roupa.escuro}" stroke="${p.roupa.profundo}" stroke-width="2"/>
      <path d="M130 194 h 26 v 20 h -26 z" fill="${p.roupa.escuro}" stroke="${p.roupa.profundo}" stroke-width="2"/>
      <path d="M84 200 h 26 M130 200 h 26" stroke="${p.roupa.profundo}" stroke-width="2"/>
      <path d="M60 196 l 24 -12 M180 196 l -24 -12" stroke="${alfa(p.destaque.base, 0.7)}" stroke-width="4" stroke-linecap="round"/>
      <rect x="114" y="188" width="12" height="52" fill="${p.roupa.profundo}"/>
      <path d="M116 198 h 8 M116 212 h 8 M116 226 h 8" stroke="${alfa('#ffffff', 0.25)}" stroke-width="2"/>
      ${SOMBRA_PESCOCO}`,
    renderCorpo: (p, _u) => `
      <path d="M92 112 l 20 8 v 74 l -20 -4 z" fill="${alfa('#000000', 0.26)}"/>
      <path d="M148 112 l -20 8 v 74 l 20 -4 z" fill="${alfa('#000000', 0.26)}"/>
      <path d="M96 138 h 14 v 12 h -14 z M130 138 h 14 v 12 h -14 z" fill="${p.roupa.profundo}" stroke="${alfa('#ffffff', 0.15)}" stroke-width="1.4"/>
      <path d="M112 120 h 16 v 72 h -16 z" fill="${alfa(p.roupa.profundo, 0.9)}"/>
      <path d="M114 132 h 12 M114 150 h 12 M114 168 h 12" stroke="${alfa(p.destaque.base, 0.6)}" stroke-width="2"/>
    `,
  },
  {
    id: 'rou_smoking',
    categoria: 'roupa',
    nome: 'Smoking',
    descricao: 'Cetim na lapela e a noite inteira pela frente.',
    raridade: 'epico',
    tema: 'executivo',
    usaCores: ['roupa'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M104 186 l 16 18 l 16 -18 l 8 54 h -48 z" fill="#f4f0e6"/>
      <path d="M98 184 l 22 20 l -14 14 l -16 -26 z" fill="${p.roupa.profundo}"/>
      <path d="M142 184 l -22 20 l 14 14 l 16 -26 z" fill="${p.roupa.profundo}"/>
      <path d="M98 184 l 22 20 l -8 8 l -14 -20 z" fill="${alfa('#ffffff', 0.12)}"/>
      <path d="M110 204 h 20 l -4 6 h -12 z" fill="#14100c"/>
      <circle cx="112" cy="203" r="2.6" fill="#14100c"/>
      <circle cx="128" cy="203" r="2.6" fill="#14100c"/>
      <circle cx="120" cy="222" r="2" fill="#14100c"/>
      ${SOMBRA_PESCOCO}`,
    renderCorpo: (p, _u) => `
      <path d="M108 108 l 12 14 l 12 -14 l 2 84 h -28 z" fill="#f4f0e6"/>
      <path d="M104 108 l 16 16 l -10 12 l -12 -20 z" fill="${p.roupa.profundo}"/>
      <path d="M136 108 l -16 16 l 10 12 l 12 -20 z" fill="${p.roupa.profundo}"/>
      <path d="M112 124 h 16 l -3 5 h -10 z" fill="#14100c"/>
      <circle cx="120" cy="146" r="1.8" fill="#14100c"/>
      <circle cx="120" cy="162" r="1.8" fill="#14100c"/>
    `,
  },
  {
    id: 'rou_jersey',
    categoria: 'roupa',
    nome: 'Jersey E-sports',
    descricao: 'O uniforme oficial do time Dshow Nexus.',
    raridade: 'raro',
    tema: 'gamer',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M36 240 v-12 c 0 -14 8 -24 22 -32 l 10 44 z" fill="${p.destaque.base}"/>
      <path d="M204 240 v-12 c 0 -14 -8 -24 -22 -32 l -10 44 z" fill="${p.destaque.base}"/>
      <path d="M98 186 c 8 10 36 10 44 0 l 4 6 c -10 12 -42 12 -52 0 z" fill="${p.destaque.base}"/>
      <text x="120" y="226" text-anchor="middle" font-family="system-ui, sans-serif" font-size="26" font-weight="800" fill="${alfa('#ffffff', 0.85)}">07</text>
      ${SOMBRA_PESCOCO}`,
    renderCorpo: (p, _u) => `
      <path d="M86 108 l 22 6 v 80 l -22 -4 z" fill="${alfa(p.destaque.base, 0.55)}"/>
      <path d="M154 108 l -22 6 v 80 l 22 -4 z" fill="${alfa(p.destaque.base, 0.55)}"/>
      <text x="120" y="164" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="800" fill="${alfa('#ffffff', 0.85)}">07</text>
      <path d="M104 108 q 16 10 32 0 l -3 8 q -13 8 -26 0 z" fill="${alfa('#000000', 0.22)}"/>
    `,
  },
  {
    id: 'rou_sobretudo',
    categoria: 'roupa',
    nome: 'Sobretudo',
    descricao: 'Entra na sala e o vento entra junto.',
    raridade: 'epico',
    tema: 'aventura',
    usaCores: ['roupa'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M36 240 v -14 c 0 -20 16 -34 38 -42 l -6 56 z" fill="${p.roupa.profundo}"/>
      <path d="M204 240 v -14 c 0 -20 -16 -34 -38 -42 l 6 56 z" fill="${p.roupa.profundo}"/>
      <path d="M96 182 l 24 22 l -16 16 l -18 -30 z" fill="${p.roupa.escuro}"/>
      <path d="M144 182 l -24 22 l 16 16 l 18 -30 z" fill="${p.roupa.escuro}"/>
      <path d="M96 182 l 24 22 l -8 8 l -18 -24 z" fill="${alfa('#ffffff', 0.1)}"/>
      <path d="M116 210 h 8 v 30 h -8 z" fill="${alfa('#000000', 0.3)}"/>
      <circle cx="108" cy="216" r="2.2" fill="${p.roupa.claro}"/>
      <circle cx="132" cy="216" r="2.2" fill="${p.roupa.claro}"/>
      ${SOMBRA_PESCOCO}`,
    renderCorpo: (p, _u) => `
      <path d="M96 108 l 24 18 l -14 14 l -14 -24 z" fill="${p.roupa.escuro}"/>
      <path d="M144 108 l -24 18 l 14 14 l 14 -24 z" fill="${p.roupa.escuro}"/>
      <path d="M88 118 l 14 6 v 74 l -14 -4 z" fill="${alfa('#000000', 0.3)}"/>
      <path d="M152 118 l -14 6 v 74 l 14 -4 z" fill="${alfa('#000000', 0.3)}"/>
      <path d="M117 138 h 6 v 56 h -6 z" fill="${alfa('#000000', 0.32)}"/>
      <circle cx="110" cy="146" r="1.8" fill="${p.roupa.claro}"/>
      <circle cx="110" cy="162" r="1.8" fill="${p.roupa.claro}"/>
    `,
  },
  {
    id: 'rou_jaleco',
    categoria: 'roupa',
    nome: 'Jaleco',
    descricao: 'Ciência aplicada com bolso cheio de canetas.',
    raridade: 'incomum',
    tema: 'ciência',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}jal" x1="0.15" y1="0" x2="0.6" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.5" stop-color="#eef1f6"/>
          <stop offset="1" stop-color="#c9d0dd"/>
        </linearGradient>
      </defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}jal)"/>
      <path d="M100 184 l 20 18 l -12 12 l -14 -22 z" fill="#d7dde8"/>
      <path d="M140 184 l -20 18 l 12 12 l 14 -22 z" fill="#d7dde8"/>
      <path d="M104 200 l 16 14 l 16 -14 l 2 40 h -36 z" fill="${p.roupa.base}"/>
      <rect x="146" y="210" width="18" height="20" fill="#ffffff" stroke="#c9d0dd" stroke-width="1.6"/>
      <path d="M150 212 v 12 M155 212 v 14 M160 212 v 10" stroke="${p.destaque.base}" stroke-width="2.4" stroke-linecap="round"/>
      ${SOMBRA_PESCOCO}`,
    renderCorpo: (p, _u) => `
      <path d="M86 110 h 68 l -2 84 h -64 z" fill="${alfa('#ffffff', 0.82)}"/>
      <path d="M104 110 l 16 14 l 16 -14 l 0 12 l -16 12 l -16 -12 z" fill="#c9d0dd"/>
      <path d="M112 128 l 8 8 l 8 -8 v 64 h -16 z" fill="${p.roupa.base}"/>
      <path d="M92 150 h 12 v 14 h -12 z" fill="#ffffff" stroke="#c9d0dd" stroke-width="1.2"/>
      <path d="M95 152 v 8 M99 152 v 9" stroke="${p.destaque.base}" stroke-width="1.8" stroke-linecap="round"/>
    `,
  },
  {
    id: 'rou_neon_racer',
    categoria: 'roupa',
    nome: 'Jaqueta Neon Racer',
    descricao: 'Costura de luz viva — homologada para a madrugada.',
    raridade: 'lendario',
    tema: 'cyberpunk',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M52 222 c 16 -22 44 -34 68 -34 s 52 12 68 34" stroke="${p.destaque.base}" stroke-width="3.4" fill="none" stroke-linecap="round">
        <animate attributeName="opacity" values="1;0.45;1" dur="1.8s" repeatCount="indefinite"/>
      </path>
      <path d="M60 240 c 14 -20 36 -30 60 -30 s 46 10 60 30" stroke="${alfa(p.destaque.claro, 0.6)}" stroke-width="2" fill="none"/>
      <path d="M98 184 l 22 18 l -13 12 l -15 -22 z" fill="${p.roupa.escuro}"/>
      <path d="M142 184 l -22 18 l 13 12 l 15 -22 z" fill="${p.roupa.escuro}"/>
      <path d="M117 208 h 6 v 32 h -6 z" fill="${alfa(p.destaque.base, 0.8)}"/>
      ${SOMBRA_PESCOCO}`,
    renderCorpo: (p, _u) => `
      <path d="M90 120 l 18 8 v 66 l -18 -4 z" fill="${alfa('#000000', 0.28)}"/>
      <path d="M150 120 l -18 8 v 66 l 18 -4 z" fill="${alfa('#000000', 0.28)}"/>
      <path d="M96 130 q 24 -14 48 0" stroke="${p.destaque.base}" stroke-width="2.6" fill="none">
        <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite"/>
      </path>
      <path d="M96 176 q 24 14 48 0" stroke="${p.destaque.base}" stroke-width="2.6" fill="none">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite"/>
      </path>
      <path d="M118 128 h 4 v 66 h -4 z" fill="${alfa(p.destaque.base, 0.75)}"/>
    `,
  },
];
