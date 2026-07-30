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
  // ── 4.6 F2 · Onda 7 — 4 espécies novas ────────────────────────────
  {
    id: 'bas_gato',
    categoria: 'base',
    nome: 'Gato',
    descricao: 'Derruba o que estiver na borda da mesa. Inclusive prazos.',
    raridade: 'raro',
    tema: 'animais',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M78 70 l -14 -34 l 34 16 z" fill="url(#${u}pel)"/>
      <path d="M162 70 l 14 -34 l -34 16 z" fill="url(#${u}pel)"/>
      <path d="M80 62 l -8 -20 l 20 10 z" fill="${alfa('#ff9fb0', 0.75)}"/>
      <path d="M160 62 l 8 -20 l -20 10 z" fill="${alfa('#ff9fb0', 0.75)}"/>
      <ellipse cx="120" cy="108" rx="52" ry="54" fill="url(#${u}pel)"/>
      <ellipse cx="120" cy="134" rx="16" ry="11" fill="${BRANCO}"/>
      <path d="M120 130 l -4 -4 h 8 z" fill="#ff9fb0"/>
      <g stroke="${alfa('#ffffff', 0.75)}" stroke-width="1.6" stroke-linecap="round">
        <path d="M64 126 l 26 3 M64 136 l 26 -1 M176 126 l -26 3 M176 136 l -26 -1"/>
      </g>
      <path d="M84 70 a 52 54 0 0 1 36 -18" stroke="${alfa('#ffffff', 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'bas_urso',
    categoria: 'base',
    nome: 'Urso',
    descricao: 'Abraço de esmagamento e paciência de hibernação.',
    raridade: 'raro',
    tema: 'animais',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <circle cx="82" cy="56" r="16" fill="url(#${u}pel)"/>
      <circle cx="158" cy="56" r="16" fill="url(#${u}pel)"/>
      <circle cx="84" cy="58" r="7" fill="${alfa(p.pele.claro, 0.7)}"/>
      <circle cx="156" cy="58" r="7" fill="${alfa(p.pele.claro, 0.7)}"/>
      <ellipse cx="120" cy="108" rx="54" ry="55" fill="url(#${u}pel)"/>
      <ellipse cx="120" cy="136" rx="18" ry="13" fill="${alfa(p.pele.claro, 0.8)}"/>
      <ellipse cx="120" cy="130" rx="8" ry="6" fill="#2b2118"/>
      <path d="M84 70 a 54 55 0 0 1 38 -19" stroke="${alfa('#ffffff', 0.35)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'bas_dragao',
    categoria: 'base',
    nome: 'Dragão',
    descricao: 'Guarda tesouros: métricas boas e feedbacks salvos.',
    raridade: 'lendario',
    tema: 'fantasia',
    usaCores: ['pele', 'destaque'],
    render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M84 58 c -10 -18 -8 -32 2 -40 c 4 12 12 18 20 20 z" fill="${p.destaque.base}"/>
      <path d="M156 58 c 10 -18 8 -32 -2 -40 c -4 12 -12 18 -20 20 z" fill="${p.destaque.base}"/>
      <path d="M112 44 c 2 -8 6 -12 8 -12 s 6 4 8 12 l -8 6 z" fill="${p.destaque.profundo}"/>
      <ellipse cx="120" cy="108" rx="52" ry="55" fill="url(#${u}pel)"/>
      <g fill="${alfa(p.pele.escuro, 0.5)}">
        <path d="M78 92 q 5 -4 10 0 q -5 4 -10 0 z M92 78 q 5 -4 10 0 q -5 4 -10 0 z M150 80 q 5 -4 10 0 q -5 4 -10 0 z M160 96 q 5 -4 10 0 q -5 4 -10 0 z"/>
      </g>
      <ellipse cx="120" cy="136" rx="17" ry="11" fill="${alfa(p.pele.claro, 0.75)}"/>
      <path d="M110 132 q 2 -3 4 0 M126 132 q 2 -3 4 0" stroke="${p.pele.escuro}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M104 146 q 4 4 8 4 M136 146 q -4 4 -8 4" stroke="${alfa('#ffffff', 0.4)}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M84 70 a 52 55 0 0 1 36 -19" stroke="${alfa('#ffffff', 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'bas_fantasma',
    categoria: 'base',
    nome: 'Fantasma',
    descricao: 'Aparece nas dailies, some nas retros. Uivos opcionais.',
    raridade: 'epico',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}fan" cx="0.4" cy="0.3" r="1">
          <stop offset="0" stop-color="${alfa('#ffffff', 0.95)}"/>
          <stop offset="0.6" stop-color="${alfa('#e8ecfa', 0.85)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.claro, 0.6)}"/>
        </radialGradient>
      </defs>
      <path d="M104 150 h 32 v 30 c -5 6 -11 6 -16 0 c -5 6 -11 6 -16 0 z" fill="${alfa('#e8ecfa', 0.75)}"/>
      <ellipse cx="120" cy="104" rx="50" ry="56" fill="url(#${u}fan)"/>
      <path d="M70 120 c 0 22 8 34 16 40 c 4 -8 2 -16 -2 -22 c 8 6 12 14 12 22 c 6 -6 8 -14 6 -20 c 6 6 8 14 8 20 h 20 c 0 -6 2 -14 8 -20 c -2 6 0 14 6 20 c 0 -8 4 -16 12 -22 c -4 6 -6 14 -2 22 c 8 -6 16 -18 16 -40 z" fill="url(#${u}fan)"/>
      <ellipse cx="120" cy="196" rx="30" ry="5" fill="${alfa(p.destaque.base, 0.35)}">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="3.4s" repeatCount="indefinite"/>
      </ellipse>
      <path d="M80 66 a 50 56 0 0 1 36 -20" stroke="${alfa('#ffffff', 0.7)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  // ── 4.6 F2 · Onda 8 (final §28) — 5 espécies novas ────────────────
  {
    id: 'bas_tigre',
    categoria: 'base',
    nome: 'Tigre',
    descricao: 'Listras de quem caça resultado em silêncio.',
    raridade: 'epico',
    tema: 'animais',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M80 66 l -12 -28 l 30 12 z" fill="url(#${u}pel)"/>
      <path d="M160 66 l 12 -28 l -30 12 z" fill="url(#${u}pel)"/>
      <ellipse cx="120" cy="108" rx="53" ry="55" fill="url(#${u}pel)"/>
      <g fill="#20242c">
        <path d="M92 58 q 6 10 2 18 q -8 -6 -10 -14 z"/>
        <path d="M148 58 q -6 10 -2 18 q 8 -6 10 -14 z"/>
        <path d="M68 96 q 12 2 18 8 q -10 4 -18 2 z"/>
        <path d="M172 96 q -12 2 -18 8 q 10 4 18 2 z"/>
        <path d="M70 128 q 10 0 16 5 q -8 5 -16 3 z"/>
        <path d="M170 128 q -10 0 -16 5 q 8 5 16 3 z"/>
        <path d="M112 52 q 8 -4 16 0 q -8 6 -16 0 z"/>
      </g>
      <ellipse cx="120" cy="136" rx="16" ry="11" fill="${BRANCO}"/>
      <path d="M120 132 l -4 -4 h 8 z" fill="#ff9fb0"/>
      <path d="M84 70 a 53 55 0 0 1 36 -18" stroke="${alfa('#ffffff', 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'bas_sapo',
    categoria: 'base',
    nome: 'Sapo',
    descricao: 'Engole um sapo por sprint. Profissionalmente.',
    raridade: 'incomum',
    tema: 'animais',
    usaCores: ['pele'],
    render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <circle cx="94" cy="54" r="15" fill="url(#${u}pel)"/>
      <circle cx="146" cy="54" r="15" fill="url(#${u}pel)"/>
      <circle cx="94" cy="52" r="8" fill="${BRANCO}"/>
      <circle cx="146" cy="52" r="8" fill="${BRANCO}"/>
      <circle cx="94" cy="52" r="3.4" fill="#14100c"/>
      <circle cx="146" cy="52" r="3.4" fill="#14100c"/>
      <ellipse cx="120" cy="110" rx="52" ry="52" fill="url(#${u}pel)"/>
      <ellipse cx="120" cy="140" rx="22" ry="12" fill="${alfa(p.pele.claro, 0.65)}"/>
      <circle cx="86" cy="120" r="3" fill="${alfa(p.pele.escuro, 0.5)}"/>
      <circle cx="154" cy="120" r="3" fill="${alfa(p.pele.escuro, 0.5)}"/>
      <path d="M84 72 a 52 52 0 0 1 36 -16" stroke="${alfa('#ffffff', 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'bas_slime',
    categoria: 'base',
    nome: 'Slime',
    descricao: 'Se adapta a qualquer organograma. Literalmente.',
    raridade: 'raro',
    tema: 'fantasia',
    usaCores: ['pele', 'destaque'],
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}sli" cx="0.4" cy="0.3" r="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.9)}"/>
          <stop offset="0.6" stop-color="${alfa(p.destaque.base, 0.8)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.85)}"/>
        </radialGradient>
      </defs>
      <path d="M104 148 h 32 v 34 c -10 6 -22 6 -32 0 z" fill="${alfa(p.destaque.base, 0.7)}"/>
      <path d="M120 50 c 30 0 50 24 50 54 c 0 20 -6 34 -16 44 q -2 8 -8 6 q -6 8 -12 4 q -8 6 -14 0 q -8 4 -12 -4 q -6 2 -8 -6 c -10 -10 -16 -24 -16 -44 c 0 -30 20 -54 50 -54 z" fill="url(#${u}sli)"/>
      <circle cx="96" cy="76" r="6" fill="${alfa('#ffffff', 0.5)}"/>
      <circle cx="146" cy="132" r="4" fill="${alfa('#ffffff', 0.3)}">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -18;0 0" dur="4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="90" cy="128" r="3" fill="${alfa('#ffffff', 0.3)}">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -12;0 0" dur="3.2s" repeatCount="indefinite"/>
      </circle>
      <path d="M80 66 a 50 54 0 0 1 38 -18" stroke="${alfa('#ffffff', 0.55)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'bas_caveira',
    categoria: 'base',
    nome: 'Caveira',
    descricao: 'Deadline literal. Sorriso permanente de quem já entregou tudo.',
    raridade: 'epico',
    tema: 'fantasia',
    render: (_p, u) => `
      <defs>
        <radialGradient id="${u}cav" cx="0.38" cy="0.28" r="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.6" stop-color="#eceadf"/>
          <stop offset="1" stop-color="#c9c4b0"/>
        </radialGradient>
      </defs>
      <path d="M108 150 h 24 v 34 c -8 5 -16 5 -24 0 z" fill="#d9d5c5"/>
      <path d="M120 50 c 30 0 48 22 48 50 c 0 18 -6 30 -16 38 v 14 c 0 8 -6 12 -12 12 h -40 c -6 0 -12 -4 -12 -12 v -14 c -10 -8 -16 -20 -16 -38 c 0 -28 18 -50 48 -50 z" fill="url(#${u}cav)"/>
      <path d="M108 146 v 14 M120 148 v 14 M132 146 v 14" stroke="#b8b29c" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="120" cy="134" rx="6" ry="8" fill="#3a362c"/>
      <path d="M84 66 a 48 50 0 0 1 36 -16" stroke="${alfa('#ffffff', 0.7)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'bas_nuvem',
    categoria: 'base',
    nome: 'Nuvem',
    descricao: 'Cabeça nas nuvens, uptime nos céus.',
    raridade: 'raro',
    tema: 'clima',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}nuv" cx="0.4" cy="0.3" r="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.7" stop-color="#eef2fa"/>
          <stop offset="1" stop-color="${alfa(p.destaque.claro, 0.75)}"/>
        </radialGradient>
      </defs>
      <path d="M104 150 h 32 v 30 c -10 6 -22 6 -32 0 z" fill="#dfe6f4"/>
      <circle cx="86" cy="90" r="26" fill="url(#${u}nuv)"/>
      <circle cx="120" cy="72" r="30" fill="url(#${u}nuv)"/>
      <circle cx="154" cy="90" r="26" fill="url(#${u}nuv)"/>
      <circle cx="94" cy="126" r="28" fill="url(#${u}nuv)"/>
      <circle cx="146" cy="126" r="28" fill="url(#${u}nuv)"/>
      <ellipse cx="120" cy="112" rx="44" ry="42" fill="url(#${u}nuv)"/>
      <circle cx="76" cy="150" r="3" fill="${alfa(p.destaque.base, 0.5)}">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="166" cy="146" r="2.4" fill="${alfa(p.destaque.base, 0.5)}">
        <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2.8s" repeatCount="indefinite"/>
      </circle>
      <path d="M84 66 a 44 42 0 0 1 34 -14" stroke="${alfa('#ffffff', 0.85)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
];
