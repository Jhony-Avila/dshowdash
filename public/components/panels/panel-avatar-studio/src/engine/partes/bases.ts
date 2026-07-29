// engine/partes/bases.ts — bases (rosto/cabeça) do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// A base desenha pescoço + cabeça + orelhas + sombreamento e é a ÚNICA
// categoria obrigatória. Todas usam o slot `pele` com luz vinda do alto-esquerdo.
import { alfa } from '../cores';
import { G, PATH_PESCOCO } from '../base-api';
import type { ParteDef } from '../base-api';

/** defs de pele compartilhados: gradiente principal + sombra do pescoço. */
function defsPele(u: string, claro: string, base: string, escuro: string): string {
  return `
    <radialGradient id="${u}pele" cx="0.38" cy="0.28" r="1">
      <stop offset="0" stop-color="${claro}"/>
      <stop offset="0.58" stop-color="${base}"/>
      <stop offset="1" stop-color="${escuro}"/>
    </radialGradient>
    <linearGradient id="${u}pesc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${escuro}"/>
      <stop offset="1" stop-color="${base}"/>
    </linearGradient>`;
}

/** Luz de contorno no topo da cabeça (rim light AAA). */
function rimLight(): string {
  return `<path d="M80 72 a 52 58 0 0 1 44 -22" stroke="${alfa('#ffffff', 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
}

export const BASES: ParteDef[] = [
  {
    id: 'bas_classica',
    categoria: 'base',
    nome: 'Clássica',
    descricao: 'Rosto oval suave com iluminação de estúdio.',
    raridade: 'comum',
    tema: 'clássico',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}pele)"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="71.5" cy="${G.orelhaY}" rx="4" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="168.5" cy="${G.orelhaY}" rx="4" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="120" cy="152" rx="20" ry="7" fill="${alfa(p.pele.profundo, 0.28)}"/>
      ${rimLight()}`,
  },
  {
    id: 'bas_angular',
    categoria: 'base',
    nome: 'Angular',
    descricao: 'Maxilar marcado e traços firmes de protagonista.',
    raridade: 'incomum',
    tema: 'clássico',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <path d="M120 49 c 30 0 50 22 50 52 c0 18 -6 33 -18 45 l -20 16 c -7 5 -17 5 -24 0 l -20 -16 c -12 -12 -18 -27 -18 -45 c0 -30 20 -52 50 -52 z" fill="url(#${u}pele)"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <path d="M92 150 q 28 14 56 0" stroke="${alfa(p.pele.profundo, 0.22)}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="120" cy="154" rx="18" ry="6" fill="${alfa(p.pele.profundo, 0.26)}"/>
      ${rimLight()}`,
  },
  {
    id: 'bas_androide',
    categoria: 'base',
    nome: 'Androide',
    descricao: 'Chassi sintético polido com pods auriculares de LED.',
    raridade: 'epico',
    tema: 'tecnologia',
    usaCores: ['pele', 'destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}metal" x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stop-color="${p.pele.claro}"/>
          <stop offset="0.5" stop-color="${p.pele.base}"/>
          <stop offset="1" stop-color="${p.pele.profundo}"/>
        </linearGradient>
        <linearGradient id="${u}pescA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.pele.profundo}"/>
          <stop offset="1" stop-color="${p.pele.escuro}"/>
        </linearGradient>
      </defs>
      <path d="M105 146 h30 v40 c0 8 -30 8 -30 0 z" fill="url(#${u}pescA)"/>
      <rect x="107" y="150" width="26" height="4" rx="2" fill="${alfa(p.destaque.base, 0.8)}"/>
      <rect x="107" y="160" width="26" height="3" rx="1.5" fill="${alfa('#000000', 0.35)}"/>
      <path d="M120 50 c 29 0 49 21 49 51 c0 22 -8 38 -22 49 c -8 6 -16 9 -27 9 s -19 -3 -27 -9 c -14 -11 -22 -27 -22 -49 c0 -30 20 -51 49 -51 z" fill="url(#${u}metal)"/>
      <path d="M120 50 v 109" stroke="${alfa('#000000', 0.18)}" stroke-width="1.4"/>
      <path d="M74 128 h 92" stroke="${alfa('#000000', 0.15)}" stroke-width="1.2"/>
      <path d="M96 158 h48 l-6 7 h-36 z" fill="${alfa('#000000', 0.22)}"/>
      <rect x="62" y="98" width="14" height="28" rx="7" fill="${p.pele.profundo}"/>
      <rect x="164" y="98" width="14" height="28" rx="7" fill="${p.pele.profundo}"/>
      <rect x="66" y="104" width="6" height="16" rx="3" fill="${p.destaque.base}"/>
      <rect x="168" y="104" width="6" height="16" rx="3" fill="${p.destaque.base}"/>
      ${rimLight()}`,
  },
  {
    id: 'bas_holo',
    categoria: 'base',
    nome: 'Holograma',
    descricao: 'Projeção volumétrica translúcida com varredura de luz.',
    raridade: 'lendario',
    tema: 'tecnologia',
    usaCores: ['pele', 'destaque'],
    render: (p, u) => {
      let scan = '';
      for (let i = 0; i < 12; i++) {
        scan += `<rect x="66" y="${52 + i * 10}" width="108" height="1.4" fill="${alfa(p.destaque.claro, 0.16)}"/>`;
      }
      return `
      <defs>
        <radialGradient id="${u}holo" cx="0.4" cy="0.3" r="1">
          <stop offset="0" stop-color="${alfa(p.pele.claro, 0.85)}"/>
          <stop offset="0.6" stop-color="${alfa(p.pele.base, 0.72)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0.55)}"/>
        </radialGradient>
      </defs>
      <path d="M104 146 h32 v38 c0 9 -32 9 -32 0 z" fill="${alfa(p.destaque.base, 0.4)}"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}holo)" stroke="${alfa(p.destaque.claro, 0.8)}" stroke-width="1.6"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${alfa(p.pele.base, 0.6)}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="${alfa(p.pele.base, 0.6)}"/>
      <g clip-path="ellipse(50px 57px at 120px 106px)">${scan}</g>
      <ellipse cx="120" cy="196" rx="34" ry="6" fill="${alfa(p.destaque.base, 0.5)}">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.6s" repeatCount="indefinite"/>
      </ellipse>
      ${rimLight()}`;
    },
  },
];
