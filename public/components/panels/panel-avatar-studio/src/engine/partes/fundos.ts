// engine/partes/fundos.ts — coleção de fundos (cenários) do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Fundo ocupa o quadro inteiro (240×240). O slot `destaque` tinge o cenário —
// trocar a cor de destaque re-ambienta todos os fundos.
import { alfa, escurecer, misturar } from '../cores';
import type { ParteDef } from '../base-api';

/** Estrelas determinísticas (sem Math.random — render reproduzível). */
function estrelas(qtd: number, cor: string, semente: number): string {
  let s = '';
  for (let i = 0; i < qtd; i++) {
    const x = ((i * 73 + semente * 31) % 236) + 2;
    const y = ((i * 47 + semente * 17) % 232) + 2;
    const r = 0.6 + ((i * 13) % 10) / 9;
    const o = 0.25 + ((i * 29) % 55) / 100;
    s += `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="${cor}" opacity="${o.toFixed(2)}"/>`;
  }
  return s;
}

export const FUNDOS: ParteDef[] = [
  {
    id: 'fun_estudio',
    categoria: 'fundo',
    nome: 'Estúdio',
    descricao: 'Gradiente suave de estúdio, tingido pela cor de destaque.',
    raridade: 'comum',
    tema: 'clássico',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}fe" cx="0.5" cy="0.36" r="1">
          <stop offset="0" stop-color="${misturar('#232a3f', p.destaque.base, 0.28)}"/>
          <stop offset="1" stop-color="${escurecer('#171c2c', 0.35)}"/>
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}fe)"/>
      <ellipse cx="120" cy="212" rx="120" ry="46" fill="${alfa('#000000', 0.28)}"/>`,
  },
  {
    id: 'fun_estrelas',
    categoria: 'fundo',
    nome: 'Campo Estelar',
    descricao: 'Noite profunda com estrelas cintilantes.',
    raridade: 'comum',
    tema: 'espaço',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}fs" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0a0e1e"/>
          <stop offset="1" stop-color="${misturar('#101530', p.destaque.base, 0.16)}"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}fs)"/>
      ${estrelas(60, '#dfe6ff', 3)}
      ${estrelas(14, p.destaque.claro, 9)}`,
  },
  {
    id: 'fun_grade',
    categoria: 'fundo',
    nome: 'Synthwave',
    descricao: 'Sol retrô sobre a grade infinita dos anos 80.',
    raridade: 'incomum',
    tema: 'retrô',
    usaCores: ['destaque'],
    render: (p, u) => {
      let linhas = '';
      for (let i = 0; i <= 8; i++) {
        const y = 150 + i * i * 1.6;
        linhas += `<line x1="0" y1="${y}" x2="240" y2="${y}" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="1"/>`;
      }
      for (let i = -4; i <= 4; i++) {
        linhas += `<line x1="${120 + i * 30}" y1="150" x2="${120 + i * 110}" y2="240" stroke="${alfa(p.destaque.base, 0.4)}" stroke-width="1"/>`;
      }
      return `
      <defs>
        <linearGradient id="${u}fg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#12081f"/>
          <stop offset="0.62" stop-color="${misturar('#2a1245', p.destaque.base, 0.25)}"/>
          <stop offset="0.63" stop-color="#0d0a18"/>
          <stop offset="1" stop-color="#0d0a18"/>
        </linearGradient>
        <linearGradient id="${u}fgsol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffd76e"/>
          <stop offset="1" stop-color="${p.destaque.base}"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}fg)"/>
      <circle cx="120" cy="150" r="52" fill="url(#${u}fgsol)" opacity="0.9"/>
      <rect x="60" y="118" width="120" height="4" fill="#12081f" opacity="0.85"/>
      <rect x="60" y="130" width="120" height="6" fill="#12081f" opacity="0.85"/>
      <rect x="55" y="144" width="130" height="8" fill="#12081f" opacity="0.85"/>
      ${linhas}`;
    },
  },
  {
    id: 'fun_hex',
    categoria: 'fundo',
    nome: 'Colmeia Tech',
    descricao: 'Malha hexagonal de engenharia com pulsos de luz.',
    raridade: 'incomum',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p, u) => {
      let hexes = '';
      for (let lin = 0; lin < 7; lin++) {
        for (let col = 0; col < 6; col++) {
          const x = col * 44 + (lin % 2 ? 22 : 0) - 8;
          const y = lin * 38 - 6;
          const on = (lin * 7 + col * 3) % 11 === 0;
          hexes += `<path d="M${x + 22} ${y} l19 11 v22 l-19 11 l-19 -11 v-22 z" fill="${on ? alfa(p.destaque.base, 0.22) : 'none'}" stroke="${alfa(p.destaque.base, on ? 0.7 : 0.22)}" stroke-width="1"/>`;
        }
      }
      return `
      <defs>
        <radialGradient id="${u}fh" cx="0.5" cy="0.3" r="1.1">
          <stop offset="0" stop-color="#141a2e"/>
          <stop offset="1" stop-color="#0a0d19"/>
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}fh)"/>${hexes}`;
    },
  },
  {
    id: 'fun_circuito',
    categoria: 'fundo',
    nome: 'Placa-Mãe',
    descricao: 'Trilhas de circuito energizadas percorrendo o quadro.',
    raridade: 'raro',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p, u) => {
      const t = alfa(p.destaque.base, 0.55);
      const nodo = (x: number, y: number) =>
        `<circle cx="${x}" cy="${y}" r="3.4" fill="#0c101d" stroke="${t}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="1.3" fill="${p.destaque.claro}"/>`;
      return `
      <defs>
        <linearGradient id="${u}fc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0d1322"/>
          <stop offset="1" stop-color="#101a2c"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}fc)"/>
      <g stroke="${t}" stroke-width="1.6" fill="none" stroke-linecap="round">
        <path d="M10 34 h58 l20 20 v40"/>
        <path d="M230 52 h-64 l-16 16"/>
        <path d="M18 210 h44 l26 -26"/>
        <path d="M226 196 h-52 l-22 -22 v-24"/>
        <path d="M32 120 h-22"/>
        <path d="M232 120 h-18"/>
        <path d="M120 12 v20"/>
      </g>
      ${nodo(88, 94)}${nodo(150, 68)}${nodo(88, 184)}${nodo(152, 150)}${nodo(32, 120)}${nodo(214, 120)}${nodo(120, 32)}
      <rect x="6" y="6" width="228" height="228" rx="10" fill="none" stroke="${alfa(p.destaque.base, 0.2)}" stroke-width="1"/>`;
    },
  },
  {
    id: 'fun_nebulosa',
    categoria: 'fundo',
    nome: 'Nebulosa',
    descricao: 'Nuvens cósmicas coloridas com poeira estelar.',
    raridade: 'raro',
    tema: 'espaço',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}fn1" cx="0.28" cy="0.3" r="0.6">
          <stop offset="0" stop-color="${alfa(p.destaque.base, 0.55)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0)}"/>
        </radialGradient>
        <radialGradient id="${u}fn2" cx="0.75" cy="0.68" r="0.62">
          <stop offset="0" stop-color="${alfa('#2f6bff', 0.4)}"/>
          <stop offset="1" stop-color="${alfa('#2f6bff', 0)}"/>
        </radialGradient>
        <radialGradient id="${u}fn3" cx="0.62" cy="0.18" r="0.42">
          <stop offset="0" stop-color="${alfa('#ff5fa8', 0.3)}"/>
          <stop offset="1" stop-color="${alfa('#ff5fa8', 0)}"/>
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="#080b17"/>
      <rect width="240" height="240" fill="url(#${u}fn1)"/>
      <rect width="240" height="240" fill="url(#${u}fn2)"/>
      <rect width="240" height="240" fill="url(#${u}fn3)"/>
      ${estrelas(46, '#e8edff', 5)}${estrelas(10, p.destaque.claro, 11)}`,
  },
  {
    id: 'fun_aurora',
    categoria: 'fundo',
    nome: 'Aurora Boreal',
    descricao: 'Cortinas de luz dançando no céu polar.',
    raridade: 'epico',
    tema: 'natureza',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}fa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#050914"/>
          <stop offset="1" stop-color="#0c1626"/>
        </linearGradient>
        <linearGradient id="${u}fa1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa('#39ffb0', 0.0)}"/>
          <stop offset="0.5" stop-color="${alfa('#39ffb0', 0.4)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0.06)}"/>
        </linearGradient>
        <linearGradient id="${u}fa2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.base, 0)}"/>
          <stop offset="0.55" stop-color="${alfa(p.destaque.base, 0.42)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0.05)}"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}fa)"/>
      <path d="M-10 30 C 50 80, 60 10, 120 66 S 200 40, 250 96 V 150 C 190 96, 170 150, 110 106 S 40 130, -10 84 Z" fill="url(#${u}fa1)"/>
      <path d="M-10 8 C 60 54, 90 -6, 150 40 S 220 16, 250 60 V 110 C 200 66, 160 112, 100 72 S 30 96, -10 52 Z" fill="url(#${u}fa2)"/>
      ${estrelas(38, '#dfe8ff', 7)}
      <path d="M0 240 l40 -34 l30 22 l50 -42 l44 30 l40 -26 l36 24 v26 z" fill="#070c16"/>`,
  },
  {
    id: 'fun_arena',
    categoria: 'fundo',
    nome: 'Arena E-Sports',
    descricao: 'Holofotes e telões de uma grande final.',
    raridade: 'lendario',
    tema: 'gamer',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#05060d"/>
          <stop offset="1" stop-color="#101426"/>
        </linearGradient>
        <linearGradient id="${u}farf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.5)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0)}"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}far)"/>
      <path d="M34 0 l-30 150 h46 l14 -150 z" fill="url(#${u}farf)" opacity="0.7"/>
      <path d="M206 0 l30 150 h-46 l-14 -150 z" fill="url(#${u}farf)" opacity="0.7"/>
      <path d="M120 0 l-26 132 h52 z" fill="url(#${u}farf)" opacity="0.55"/>
      <g fill="${alfa(p.destaque.base, 0.9)}">
        <rect x="16" y="150" width="52" height="26" rx="3" opacity="0.35"/>
        <rect x="94" y="142" width="52" height="30" rx="3" opacity="0.5"/>
        <rect x="172" y="150" width="52" height="26" rx="3" opacity="0.35"/>
      </g>
      <g stroke="${alfa('#ffffff', 0.5)}" stroke-width="1.5">
        <line x1="16" y1="190" x2="224" y2="190"/>
        <line x1="4" y1="204" x2="236" y2="204"/>
      </g>
      ${estrelas(26, p.destaque.claro, 13)}`,
  },
];
