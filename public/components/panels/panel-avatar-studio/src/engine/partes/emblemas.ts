// engine/partes/emblemas.ts — EMBLEMAS (Expansão §18): insígnias pequenas
// presas à roupa (peito direito, ~152,206), pintadas logo APÓS a roupa.
// @version 1.0.0  @created 2026-07-30
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

/** Pino base do emblema: disco + conteúdo centrado em (152, 206). */
function pino(u: string, chave: string, fundo: string, borda: string, conteudo: string): string {
  return `
    <g id="${u}${chave}" transform="translate(152 206)">
      <circle r="13" fill="${fundo}" stroke="${borda}" stroke-width="2"/>
      ${conteudo}
    </g>`;
}

export const EMBLEMAS: ParteDef[] = [
  {
    id: 'emb_dshow',
    categoria: 'emblema',
    nome: 'Emblema Dshow',
    descricao: 'O pixel fundador, preso ao peito de quem é da casa.',
    raridade: 'exclusivo',
    tema: 'dshow',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'eds', '#0a0e18', p.destaque.base, `
      <rect x="-5" y="-5" width="10" height="10" rx="2" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.6s" repeatCount="indefinite"/>
      </rect>`),
  },
  {
    id: 'emb_nexus',
    categoria: 'emblema',
    nome: 'Selo Nexus',
    descricao: 'O hexágono da rede — todos os nós respondem a você.',
    raridade: 'epico',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'enx', '#101726', alfa(p.destaque.base, 0.8), `
      <path d="M0 -7 L6 -3.5 L6 3.5 L0 7 L-6 3.5 L-6 -3.5 Z"
        fill="none" stroke="${p.destaque.claro}" stroke-width="2"/>
      <circle r="1.8" fill="${p.destaque.claro}"/>`),
  },
  {
    id: 'emb_elite',
    categoria: 'emblema',
    nome: 'Estrela Elite',
    descricao: 'Cinco pontas. Zero sorte. Só resultado.',
    raridade: 'lendario',
    tema: 'executivo',
    usaCores: [],
    render: (_p, u) => pino(u, 'eel', '#221a08', '#e8b64c', `
      <path d="M0 -7 L2 -2.2 L7 -2.2 L3 1.2 L4.4 6.4 L0 3.4 L-4.4 6.4 L-3 1.2 L-7 -2.2 L-2 -2.2 Z"
        fill="#e8b64c"/>`),
  },
  {
    id: 'emb_cyber',
    categoria: 'emblema',
    nome: 'Divisa Cyber',
    descricao: 'Duas divisas aceleradas — patente das vielas de neon.',
    raridade: 'raro',
    tema: 'cyberpunk',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'ecy', '#0c1220', alfa(p.destaque.base, 0.75), `
      <g fill="none" stroke="${p.destaque.claro}" stroke-width="2.2" stroke-linecap="round">
        <path d="M-5 3 L0 -3 L5 3"/>
        <path d="M-5 8 L0 2 L5 8" opacity="0.55"/>
      </g>`),
  },
  {
    id: 'emb_diamond',
    categoria: 'emblema',
    nome: 'Broche Diamond',
    descricao: 'Lapidado sob pressão, como todo trimestre fechado.',
    raridade: 'lendario',
    tema: 'executivo',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'edm', '#101726', alfa(p.destaque.claro, 0.9), `
      <path d="M-6 -2 L-3 -6 L3 -6 L6 -2 L0 7 Z"
        fill="${alfa(p.destaque.claro, 0.85)}" stroke="${p.destaque.base}" stroke-width="1.4"/>
      <path d="M-6 -2 L6 -2 M-3 -6 L0 7 M3 -6 L0 7"
        fill="none" stroke="${alfa('#0a0e18', 0.5)}" stroke-width="0.9"/>`),
  },
  {
    id: 'emb_raio',
    categoria: 'emblema',
    nome: 'Pino Relâmpago',
    descricao: 'Energia de sobra para o sprint que vier.',
    raridade: 'incomum',
    tema: 'gamer',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'erl', '#141926', alfa(p.destaque.base, 0.8), `
      <path d="M1 -8 L-4 1 L0 1 L-1 8 L5 -2 L1 -2 Z" fill="${p.destaque.claro}"/>`),
  },
  {
    id: 'emb_alvo',
    categoria: 'emblema',
    nome: 'Alvo Certeiro',
    descricao: 'Três círculos. Um destino: o centro.',
    raridade: 'raro',
    tema: 'executivo',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'eal', '#101726', alfa(p.destaque.base, 0.75), `
      <circle r="7" fill="none" stroke="${alfa(p.destaque.claro, 0.8)}" stroke-width="1.6"/>
      <circle r="3.6" fill="none" stroke="${alfa(p.destaque.claro, 0.9)}" stroke-width="1.6"/>
      <circle r="1.4" fill="${p.destaque.claro}"/>`),
  },
  {
    id: 'emb_coroa',
    categoria: 'emblema',
    nome: 'Coroa de Bolso',
    descricao: 'Realeza discreta, presa à lapela.',
    raridade: 'lendario',
    tema: 'fantasia',
    usaCores: [],
    render: (_p, u) => pino(u, 'eco', '#221a08', '#e8b64c', `
      <path d="M-6 3 L-6 -2 L-3 1 L0 -5 L3 1 L6 -2 L6 3 Z" fill="#e8b64c"/>
      <path d="M-6 5 h12 v2 h-12 z" fill="${alfa('#e8b64c', 0.7)}"/>`),
  },
  // ── 4.6 F2 · Onda 3 — 6 emblemas novos ────────────────────────────
  {
    id: 'emb_foguete',
    categoria: 'emblema',
    nome: 'Foguete',
    descricao: 'Lançamento confirmado — sem janela de rollback.',
    raridade: 'raro',
    tema: 'espaço',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'efg', '#0d1424', alfa(p.destaque.base, 0.8), `
      <path d="M0 -8 c 3 3 4 8 3 12 h -6 c -1 -4 0 -9 3 -12 z" fill="#e8ecf5"/>
      <path d="M-3 4 l -3 4 l 4 -1 M3 4 l 3 4 l -4 -1" fill="${p.destaque.base}" stroke="${p.destaque.base}" stroke-width="1"/>
      <circle cy="-1" r="1.8" fill="${p.destaque.base}"/>
      <path d="M-1 8 q 1 3 2 0" stroke="#ffb54d" stroke-width="1.6" fill="none">
        <animate attributeName="opacity" values="1;0.3;1" dur="0.9s" repeatCount="indefinite"/>
      </path>`),
  },
  {
    id: 'emb_escudo',
    categoria: 'emblema',
    nome: 'Escudo',
    descricao: 'Defesa em primeiro lugar — o resto é contra-ataque.',
    raridade: 'incomum',
    tema: 'aventura',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'esc', '#101726', alfa(p.destaque.base, 0.7), `
      <path d="M0 -7 c 3 2 6 2 8 2 c 0 6 -2 10 -8 12 c -6 -2 -8 -6 -8 -12 c 2 0 5 0 8 -2 z" fill="none" stroke="${p.destaque.claro}" stroke-width="1.8"/>
      <path d="M-3 0 l 2.4 2.6 l 4 -5" stroke="${p.destaque.claro}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`),
  },
  {
    id: 'emb_coracao_pixel',
    categoria: 'emblema',
    nome: 'Coração Pixel',
    descricao: 'HP cheio para o boss da sexta-feira.',
    raridade: 'raro',
    tema: 'gamer',
    render: (_p, u) => {
      const mapa = [[-5, -5], [-3, -5], [1, -5], [3, -5], [-7, -3], [-1, -3], [5, -3], [-7, -1], [5, -1], [-5, 1], [3, 1], [-3, 3], [1, 3], [-1, 5]];
      let px = '';
      for (const [x, y] of mapa) {
        px += `<rect x="${x}" y="${y}" width="2.2" height="2.2" fill="#ff4d5e"/>`;
      }
      return pino(u, 'ecp', '#160a10', '#ff4d5e', px);
    },
  },
  {
    id: 'emb_infinito',
    categoria: 'emblema',
    nome: 'Infinito',
    descricao: 'Escala sem teto, roadmap sem fim.',
    raridade: 'epico',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'einf', '#0d1220', alfa(p.destaque.base, 0.8), `
      <path d="M-7 0 c 0 -3.4 5 -3.4 7 0 c 2 3.4 7 3.4 7 0 c 0 -3.4 -5 -3.4 -7 0 c -2 3.4 -7 3.4 -7 0 z" fill="none" stroke="${p.destaque.claro}" stroke-width="2">
        <animate attributeName="stroke-dasharray" values="6 30;36 0;6 30" dur="3.4s" repeatCount="indefinite"/>
      </path>`),
  },
  {
    id: 'emb_engrenagem',
    categoria: 'emblema',
    nome: 'Engrenagem',
    descricao: 'A peça que faz o resto girar.',
    raridade: 'comum',
    tema: 'tecnologia',
    render: (_p, u) => {
      let dentes = '';
      for (let i = 0; i < 8; i++) {
        dentes += `<rect x="-1.6" y="-9" width="3.2" height="3.4" rx="1" fill="#c4c9d6" transform="rotate(${i * 45})"/>`;
      }
      return pino(u, 'eng', '#161b28', '#5a6274', `
      <g>${dentes}
        <animateTransform attributeName="transform" type="rotate" values="0;360" dur="10s" repeatCount="indefinite"/>
      </g>
      <circle r="5.6" fill="none" stroke="#c4c9d6" stroke-width="2"/>
      <circle r="1.8" fill="#c4c9d6"/>`);
    },
  },
  {
    id: 'emb_fenix',
    categoria: 'emblema',
    nome: 'Fênix',
    descricao: 'Caiu em produção, renasceu no hotfix.',
    raridade: 'lendario',
    bloqueadoPor: 'conquista:assiduo_30',
    tema: 'fantasia',
    render: (_p, u) => pino(u, 'efx', '#1c0a06', '#ff8a3d', `
      <path d="M0 6 c -5 -2 -7 -7 -5 -11 c 1 2 3 3 4 3 c -1 -3 0 -6 3 -8 c 0 3 1 5 3 6 c 2 -1 3 -3 3 -5 c 2 4 1 9 -3 12 c -1 1 -3 3 -5 3 z" fill="url(#${u}efxg)"/>
      <defs>
        <linearGradient id="${u}efxg" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#ff5230"/>
          <stop offset="1" stop-color="#ffd75e"/>
        </linearGradient>
      </defs>
      <circle cx="1" cy="-4" r="0.9" fill="#1c0a06"/>`),
  },
];
