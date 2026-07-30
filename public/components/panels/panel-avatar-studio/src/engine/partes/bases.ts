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
  // ── 4.6 F2 · Onda 1 (identidade) — 6 rostos humanoides novos ──────
  {
    id: 'bas_redonda',
    categoria: 'base',
    nome: 'Redonda',
    descricao: 'Bochechas cheias e simpatia imediata.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <circle cx="${G.cx}" cy="${G.cabecaCy + 2}" r="54" fill="url(#${u}pele)"/>
      <ellipse cx="68" cy="${G.orelhaY}" rx="9" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="172" cy="${G.orelhaY}" rx="9" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="69.5" cy="${G.orelhaY}" rx="4" ry="6.5" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="170.5" cy="${G.orelhaY}" rx="4" ry="6.5" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="92" cy="128" rx="9" ry="6" fill="${alfa('#ff8d7a', 0.22)}"/>
      <ellipse cx="148" cy="128" rx="9" ry="6" fill="${alfa('#ff8d7a', 0.22)}"/>
      <ellipse cx="120" cy="154" rx="19" ry="6" fill="${alfa(p.pele.profundo, 0.24)}"/>
      ${rimLight()}`,
  },
  {
    id: 'bas_coracao',
    categoria: 'base',
    nome: 'Coração',
    descricao: 'Testa ampla e queixo delicado — simetria de capa.',
    raridade: 'incomum',
    tema: 'clássico',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <path d="M120 49 c 32 0 52 20 52 48 c0 16 -8 32 -20 44 l -24 20 c -5 4 -11 4 -16 0 l -24 -20 c -12 -12 -20 -28 -20 -44 c0 -28 20 -48 52 -48 z" fill="url(#${u}pele)"/>
      <ellipse cx="69" cy="${G.orelhaY - 2}" rx="9" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="171" cy="${G.orelhaY - 2}" rx="9" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="70.5" cy="${G.orelhaY - 2}" rx="4" ry="6" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="169.5" cy="${G.orelhaY - 2}" rx="4" ry="6" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="120" cy="152" rx="15" ry="5" fill="${alfa(p.pele.profundo, 0.24)}"/>
      ${rimLight()}`,
  },
  {
    id: 'bas_quadrada',
    categoria: 'base',
    nome: 'Quadrada',
    descricao: 'Mandíbula reta de quem não pula o treino.',
    raridade: 'incomum',
    tema: 'esportivo',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <path d="M120 50 c 28 0 48 16 48 44 v 28 c0 16 -6 28 -16 36 l -18 12 c -8 5 -20 5 -28 0 l -18 -12 c -10 -8 -16 -20 -16 -36 v -28 c0 -28 20 -44 48 -44 z" fill="url(#${u}pele)"/>
      <ellipse cx="69" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="171" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="70.5" cy="${G.orelhaY}" rx="4" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="169.5" cy="${G.orelhaY}" rx="4" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <path d="M96 154 h 48" stroke="${alfa(p.pele.profundo, 0.2)}" stroke-width="5" stroke-linecap="round"/>
      ${rimLight()}`,
  },
  {
    id: 'bas_longa',
    categoria: 'base',
    nome: 'Alongada',
    descricao: 'Traços finos e elegância de editorial.',
    raridade: 'raro',
    tema: 'executivo',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy + 2}" rx="44" ry="61" fill="url(#${u}pele)"/>
      <ellipse cx="76" cy="${G.orelhaY}" rx="8" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="164" cy="${G.orelhaY}" rx="8" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="77.5" cy="${G.orelhaY}" rx="3.5" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="162.5" cy="${G.orelhaY}" rx="3.5" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <path d="M104 128 q -4 6 0 12" stroke="${alfa(p.pele.profundo, 0.18)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M136 128 q 4 6 0 12" stroke="${alfa(p.pele.profundo, 0.18)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="120" cy="156" rx="15" ry="5" fill="${alfa(p.pele.profundo, 0.24)}"/>
      ${rimLight()}`,
  },
  {
    id: 'bas_marcada',
    categoria: 'base',
    nome: 'Marcada',
    descricao: 'Uma cicatriz, mil histórias — nenhuma delas calma.',
    raridade: 'raro',
    tema: 'aventura',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <path d="M120 49 c 30 0 50 22 50 52 c0 18 -6 33 -18 45 l -20 16 c -7 5 -17 5 -24 0 l -20 -16 c -12 -12 -18 -27 -18 -45 c0 -30 20 -52 50 -52 z" fill="url(#${u}pele)"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <path d="M146 84 l 10 22" stroke="${alfa('#a0432f', 0.75)}" stroke-width="3" stroke-linecap="round"/>
      <path d="M144 90 l 8 -3 M147 97 l 8 -3" stroke="${alfa('#a0432f', 0.6)}" stroke-width="2" stroke-linecap="round"/>
      <path d="M88 126 q 6 4 12 2" stroke="${alfa(p.pele.profundo, 0.28)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M152 126 q -6 4 -12 2" stroke="${alfa(p.pele.profundo, 0.28)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="120" cy="153" rx="17" ry="6" fill="${alfa(p.pele.profundo, 0.26)}"/>
      ${rimLight()}`,
  },
  {
    id: 'bas_sardas',
    categoria: 'base',
    nome: 'Sardas',
    descricao: 'Constelação própria nas bochechas.',
    raridade: 'incomum',
    tema: 'casual',
    usaCores: ['pele'],
    render: (p, u) => {
      const sardas = [[96, 124], [104, 130], [112, 126], [128, 126], [136, 130], [144, 124], [100, 134], [140, 134]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${alfa(p.pele.profundo, 0.5)}"/>`)
        .join('');
      return `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}pele)"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="71.5" cy="${G.orelhaY}" rx="4" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="168.5" cy="${G.orelhaY}" rx="4" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      ${sardas}
      <ellipse cx="120" cy="152" rx="20" ry="7" fill="${alfa(p.pele.profundo, 0.28)}"/>
      ${rimLight()}`;
    },
  },
  // ── 4.6 F2 · Onda 7 — 6 rostos humanoides novos ───────────────────
  {
    id: 'bas_triangular',
    categoria: 'base',
    nome: 'Triangular',
    descricao: 'Mandíbula larga, decisões mais largas ainda.',
    raridade: 'incomum',
    tema: 'esportivo',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <path d="M120 50 c 24 0 40 14 42 38 c 2 22 -2 40 -12 52 l -16 14 c -8 7 -20 7 -28 0 l -16 -14 c -10 -12 -14 -30 -12 -52 c 2 -24 18 -38 42 -38 z" fill="url(#${u}pele)"/>
      <ellipse cx="74" cy="${G.orelhaY}" rx="8" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="166" cy="${G.orelhaY}" rx="8" ry="12" fill="${p.pele.base}"/>
      <path d="M98 156 h 44" stroke="${alfa(p.pele.profundo, 0.22)}" stroke-width="5" stroke-linecap="round"/>
      ${rimLight()}`,
  },
  {
    id: 'bas_bochechudo',
    categoria: 'base',
    nome: 'Bochechudo',
    descricao: 'Covinhas de fábrica e reserva estratégica de simpatia.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy + 3}" rx="53" ry="55" fill="url(#${u}pele)"/>
      <ellipse cx="88" cy="132" rx="13" ry="10" fill="${alfa(p.pele.claro, 0.55)}"/>
      <ellipse cx="152" cy="132" rx="13" ry="10" fill="${alfa(p.pele.claro, 0.55)}"/>
      <path d="M84 140 q 2 3 5 3 M156 140 q -2 3 -5 3" stroke="${alfa(p.pele.profundo, 0.3)}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="120" cy="154" rx="18" ry="6" fill="${alfa(p.pele.profundo, 0.22)}"/>
      ${rimLight()}`,
  },
  {
    id: 'bas_diamante',
    categoria: 'base',
    nome: 'Diamante',
    descricao: 'Maçãs do rosto que dispensam iluminação de estúdio.',
    raridade: 'raro',
    tema: 'clássico',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <path d="M120 50 c 20 0 34 10 40 28 c 6 16 8 30 2 44 c -6 16 -20 30 -34 40 c -5 3 -11 3 -16 0 c -14 -10 -28 -24 -34 -40 c -6 -14 -4 -28 2 -44 c 6 -18 20 -28 40 -28 z" fill="url(#${u}pele)"/>
      <path d="M84 118 l 12 -6 M156 118 l -12 -6" stroke="${alfa(p.pele.claro, 0.7)}" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="72" cy="${G.orelhaY - 2}" rx="8" ry="11" fill="${p.pele.base}"/>
      <ellipse cx="168" cy="${G.orelhaY - 2}" rx="8" ry="11" fill="${p.pele.base}"/>
      <ellipse cx="120" cy="152" rx="14" ry="5" fill="${alfa(p.pele.profundo, 0.24)}"/>
      ${rimLight()}`,
  },
  {
    id: 'bas_veterano',
    categoria: 'base',
    nome: 'Veterano',
    descricao: 'Cada linha de expressão é um projeto entregue.',
    raridade: 'raro',
    tema: 'clássico',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}pele)"/>
      <g stroke="${alfa(p.pele.profundo, 0.3)}" stroke-width="2.2" stroke-linecap="round" fill="none">
        <path d="M96 84 q 24 -6 48 0"/>
        <path d="M100 76 q 20 -5 40 0"/>
        <path d="M84 122 q 4 6 10 8"/>
        <path d="M156 122 q -4 6 -10 8"/>
        <path d="M108 158 q 12 4 24 0"/>
      </g>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="120" cy="152" rx="18" ry="6" fill="${alfa(p.pele.profundo, 0.26)}"/>
      ${rimLight()}`,
  },
  {
    id: 'bas_juvenil',
    categoria: 'base',
    nome: 'Juvenil',
    descricao: 'Energia de estagiário no primeiro dia — para sempre.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy + 1}" rx="49" ry="54" fill="url(#${u}pele)"/>
      <ellipse cx="93" cy="126" rx="8" ry="5" fill="${alfa('#ff8d7a', 0.3)}"/>
      <ellipse cx="147" cy="126" rx="8" ry="5" fill="${alfa('#ff8d7a', 0.3)}"/>
      <circle cx="120" cy="70" r="2" fill="${alfa('#ffffff', 0.5)}"/>
      <ellipse cx="71" cy="${G.orelhaY}" rx="8.5" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="169" cy="${G.orelhaY}" rx="8.5" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="120" cy="151" rx="16" ry="5.4" fill="${alfa(p.pele.profundo, 0.2)}"/>
      ${rimLight()}`,
  },
  {
    id: 'bas_meio_cyborg',
    categoria: 'base',
    nome: 'Meio-Cyborg',
    descricao: 'Metade humano, metade upgrade — cem por cento operacional.',
    raridade: 'epico',
    tema: 'cyberpunk',
    usaCores: ['pele', 'destaque'],
    render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}
        <linearGradient id="${u}cyb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#4a5266"/>
          <stop offset="1" stop-color="#20242e"/>
        </linearGradient>
        <clipPath id="${u}cybc"><path d="M120 46 h 54 v 124 h -54 z"/></clipPath>
      </defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}pele)"/>
      <g clip-path="url(#${u}cybc)">
        <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}cyb)"/>
        <path d="M124 60 v 96 M138 54 l 6 20 M132 130 l 12 14" stroke="${alfa(p.destaque.base, 0.55)}" stroke-width="1.8"/>
        <circle cx="150" cy="86" r="3" fill="${p.destaque.base}">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
        </circle>
      </g>
      <path d="M120 49 v 114" stroke="${alfa('#0c0f18', 0.6)}" stroke-width="2.4"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <rect x="162" y="100" width="14" height="26" rx="7" fill="#20242e"/>
      <rect x="166" y="106" width="6" height="14" rx="3" fill="${p.destaque.base}"/>
      <ellipse cx="120" cy="152" rx="18" ry="6" fill="${alfa(p.pele.profundo, 0.26)}"/>
      ${rimLight()}`,
  },
];
