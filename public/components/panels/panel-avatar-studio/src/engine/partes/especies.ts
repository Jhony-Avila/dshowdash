// engine/partes/especies.ts — espécies não humanas (AS3 F2b, briefing 3.0 §6).
// @version 1.0.0  @created 2026-07-30
//
// Novas BASES: animais, alienígena e o LED Bot (mascote exclusivo Dshow).
// Mantêm a MESMA geometria facial do busto (olhos 100/140×108, boca y146) —
// todo o catálogo de olhos/bocas/cabelos/acessórios continua compatível.
// `pele` tinge a pelagem/pele; leão usa `cabelo` na juba; alien/LED usam destaque.
import { alfa } from '../cores';
import { PATH_PESCOCO } from '../base-api';
import type { ParteDef } from '../base-api';

const BRANCO = '#f4f1e8';

function defsPelagem(u: string, claro: string, base: string, escuro: string): string {
  return `
    <radialGradient id="${u}pel" cx="0.38" cy="0.28" r="1">
      <stop offset="0" stop-color="${claro}"/>
      <stop offset="0.58" stop-color="${base}"/>
      <stop offset="1" stop-color="${escuro}"/>
    </radialGradient>`;
}

export const ESPECIES: ParteDef[] = [
  {
    id: 'bas_panda',
    categoria: 'base',
    nome: 'Panda',
    descricao: 'Calmo por fora, deadline por dentro.',
    raridade: 'raro',
    tema: 'animais',
    render: (_p, u) => `
      <defs>${defsPelagem(u, '#ffffff', '#f2f0ea', '#d9d5c9')}</defs>
      <path d="${PATH_PESCOCO}" fill="#e8e5db"/>
      <circle cx="82" cy="52" r="17" fill="#20242c"/>
      <circle cx="158" cy="52" r="17" fill="#20242c"/>
      <circle cx="84" cy="54" r="8" fill="#3a4050"/>
      <circle cx="156" cy="54" r="8" fill="#3a4050"/>
      <ellipse cx="120" cy="106" rx="52" ry="56" fill="url(#${u}pel)"/>
      <ellipse cx="100" cy="108" rx="17" ry="20" fill="#20242c" transform="rotate(-12 100 108)"/>
      <ellipse cx="140" cy="108" rx="17" ry="20" fill="#20242c" transform="rotate(12 140 108)"/>
      <ellipse cx="120" cy="138" rx="9" ry="6" fill="#20242c"/>
      <ellipse cx="120" cy="152" rx="20" ry="7" fill="${alfa('#000000', 0.12)}"/>
      <path d="M82 70 a 52 56 0 0 1 38 -20" stroke="${alfa('#ffffff', 0.5)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'bas_coruja',
    categoria: 'base',
    nome: 'Coruja',
    descricao: 'Vê tudo. Principalmente o que tentaram esconder no relatório.',
    raridade: 'raro',
    tema: 'animais',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M76 58 l -10 -26 l 24 12 z" fill="${p.pele.escuro}"/>
      <path d="M164 58 l 10 -26 l -24 12 z" fill="${p.pele.escuro}"/>
      <ellipse cx="120" cy="106" rx="52" ry="56" fill="url(#${u}pel)"/>
      <circle cx="100" cy="108" r="19" fill="${BRANCO}"/>
      <circle cx="140" cy="108" r="19" fill="${BRANCO}"/>
      <path d="M120 124 l -8 12 l 8 8 l 8 -8 z" fill="#e8963c"/>
      <path d="M84 150 q 36 16 72 0 q -18 14 -36 14 t -36 -14 z" fill="${alfa(p.pele.escuro, 0.5)}"/>
      <path d="M82 70 a 52 56 0 0 1 38 -20" stroke="${alfa('#ffffff', 0.35)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'bas_raposa',
    categoria: 'base',
    nome: 'Raposa',
    descricao: 'Esperta demais para reuniões que podiam ser e-mails.',
    raridade: 'epico',
    tema: 'animais',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M78 62 l -18 -38 l 34 18 z" fill="url(#${u}pel)"/>
      <path d="M162 62 l 18 -38 l -34 18 z" fill="url(#${u}pel)"/>
      <path d="M74 50 l -8 -18 l 16 9 z" fill="#2b2530"/>
      <path d="M166 50 l 8 -18 l -16 9 z" fill="#2b2530"/>
      <path d="M120 50 c 30 0 52 22 52 54 c 0 20 -8 36 -22 46 l -22 14 c -5 3 -11 3 -16 0 l -22 -14 c -14 -10 -22 -26 -22 -46 c 0 -32 22 -54 52 -54 z" fill="url(#${u}pel)"/>
      <path d="M120 118 c 14 0 26 8 26 20 c 0 14 -12 24 -26 24 s -26 -10 -26 -24 c 0 -12 12 -20 26 -20 z" fill="${BRANCO}"/>
      <path d="M120 126 l -7 8 l 7 6 l 7 -6 z" fill="#2b2530"/>
      <path d="M82 70 a 52 56 0 0 1 38 -20" stroke="${alfa('#ffffff', 0.35)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'bas_lobo',
    categoria: 'base',
    nome: 'Lobo',
    descricao: 'Caça metas em matilha, mas fecha o trimestre sozinho se precisar.',
    raridade: 'epico',
    tema: 'animais',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M70 70 l -22 -30 l 34 10 z" fill="url(#${u}pel)"/>
      <path d="M170 70 l 22 -30 l -34 10 z" fill="url(#${u}pel)"/>
      <ellipse cx="120" cy="106" rx="53" ry="57" fill="url(#${u}pel)"/>
      <path d="M68 118 l -12 8 l 12 4 z m 104 0 l 12 8 l -12 4 z" fill="${alfa(p.pele.escuro, 0.8)}"/>
      <path d="M120 120 c 13 0 24 8 24 20 c 0 13 -11 22 -24 22 s -24 -9 -24 -22 c 0 -12 11 -20 24 -20 z" fill="${alfa(BRANCO, 0.92)}"/>
      <path d="M120 126 l -7 7 l 7 6 l 7 -6 z" fill="#232028"/>
      <path d="M108 154 l 4 7 l 4 -7 z m 16 0 l 4 7 l 4 -7 z" fill="${BRANCO}"/>
      <path d="M82 68 a 53 57 0 0 1 38 -18" stroke="${alfa('#ffffff', 0.3)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'bas_leao',
    categoria: 'base',
    nome: 'Leão',
    descricao: 'A juba entra na sala antes dele.',
    raridade: 'lendario',
    tema: 'animais',
    usaCores: ['pele', 'cabelo'],
    render: (p, u) => {
      let juba = '';
      for (let i = 0; i < 12; i++) {
        const ang = (i * 30 * Math.PI) / 180;
        const x = 120 + Math.cos(ang) * 66;
        const y = 104 + Math.sin(ang) * 68;
        juba += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="24" fill="${i % 2 ? p.cabelo.base : p.cabelo.escuro}"/>`;
      }
      return `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      ${juba}
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <circle cx="78" cy="56" r="13" fill="url(#${u}pel)"/>
      <circle cx="162" cy="56" r="13" fill="url(#${u}pel)"/>
      <circle cx="78" cy="58" r="6" fill="${alfa(p.pele.escuro, 0.8)}"/>
      <circle cx="162" cy="58" r="6" fill="${alfa(p.pele.escuro, 0.8)}"/>
      <ellipse cx="120" cy="106" rx="52" ry="56" fill="url(#${u}pel)"/>
      <path d="M120 122 c 12 0 22 7 22 18 c 0 12 -10 20 -22 20 s -22 -8 -22 -20 c 0 -11 10 -18 22 -18 z" fill="${alfa(BRANCO, 0.85)}"/>
      <path d="M120 128 l -7 7 l 7 6 l 7 -6 z" fill="#3a2a1a"/>
      <path d="M82 70 a 52 56 0 0 1 38 -20" stroke="${alfa('#ffffff', 0.35)}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    },
  },
  {
    id: 'bas_alien',
    categoria: 'base',
    nome: 'Alienígena',
    descricao: 'Veio estudar a humanidade. Ficou pelo dashboard.',
    raridade: 'mitico',
    tema: 'sci-fi',
    usaCores: ['pele', 'destaque'],
    render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M96 44 q -10 -22 -22 -26" stroke="${p.pele.escuro}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M144 44 q 10 -22 22 -26" stroke="${p.pele.escuro}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="74" cy="18" r="7" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="166" cy="18" r="7" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <path d="M120 44 c 34 0 54 24 54 56 c 0 26 -14 46 -32 56 c -7 4 -37 4 -44 0 c -18 -10 -32 -30 -32 -56 c 0 -32 20 -56 54 -56 z" fill="url(#${u}pel)"/>
      <ellipse cx="120" cy="152" rx="16" ry="5" fill="${alfa(p.pele.profundo, 0.3)}"/>
      <path d="M78 74 a 54 58 0 0 1 42 -24" stroke="${alfa('#ffffff', 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'bas_ledbot',
    categoria: 'base',
    nome: 'LED Bot',
    descricao: 'O mascote oficial da Dshow. Nasceu num painel de LED e nunca saiu do ar.',
    raridade: 'exclusivo',
    tema: 'dshow',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}lb" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stop-color="#3a4152"/>
          <stop offset="1" stop-color="#161a24"/>
        </linearGradient>
      </defs>
      <path d="M105 146 h30 v38 c0 8 -30 8 -30 0 z" fill="#20242c"/>
      <rect x="107" y="152" width="26" height="4" rx="2" fill="${alfa(p.destaque.base, 0.9)}"/>
      <rect x="66" y="50" width="108" height="112" rx="34" fill="url(#${u}lb)" stroke="${alfa(p.destaque.base, 0.55)}" stroke-width="2.5"/>
      <rect x="78" y="62" width="84" height="88" rx="24" fill="#0a0d15"/>
      <rect x="78" y="88" width="84" height="2" fill="${alfa(p.destaque.base, 0.14)}"/>
      <rect x="78" y="112" width="84" height="2" fill="${alfa(p.destaque.base, 0.14)}"/>
      <rect x="78" y="136" width="84" height="2" fill="${alfa(p.destaque.base, 0.14)}"/>
      <rect x="56" y="92" width="12" height="30" rx="6" fill="#20242c"/>
      <rect x="172" y="92" width="12" height="30" rx="6" fill="#20242c"/>
      <rect x="59" y="98" width="6" height="18" rx="3" fill="${p.destaque.base}"/>
      <rect x="175" y="98" width="6" height="18" rx="3" fill="${p.destaque.base}"/>
      <circle cx="120" cy="42" r="6" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <line x1="120" y1="48" x2="120" y2="56" stroke="#20242c" stroke-width="4"/>
      <path d="M80 66 a 24 24 0 0 1 20 -8" stroke="${alfa('#ffffff', 0.3)}" stroke-width="4" stroke-linecap="round" fill="none"/>`,
  },
];
