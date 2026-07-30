// engine/partes/banners.ts — BANNERS (Expansão §28): estandarte vertical
// atrás do personagem, entre o fundo e a aura. Identidade sem cobrir o rosto.
// @version 1.0.0  @created 2026-07-30
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

/** Estandarte base: painel vertical com ponta em V (x 78–162). */
function estandarte(fill: string, borda: string, u: string, chave: string, conteudo = ''): string {
  return `
    <g id="${u}${chave}">
      <path d="M78 0 L162 0 L162 196 L120 172 L78 196 Z" fill="${fill}" stroke="${borda}" stroke-width="3"/>
      ${conteudo}
    </g>`;
}

export const BANNERS: ParteDef[] = [
  {
    id: 'ban_executivo',
    categoria: 'banner',
    nome: 'Estandarte Executivo',
    descricao: 'Painel sóbrio com friso dourado — sala de reunião vitalícia.',
    raridade: 'raro',
    tema: 'executivo',
    usaCores: ['destaque'],
    render: (_p, u) => estandarte('#1a2032', '#2a3247', u, 'bex', `
      <path d="M86 10 L154 10" stroke="#e8b64c" stroke-width="3" stroke-linecap="round"/>
      <path d="M86 18 L154 18" stroke="${alfa('#e8b64c', 0.4)}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="120" cy="42" r="9" fill="none" stroke="#e8b64c" stroke-width="2.4"/>
      <path d="M86 176 L120 156 L154 176" fill="none" stroke="${alfa('#e8b64c', 0.5)}" stroke-width="2"/>`),
  },
  {
    id: 'ban_cyber',
    categoria: 'banner',
    nome: 'Estandarte Cyber',
    descricao: 'Trilhas de circuito acesas descendo o painel.',
    raridade: 'epico',
    tema: 'cyberpunk',
    usaCores: ['destaque'],
    render: (p, u) => estandarte('#0c1220', alfa(p.destaque.base, 0.7), u, 'bcy', `
      <g fill="none" stroke="${alfa(p.destaque.base, 0.65)}" stroke-width="2">
        <path d="M96 8 L96 74 L110 88 L110 150"/>
        <path d="M144 8 L144 52 L130 66 L130 128"/>
      </g>
      <circle cx="110" cy="150" r="3.4" fill="${p.destaque.claro}">
        <animate attributeName="opacity" values="1;0.3;1" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="130" cy="128" r="3.4" fill="${p.destaque.claro}">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" repeatCount="indefinite"/>
      </circle>`),
  },
  {
    id: 'ban_galaxy',
    categoria: 'banner',
    nome: 'Estandarte Galáxia',
    descricao: 'Um pedaço do espaço profundo pendurado às suas costas.',
    raridade: 'epico',
    tema: 'espaço',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}bglx" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#101736"/>
          <stop offset="1" stop-color="#1c1030"/>
        </linearGradient>
      </defs>
      ${estandarte(`url(#${u}bglx)`, alfa(p.destaque.base, 0.55), u, 'bgl', `
      <g fill="#ffffff">
        <circle cx="98" cy="30" r="1.6"/>
        <circle cx="138" cy="52" r="1.2"/>
        <circle cx="112" cy="84" r="1.8">
          <animate attributeName="opacity" values="1;0.3;1" dur="2.6s" repeatCount="indefinite"/>
        </circle>
        <circle cx="150" cy="110" r="1.3"/>
        <circle cx="92" cy="132" r="1.5">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="3.1s" repeatCount="indefinite"/>
        </circle>
      </g>
      <ellipse cx="124" cy="64" rx="20" ry="7" fill="none" stroke="${alfa(p.destaque.claro, 0.5)}" stroke-width="1.6" transform="rotate(-18 124 64)"/>`)}`,
  },
  {
    id: 'ban_arena',
    categoria: 'banner',
    nome: 'Flâmula da Arena',
    descricao: 'A bandeira de quem entra para vencer o campeonato.',
    raridade: 'raro',
    tema: 'gamer',
    usaCores: ['destaque', 'roupa'],
    render: (p, u) => estandarte(p.destaque.profundo, p.destaque.base, u, 'bar', `
      <path d="M78 0 L162 0 L162 34 L78 34 Z" fill="${alfa(p.destaque.base, 0.85)}"/>
      <path d="M104 56 L120 44 L136 56 L136 96 L120 108 L104 96 Z"
        fill="none" stroke="${p.destaque.claro}" stroke-width="3"/>
      <path d="M112 72 L120 64 L128 72" fill="none" stroke="${p.destaque.claro}" stroke-width="2.4" stroke-linecap="round"/>`),
  },
  {
    id: 'ban_dshow',
    categoria: 'banner',
    nome: 'Painel LED Dshow',
    descricao: 'O telão da casa, aceso só para o seu personagem.',
    raridade: 'exclusivo',
    tema: 'dshow',
    usaCores: ['destaque'],
    render: (p, u) => estandarte('#0a0e18', alfa(p.destaque.base, 0.8), u, 'bds', `
      <g stroke-width="4" stroke-linecap="round" fill="none">
        <path d="M92 20 L148 20" stroke="${alfa(p.destaque.base, 0.9)}">
          <animate attributeName="opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite"/>
        </path>
        <path d="M92 34 L148 34" stroke="${alfa(p.destaque.claro, 0.6)}">
          <animate attributeName="opacity" values="0.35;1;0.35" dur="1.8s" repeatCount="indefinite"/>
        </path>
      </g>
      <g fill="${alfa(p.destaque.base, 0.5)}">
        <rect x="92" y="54" width="10" height="10" rx="2">
          <animate attributeName="opacity" values="1;0.2;1" dur="2.4s" repeatCount="indefinite"/>
        </rect>
        <rect x="108" y="54" width="10" height="10" rx="2">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.4s" repeatCount="indefinite"/>
        </rect>
        <rect x="124" y="54" width="10" height="10" rx="2">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1.9s" repeatCount="indefinite"/>
        </rect>
        <rect x="140" y="54" width="8" height="10" rx="2">
          <animate attributeName="opacity" values="1;0.4;1" dur="2.1s" repeatCount="indefinite"/>
        </rect>
      </g>`),
  },
  {
    id: 'ban_dojo',
    categoria: 'banner',
    nome: 'Estandarte do Dojo',
    descricao: 'Seda vermelha e o círculo do treino diário.',
    raridade: 'raro',
    tema: 'oriental',
    usaCores: ['destaque'],
    render: (p, u) => estandarte('#5c1a1a', '#8a2f2f', u, 'bdj', `
      <circle cx="120" cy="58" r="22" fill="none" stroke="${alfa('#ffffff', 0.85)}" stroke-width="4"/>
      <path d="M96 100 h48 M96 114 h48" stroke="${alfa('#ffffff', 0.4)}" stroke-width="3" stroke-linecap="round"/>
      <path d="M86 12 h68" stroke="${alfa(p.destaque.claro, 0.6)}" stroke-width="3" stroke-linecap="round"/>`),
  },
  {
    id: 'ban_lab',
    categoria: 'banner',
    nome: 'Quadro do Laboratório',
    descricao: 'Fórmulas de quem testa antes de afirmar.',
    raridade: 'incomum',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p, u) => estandarte('#10241e', alfa(p.destaque.base, 0.6), u, 'blb', `
      <g stroke="${alfa('#d9ffe9', 0.55)}" stroke-width="2.4" fill="none" stroke-linecap="round">
        <path d="M94 30 h30 M94 44 h44 M94 58 h22"/>
        <circle cx="132" cy="92" r="10"/>
        <path d="M94 92 h26 M132 104 v18"/>
      </g>
      <circle cx="132" cy="92" r="3" fill="${p.destaque.claro}">
        <animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite"/>
      </circle>`),
  },
  {
    id: 'ban_real',
    categoria: 'banner',
    nome: 'Estandarte Real',
    descricao: 'Púrpura, ouro e a certeza de quem lidera o ranking.',
    raridade: 'lendario',
    tema: 'fantasia',
    usaCores: [],
    render: (_p, u) => estandarte('#2a1440', '#e8b64c', u, 'brl', `
      <path d="M104 44 l 6 -12 l 10 10 l 10 -10 l 6 12 l -3 12 l -26 0 z" fill="#e8b64c"/>
      <circle cx="120" cy="80" r="3" fill="${alfa('#e8b64c', 0.9)}"/>
      <path d="M96 108 l 24 14 l 24 -14" fill="none" stroke="${alfa('#e8b64c', 0.55)}" stroke-width="3"/>
      <path d="M96 130 l 24 14 l 24 -14" fill="none" stroke="${alfa('#e8b64c', 0.3)}" stroke-width="3"/>`),
  },
  // ── 4.6 F2 · Onda 3 — 7 banners novos (meta §28: 15 ✓) ────────────
  {
    id: 'ban_campeao',
    categoria: 'banner',
    nome: 'Estandarte Campeão',
    descricao: 'Listras de pódio e o troféu do último split.',
    raridade: 'raro',
    tema: 'esportivo',
    render: (_p, u) => estandarte('#1c2a1e', '#2f4a33', u, 'bca', `
      <path d="M88 0 v 190 M152 0 v 190" stroke="${alfa('#e8b64c', 0.4)}" stroke-width="4"/>
      <path d="M108 30 h 24 v 10 a 12 12 0 0 1 -24 0 z" fill="#e8b64c"/>
      <path d="M104 32 a 6 6 0 0 0 6 8 M136 32 a 6 6 0 0 1 -6 8" stroke="#e8b64c" stroke-width="2.4" fill="none"/>
      <path d="M116 50 h 8 v 6 h -8 z M112 56 h 16 v 4 h -16 z" fill="#b07d1e"/>
      <circle cx="120" cy="90" r="2.6" fill="${alfa('#e8b64c', 0.8)}"/>
      <circle cx="120" cy="110" r="2.6" fill="${alfa('#e8b64c', 0.5)}"/>`),
  },
  {
    id: 'ban_corsario',
    categoria: 'banner',
    nome: 'Estandarte Corsário',
    descricao: 'Bandeira de quem navega fora da rota — e chega primeiro.',
    raridade: 'epico',
    tema: 'aventura',
    render: (_p, u) => estandarte('#14100c', '#3a2c20', u, 'bco', `
      <circle cx="120" cy="46" r="14" fill="#f4f0e6"/>
      <circle cx="115" cy="43" r="3" fill="#14100c"/>
      <circle cx="125" cy="43" r="3" fill="#14100c"/>
      <path d="M114 52 q 6 4 12 0" stroke="#14100c" stroke-width="2" fill="none"/>
      <path d="M100 70 l 40 14 M140 70 l -40 14" stroke="#f4f0e6" stroke-width="5" stroke-linecap="round"/>
      <path d="M92 110 h 56 M100 122 h 40" stroke="${alfa('#f4f0e6', 0.3)}" stroke-width="2"/>`),
  },
  {
    id: 'ban_guardiao',
    categoria: 'banner',
    nome: 'Estandarte Guardião',
    descricao: 'A árvore antiga que protege quem constrói.',
    raridade: 'incomum',
    tema: 'natureza',
    render: (_p, u) => estandarte('#122016', '#274a30', u, 'bgu', `
      <path d="M120 26 c -18 12 -26 28 -24 44 c 8 -6 16 -8 24 -8 s 16 2 24 8 c 2 -16 -6 -32 -24 -44 z" fill="#3ddc84" opacity="0.85"/>
      <path d="M117 60 h 6 v 26 h -6 z" fill="#7a4a32"/>
      <path d="M96 104 q 24 12 48 0 M96 124 q 24 12 48 0" stroke="${alfa('#3ddc84', 0.4)}" stroke-width="2.6" fill="none"/>
      <circle cx="104" cy="42" r="2" fill="#aef4c4"/>
      <circle cx="138" cy="50" r="2" fill="#aef4c4"/>`),
  },
  {
    id: 'ban_imperial',
    categoria: 'banner',
    nome: 'Estandarte Imperial',
    descricao: 'Púrpura, ouro e a coroa de quem assina o império.',
    raridade: 'lendario',
    tema: 'fantasia',
    render: (_p, u) => estandarte('#2a1040', '#e8b64c', u, 'bre', `
      <path d="M100 42 l 5 -16 l 9 11 l 6 -15 l 6 15 l 9 -11 l 5 16 c -13 -5 -27 -5 -40 0 z" fill="#e8b64c"/>
      <path d="M100 42 c 13 -5 27 -5 40 0 l -1 5 c -12 -4 -26 -4 -38 0 z" fill="#b07d1e"/>
      <circle cx="120" cy="22" r="2.6" fill="#ff5f8f"/>
      <path d="M94 70 q 26 16 52 0 M94 92 q 26 16 52 0" stroke="${alfa('#e8b64c', 0.45)}" stroke-width="2.6" fill="none"/>
      <path d="M88 130 l 8 8 l -8 8 M152 130 l -8 8 l 8 8" stroke="${alfa('#e8b64c', 0.6)}" stroke-width="2.4" fill="none"/>`),
  },
  {
    id: 'ban_neon_tokyo',
    categoria: 'banner',
    nome: 'Estandarte Neon',
    descricao: 'Letreiro vertical aceso na rua molhada.',
    raridade: 'epico',
    tema: 'cyberpunk',
    usaCores: ['destaque'],
    render: (p, u) => estandarte('#0a0d18', alfa(p.destaque.base, 0.8), u, 'bnt', `
      <g stroke="${p.destaque.claro}" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M108 28 h 24 M120 28 v 20 M108 48 h 24"/>
        <path d="M110 66 h 20 v 16 h -20 z"/>
        <path d="M108 100 l 12 16 l 12 -16"/>
        <animate attributeName="opacity" values="1;0.45;1;1;0.6;1" keyTimes="0;0.06;0.12;0.6;0.66;1" dur="3.2s" repeatCount="indefinite" calcMode="discrete"/>
      </g>
      <path d="M86 140 v 30 M154 140 v 30" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="2"/>`),
  },
  {
    id: 'ban_forjado',
    categoria: 'banner',
    nome: 'Estandarte da Forja',
    descricao: 'Martelo, bigorna e brasas que não apagam.',
    raridade: 'raro',
    tema: 'fantasia',
    render: (_p, u) => estandarte('#241109', '#7a2408', u, 'bfo', `
      <path d="M106 34 h 28 v 10 h -28 z" fill="#c4c9d6"/>
      <path d="M117 44 h 6 v 22 h -6 z" fill="#7a4a32"/>
      <path d="M102 78 h 36 l -6 10 h -24 z M110 88 h 20 v 6 h -20 z" fill="#5a6274"/>
      <circle cx="104" cy="112" r="2.4" fill="#ff8a3d"><animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite"/></circle>
      <circle cx="132" cy="120" r="2" fill="#ffb54d"><animate attributeName="opacity" values="0.4;1;0.4" dur="2.2s" repeatCount="indefinite"/></circle>
      <circle cx="118" cy="132" r="1.8" fill="#ff5230"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite"/></circle>`),
  },
  {
    id: 'ban_pixel',
    categoria: 'banner',
    nome: 'Estandarte Pixel',
    descricao: 'Herança de 8 bits pendurada com orgulho.',
    raridade: 'incomum',
    tema: 'gamer',
    usaCores: ['destaque'],
    render: (p, u) => {
      let px = '';
      const mapa = [[1, 1], [3, 1], [2, 2], [1, 3], [2, 3], [3, 3], [2, 4], [1, 5], [3, 5]];
      for (const [cx, cy] of mapa) {
        px += `<rect x="${96 + cx * 12}" y="${22 + cy * 12}" width="11" height="11" fill="${p.destaque.base}"/>`;
      }
      return estandarte('#10141f', '#28324a', u, 'bpx', `
      ${px}
      <path d="M86 120 h 68 M86 132 h 68" stroke="${alfa(p.destaque.base, 0.35)}" stroke-width="4" stroke-dasharray="8 6"/>`);
    },
  },
];
