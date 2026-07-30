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
  },
];
