// engine/partes/acessorios.ts — acessórios do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Renderizam ACIMA do cabelo (boné achata, headset envolve). Categoria opcional.
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

export const ACESSORIOS: ParteDef[] = [
  {
    id: 'ace_brinco',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Brinco de Argola',
    descricao: 'Detalhe dourado discreto na orelha.',
    raridade: 'comum',
    tema: 'casual',
    render: () => `
      <circle cx="170" cy="124" r="5" fill="none" stroke="#e8b64c" stroke-width="2.6"/>
      <circle cx="168.5" cy="121" r="1.2" fill="#fff3c9"/>`,
  },
  {
    id: 'ace_oculos',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Óculos de Grau',
    descricao: 'Armação redonda de intelectual.',
    raridade: 'comum',
    tema: 'executivo',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}lente" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa('#cfe0ff', 0.35)}"/>
          <stop offset="1" stop-color="${alfa('#cfe0ff', 0.08)}"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="108" r="15" fill="url(#${u}lente)" stroke="#20242e" stroke-width="3"/>
      <circle cx="140" cy="108" r="15" fill="url(#${u}lente)" stroke="#20242e" stroke-width="3"/>
      <path d="M115 106 q 5 -4 10 0" stroke="#20242e" stroke-width="3" fill="none"/>
      <line x1="85" y1="106" x2="72" y2="102" stroke="#20242e" stroke-width="3"/>
      <line x1="155" y1="106" x2="168" y2="102" stroke="#20242e" stroke-width="3"/>
      <path d="M92 100 a 15 15 0 0 1 8 -6" stroke="${alfa('#ffffff', 0.6)}" stroke-width="2" fill="none"/>`,
  },
  {
    id: 'ace_oculos_sol',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Óculos Escuros',
    descricao: 'Deal fechado, sol na cara, estilo intacto.',
    raridade: 'incomum',
    tema: 'casual',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}sol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#262b38"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M84 98 h 32 a 5 5 0 0 1 5 5 v 6 a 12 12 0 0 1 -12 12 h -18 a 12 12 0 0 1 -12 -12 v -6 a 5 5 0 0 1 5 -5 z" fill="url(#${u}sol)" stroke="#14171f" stroke-width="2"/>
      <path d="M124 98 h 32 a 5 5 0 0 1 5 5 v 6 a 12 12 0 0 1 -12 12 h -18 a 12 12 0 0 1 -12 -12 v -6 a 5 5 0 0 1 5 -5 z" fill="url(#${u}sol)" stroke="#14171f" stroke-width="2"/>
      <path d="M116 103 h 8" stroke="#14171f" stroke-width="3"/>
      <line x1="79" y1="103" x2="70" y2="100" stroke="#14171f" stroke-width="3"/>
      <line x1="161" y1="103" x2="170" y2="100" stroke="#14171f" stroke-width="3"/>
      <path d="M88 102 l 20 14" stroke="${alfa('#ffffff', 0.22)}" stroke-width="4" stroke-linecap="round"/>
      <path d="M128 102 l 20 14" stroke="${alfa('#ffffff', 0.22)}" stroke-width="4" stroke-linecap="round"/>`,
  },
  {
    id: 'ace_fone',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Fone Minimal',
    descricao: 'Headband slim para a playlist de foco.',
    raridade: 'incomum',
    tema: 'casual',
    usaCores: ['destaque'],
    render: (p) => `
      <path d="M66 108 c 0 -34 24 -54 54 -54 s 54 20 54 54" stroke="#20242e" stroke-width="7" fill="none" stroke-linecap="round"/>
      <rect x="58" y="100" width="16" height="26" rx="8" fill="#20242e"/>
      <rect x="166" y="100" width="16" height="26" rx="8" fill="#20242e"/>
      <rect x="62" y="106" width="8" height="14" rx="4" fill="${p.destaque.base}"/>
      <rect x="170" y="106" width="8" height="14" rx="4" fill="${p.destaque.base}"/>`,
  },
  {
    id: 'ace_bone',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Boné Snapback',
    descricao: 'Aba reta com logo bordado.',
    raridade: 'raro',
    tema: 'casual',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}bone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.roupa.claro}"/>
          <stop offset="1" stop-color="${p.roupa.escuro}"/>
        </linearGradient>
      </defs>
      <path d="M70 92 c 0 -30 22 -46 50 -46 s 50 16 50 46 l -2 4 c -30 -10 -66 -10 -96 0 z" fill="url(#${u}bone)"/>
      <path d="M118 46 c 2 -6 6 -8 10 -6 c -2 2 -4 6 -4 8 z" fill="${p.roupa.escuro}"/>
      <path d="M166 90 h 30 a 6 6 0 0 1 6 6 c 0 4 -3 6 -8 6 l -30 -4 z" fill="${p.roupa.profundo}"/>
      <path d="M70 92 c 30 -10 66 -10 96 0 l 2 6 c -32 -10 -68 -10 -100 0 z" fill="${p.roupa.profundo}"/>
      <circle cx="120" cy="70" r="9" fill="${alfa('#000000', 0.25)}"/>
      <path d="M116 66 l 4 8 l 4 -8 m -8 4 h 8" stroke="${p.destaque.claro}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'ace_headset',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Headset Pro Gamer',
    descricao: 'Conchas RGB com microfone articulado.',
    raridade: 'epico',
    tema: 'gamer',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}hs" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3a4152"/>
          <stop offset="1" stop-color="#161a24"/>
        </linearGradient>
      </defs>
      <path d="M62 110 c -2 -40 26 -62 58 -62 s 60 22 58 62" stroke="#161a24" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M64 108 c -2 -36 24 -56 56 -56" stroke="${alfa('#ffffff', 0.18)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="50" y="94" width="24" height="40" rx="12" fill="url(#${u}hs)"/>
      <rect x="166" y="94" width="24" height="40" rx="12" fill="url(#${u}hs)"/>
      <rect x="56" y="102" width="12" height="24" rx="6" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.8s" repeatCount="indefinite"/>
      </rect>
      <rect x="172" y="102" width="12" height="24" rx="6" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.8s" repeatCount="indefinite" begin="1.4s"/>
      </rect>
      <path d="M62 130 c 0 18 14 28 34 30" stroke="#161a24" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="102" cy="162" rx="8" ry="6" fill="#161a24"/>
      <circle cx="102" cy="162" r="2.4" fill="${p.destaque.claro}"/>`,
  },
  {
    id: 'ace_cachecol',
    categoria: 'acessorio',
    slot: 'pescoco',
    nome: 'Cachecol',
    descricao: 'Friozinho de ar-condicionado corporativo.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['destaque'],
    render: (p) => `
      <path d="M92 176 c 16 12 40 12 56 0 l 4 14 c -20 12 -44 12 -64 0 z" fill="${p.destaque.escuro}"/>
      <path d="M132 186 l 10 34 l 16 -6 l -12 -32 z" fill="${p.destaque.escuro}"/>
      <path d="M138 208 l 14 -5 m -12 -8 l 13 -5" stroke="${alfa('#000000', 0.25)}" stroke-width="2.4"/>
      <path d="M96 180 c 14 9 34 9 48 0" stroke="${alfa('#ffffff', 0.25)}" stroke-width="3" fill="none"/>`,
  },
  {
    id: 'ace_chapeu_mago',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Chapéu de Arquimago',
    descricao: 'Conjura dashboards do nada. Nível 20 em SQL arcano.',
    raridade: 'epico',
    tema: 'fantasia',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}mag" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stop-color="${p.roupa.claro}"/>
          <stop offset="1" stop-color="${p.roupa.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M64 76 c 36 -14 76 -14 112 0 c 4 2 4 8 -2 9 c -36 8 -72 8 -108 0 c -6 -1 -6 -7 -2 -9 z" fill="url(#${u}mag)"/>
      <path d="M94 74 c 4 -28 16 -48 34 -58 c 2 -1 5 0 4 3 c -3 14 2 22 12 28 c 8 5 10 16 4 24 c -16 6 -38 7 -54 3 z" fill="url(#${u}mag)"/>
      <path d="M96 68 c 18 4 32 3 46 -2" stroke="${p.destaque.base}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M128 26 l 2.2 5 l 5.4 0.6 l -4 3.6 l 1.1 5.3 l -4.7 -2.8 l -4.7 2.8 l 1.1 -5.3 l -4 -3.6 l 5.4 -0.6 z" fill="${p.destaque.claro}">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.6s" repeatCount="indefinite"/>
      </path>`,
  },
  {
    id: 'ace_drone',
    categoria: 'acessorio',
    slot: 'pescoco',
    nome: 'Drone Companion',
    descricao: 'Segue você desde o unboxing. Nunca pediu férias.',
    raridade: 'raro',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p) => `
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 -6; 0 0" dur="3.2s" repeatCount="indefinite"/>
        <ellipse cx="196" cy="64" rx="17" ry="11" fill="#2a3040"/>
        <ellipse cx="196" cy="61" rx="17" ry="8" fill="#3a4152"/>
        <circle cx="196" cy="64" r="5.5" fill="${p.destaque.base}">
          <animate attributeName="opacity" values="1;0.5;1" dur="1.6s" repeatCount="indefinite"/>
        </circle>
        <line x1="181" y1="56" x2="172" y2="50" stroke="#3a4152" stroke-width="3" stroke-linecap="round"/>
        <line x1="211" y1="56" x2="220" y2="50" stroke="#3a4152" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="170" cy="49" rx="7" ry="2.4" fill="${alfa(p.destaque.base, 0.55)}"/>
        <ellipse cx="222" cy="49" rx="7" ry="2.4" fill="${alfa(p.destaque.base, 0.55)}"/>
      </g>`,
  },
  {
    id: 'ace_medalha',
    categoria: 'acessorio',
    slot: 'pescoco',
    nome: 'Medalha de Veterano',
    descricao: '30 dias de casa, cravados em bronze e fita.',
    raridade: 'epico',
    tema: 'conquista',
    usaCores: ['destaque'],
    bloqueadoPor: 'conquista:veterano_30d',
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}med" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffd98a"/>
          <stop offset="1" stop-color="#b07d1e"/>
        </linearGradient>
      </defs>
      <path d="M96 186 l 10 24 l 8 -6 l -8 -22 z" fill="${p.destaque.base}"/>
      <path d="M116 182 l -6 26 l 9 2 l 7 -24 z" fill="${p.destaque.escuro}"/>
      <circle cx="112" cy="216" r="13" fill="url(#${u}med)" stroke="#8a5f10" stroke-width="1.6"/>
      <path d="M112 208 l 2.4 5 l 5.6 0.6 l -4.2 3.8 l 1.2 5.6 l -5 -3 l -5 3 l 1.2 -5.6 l -4.2 -3.8 l 5.6 -0.6 z" fill="#8a5f10"/>`,
  },
  {
    id: 'ace_gorro_natal',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Gorro de Natal',
    descricao: 'Dezembro no dash também tem clima.',
    raridade: 'raro',
    tema: 'evento',
    bloqueadoPor: 'evento:natal',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}gn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e85555"/>
          <stop offset="1" stop-color="#a12a2a"/>
        </linearGradient>
      </defs>
      <path d="M70 82 c 4 -34 30 -50 56 -46 c 26 4 44 26 40 54 l -10 -4 c -26 -14 -58 -16 -86 -4 z" fill="url(#${u}gn)"/>
      <path d="M166 90 c 10 2 16 10 14 20 c -2 8 -12 12 -18 6 c -6 -6 -4 -18 4 -26 z" fill="url(#${u}gn)"/>
      <circle cx="172" cy="112" r="9" fill="#f6f3ec"/>
      <path d="M68 84 c 30 -13 62 -11 90 4 l -2 12 c -28 -14 -58 -16 -86 -4 z" fill="#f6f3ec"/>`,
  },
  {
    id: 'ace_chapeu_bruxa',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Chapéu de Bruxa',
    descricao: 'Halloween chegou ao dashboard. Cuidado com as queries.',
    raridade: 'raro',
    tema: 'evento',
    usaCores: ['destaque'],
    bloqueadoPor: 'evento:halloween',
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}bx" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stop-color="#3a3050"/>
          <stop offset="1" stop-color="#171226"/>
        </linearGradient>
      </defs>
      <path d="M60 80 c 40 -12 80 -12 120 0 c 5 2 5 8 -1 9 c -39 8 -79 8 -118 0 c -6 -1 -6 -7 -1 -9 z" fill="url(#${u}bx)"/>
      <path d="M92 78 c 2 -26 12 -46 30 -58 c 3 -2 6 0 5 3 c -4 16 4 24 12 32 c 8 8 8 18 0 25 c -15 5 -32 4 -47 -2 z" fill="url(#${u}bx)"/>
      <path d="M94 72 c 16 5 30 5 44 -1" stroke="${p.destaque.base}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <rect x="118" y="62" width="9" height="9" rx="2" fill="${p.destaque.claro}" transform="rotate(12 122 66)"/>`,
  },
  {
    id: 'ace_coroa',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Coroa do Top 1',
    descricao: 'Ouro maciço para quem lidera o ranking.',
    raridade: 'lendario',
    tema: 'fantasia',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}coroa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffe89a"/>
          <stop offset="0.5" stop-color="#e8b64c"/>
          <stop offset="1" stop-color="#b07d1e"/>
        </linearGradient>
      </defs>
      <path d="M86 58 l 8 -26 l 14 18 l 12 -24 l 12 24 l 14 -18 l 8 26 c -22 -8 -46 -8 -68 0 z" fill="url(#${u}coroa)" stroke="#8a5f10" stroke-width="1.6"/>
      <path d="M86 58 c 22 -8 46 -8 68 0 l -2 8 c -20 -7 -44 -7 -64 0 z" fill="#b07d1e"/>
      <circle cx="120" cy="34" r="4" fill="#ff5f8f"/>
      <circle cx="97" cy="40" r="3" fill="#4cd9e8"/>
      <circle cx="143" cy="40" r="3" fill="#4cd9e8"/>
      <circle cx="120" cy="33" r="1.4" fill="#ffffff" opacity="0.9"/>`,
  },
  // ── 4.6 F2 · Onda 2 — 12 acessórios novos (4 por slot) ────────────
  {
    id: 'ace_boina',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Boina',
    descricao: 'Direção de arte no ponto exato.',
    raridade: 'incomum',
    tema: 'clássico',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}boi" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stop-color="${p.destaque.claro}"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M70 78 c -2 -26 24 -38 52 -36 c 30 2 50 16 46 38 c -2 10 -12 12 -24 10 c -26 -6 -52 -6 -66 -2 c -6 2 -8 -4 -8 -10 z" fill="url(#${u}boi)"/>
      <circle cx="122" cy="40" r="4" fill="${p.destaque.profundo}"/>
      <path d="M74 86 c 18 -6 48 -6 66 0" stroke="${alfa('#000000', 0.25)}" stroke-width="3" fill="none"/>`,
  },
  {
    id: 'ace_viseira_vr',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Headset VR',
    descricao: 'Metade aqui, metade no metaverso da Dshow.',
    raridade: 'epico',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}vr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3a4054"/>
          <stop offset="1" stop-color="#171b28"/>
        </linearGradient>
      </defs>
      <path d="M66 92 h 108 a 10 10 0 0 1 10 10 v 14 a 10 10 0 0 1 -10 10 h -30 c -8 -8 -40 -8 -48 0 h -30 a 10 10 0 0 1 -10 -10 v -14 a 10 10 0 0 1 10 -10 z" fill="url(#${u}vr)" stroke="#0c0f18" stroke-width="2"/>
      <path d="M72 100 h 96 v 10 h -96 z" fill="${alfa(p.destaque.base, 0.5)}" rx="4">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.4s" repeatCount="indefinite"/>
      </path>
      <path d="M66 98 a 50 57 0 0 0 -8 12 M174 98 a 50 57 0 0 1 8 12" stroke="#171b28" stroke-width="6" fill="none"/>
      <circle cx="170" cy="98" r="3" fill="${p.destaque.base}"/>`,
  },
  {
    id: 'ace_chifres_oni',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Chifres de Oni',
    descricao: 'O lado lendário do dojo desperta.',
    raridade: 'epico',
    tema: 'fantasia',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}oni" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#7a2d3c"/>
          <stop offset="1" stop-color="#ffb54d"/>
        </linearGradient>
      </defs>
      <path d="M88 64 c -8 -12 -10 -26 -4 -38 c 10 8 16 20 16 32 z" fill="url(#${u}oni)" stroke="#5a1f2c" stroke-width="1.6"/>
      <path d="M152 64 c 8 -12 10 -26 4 -38 c -10 8 -16 20 -16 32 z" fill="url(#${u}oni)" stroke="#5a1f2c" stroke-width="1.6"/>
      <path d="M90 52 c -3 -8 -3 -16 0 -22 M150 52 c 3 -8 3 -16 0 -22" stroke="${alfa('#ffffff', 0.35)}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'ace_tiara_led',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Tiara LED',
    descricao: 'Arco de luz fria sobre o cabelo.',
    raridade: 'raro',
    tema: 'cyberpunk',
    usaCores: ['destaque'],
    render: (p) => `
      <path d="M72 84 a 52 50 0 0 1 96 0" stroke="#20242e" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M72 84 a 52 50 0 0 1 96 0" stroke="${p.destaque.base}" stroke-width="3" fill="none" stroke-linecap="round">
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
      </path>
      <circle cx="72" cy="84" r="4.4" fill="${p.destaque.base}"/>
      <circle cx="168" cy="84" r="4.4" fill="${p.destaque.base}"/>`,
  },
  {
    id: 'ace_monoculo',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Monóculo',
    descricao: 'Analisa o relatório com um só olho — e razão.',
    raridade: 'raro',
    tema: 'clássico',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}mono" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa('#cfe0ff', 0.4)}"/>
          <stop offset="1" stop-color="${alfa('#cfe0ff', 0.1)}"/>
        </linearGradient>
      </defs>
      <circle cx="140" cy="108" r="16" fill="url(#${u}mono)" stroke="#e8b64c" stroke-width="3"/>
      <path d="M152 120 q 10 14 6 30" stroke="#e8b64c" stroke-width="2" fill="none"/>
      <circle cx="158" cy="152" r="3" fill="#e8b64c"/>
      <path d="M131 100 a 16 16 0 0 1 9 -7" stroke="${alfa('#ffffff', 0.6)}" stroke-width="2" fill="none"/>`,
  },
  {
    id: 'ace_pintura_guerra',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Pintura de Guerra',
    descricao: 'Três riscos: foco, meta e vitória.',
    raridade: 'incomum',
    tema: 'esportivo',
    usaCores: ['destaque'],
    render: (p) => `
      <path d="M82 116 l 14 4 M82 124 l 14 4" stroke="${p.destaque.base}" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
      <path d="M158 116 l -14 4 M158 124 l -14 4" stroke="${p.destaque.base}" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
      <path d="M116 130 l 8 3" stroke="${alfa(p.destaque.base, 0.6)}" stroke-width="3" stroke-linecap="round"/>`,
  },
  {
    id: 'ace_piercing',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Piercing',
    descricao: 'Detalhe de aço na sobrancelha.',
    raridade: 'comum',
    tema: 'urbano',
    render: () => `
      <circle cx="150" cy="92" r="2.6" fill="none" stroke="#c4c9d6" stroke-width="1.8"/>
      <circle cx="145" cy="94" r="1.6" fill="#c4c9d6"/>
      <circle cx="149" cy="91" r="0.8" fill="#ffffff"/>`,
  },
  {
    id: 'ace_oculos_3d',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Óculos Retrô 3D',
    descricao: 'O cinema em casa de 1989 aprova.',
    raridade: 'raro',
    tema: 'gamer',
    render: () => `
      <path d="M78 96 h 84 v 24 a 6 6 0 0 1 -6 6 h -28 l -8 -8 l -8 8 h -28 a 6 6 0 0 1 -6 -6 z" fill="#f4f0e6" stroke="#d8d2c2" stroke-width="2"/>
      <rect x="85" y="102" width="30" height="17" rx="3" fill="#ff4d5e" opacity="0.8"/>
      <rect x="125" y="102" width="30" height="17" rx="3" fill="#3aa0ff" opacity="0.8"/>
      <line x1="78" y1="102" x2="68" y2="100" stroke="#f4f0e6" stroke-width="4"/>
      <line x1="162" y1="102" x2="172" y2="100" stroke="#f4f0e6" stroke-width="4"/>`,
  },
  {
    id: 'ace_corrente',
    categoria: 'acessorio',
    slot: 'pescoco',
    nome: 'Corrente Dourada',
    descricao: 'Elo por elo, cada meta batida.',
    raridade: 'raro',
    tema: 'urbano',
    render: () => {
      let elos = '';
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const x = 88 + t * 64;
        const y = 196 + Math.sin(t * Math.PI) * 22;
        elos += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="none" stroke="#e8b64c" stroke-width="2.6"/>`;
      }
      return `${elos}<circle cx="120" cy="220" r="6.4" fill="#e8b64c" stroke="#b07d1e" stroke-width="1.6"/>
      <path d="M118 218 l 2 -3 l 2 3 l -2 3 z" fill="#fff3c9"/>`;
    },
  },
  {
    id: 'ace_capa_heroica',
    categoria: 'acessorio',
    slot: 'pescoco',
    nome: 'Capa Heroica',
    descricao: 'Esvoaça mesmo sem vento — questão de atitude.',
    raridade: 'lendario',
    bloqueadoPor: 'conquista:explorador_60',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}capa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.destaque.base}"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M60 196 c -10 14 -16 30 -14 44 l 26 0 c -6 -16 -6 -30 0 -40 z" fill="url(#${u}capa)">
        <animateTransform attributeName="transform" type="rotate" values="0 66 200;-3 66 200;0 66 200" dur="3.2s" repeatCount="indefinite"/>
      </path>
      <path d="M180 196 c 10 14 16 30 14 44 l -26 0 c 6 -16 6 -30 0 -40 z" fill="url(#${u}capa)">
        <animateTransform attributeName="transform" type="rotate" values="0 174 200;3 174 200;0 174 200" dur="3.2s" repeatCount="indefinite"/>
      </path>
      <path d="M74 200 q 46 -22 92 0 l -4 8 q -42 -18 -84 0 z" fill="${p.destaque.profundo}"/>
      <circle cx="94" cy="200" r="3.4" fill="#e8b64c"/>
      <circle cx="146" cy="200" r="3.4" fill="#e8b64c"/>`,
  },
  {
    id: 'ace_lenco_bandana',
    categoria: 'acessorio',
    slot: 'pescoco',
    nome: 'Lenço Bandana',
    descricao: 'Nó frouxo, espírito de estrada.',
    raridade: 'incomum',
    tema: 'aventura',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.destaque.claro}"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M88 192 q 32 20 64 0 l -6 16 q -26 14 -52 0 z" fill="url(#${u}band)"/>
      <path d="M112 206 l -10 22 l 12 -6 l 4 10 l 8 -24 z" fill="url(#${u}band)"/>
      <path d="M92 196 q 28 16 56 0" stroke="${alfa('#ffffff', 0.25)}" stroke-width="2" fill="none"/>
      <circle cx="100" cy="200" r="1.6" fill="${alfa('#ffffff', 0.5)}"/>
      <circle cx="126" cy="205" r="1.6" fill="${alfa('#ffffff', 0.5)}"/>
      <circle cx="142" cy="199" r="1.6" fill="${alfa('#ffffff', 0.5)}"/>`,
  },
  {
    id: 'ace_cracha_dshow',
    categoria: 'acessorio',
    slot: 'pescoco',
    nome: 'Crachá Dshow',
    descricao: 'Acesso liberado a todos os andares da casa.',
    raridade: 'exclusivo',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p) => `
      <path d="M104 186 l 14 26 M136 186 l -14 26" stroke="#20242e" stroke-width="3"/>
      <rect x="106" y="210" width="28" height="20" rx="4" fill="#f4f6fb" stroke="#c9d0dd" stroke-width="1.4"/>
      <rect x="106" y="210" width="28" height="6" rx="3" fill="${p.destaque.base}"/>
      <circle cx="113" cy="222" r="3" fill="#c9d0dd"/>
      <path d="M119 220 h 11 M119 224 h 8" stroke="#8b93a7" stroke-width="1.6" stroke-linecap="round"/>`,
  },
  // ── 4.6 F2 · Onda 5 — 5 acessórios novos (meta §28: 30 ✓) ─────────
  {
    id: 'ace_antena',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Antena Retrô',
    descricao: 'Sintonia fina com frequências que ninguém mais ouve.',
    raridade: 'incomum',
    tema: 'sci-fi',
    usaCores: ['destaque'],
    render: (p) => `
      <path d="M150 56 q 14 -18 8 -34" stroke="#5a6274" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <circle cx="158" cy="20" r="5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="158" cy="20" r="9" fill="none" stroke="${alfa(p.destaque.base, 0.45)}" stroke-width="1.6">
        <animate attributeName="r" values="7;12;7" dur="1.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="149" cy="57" r="4" fill="#5a6274"/>`,
  },
  {
    id: 'ace_tapa_olho',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Tapa-olho',
    descricao: 'Perdeu a aposta do sprint. Ganhou personalidade.',
    raridade: 'raro',
    tema: 'aventura',
    render: () => `
      <path d="M62 96 q 58 -22 116 6" stroke="#14100c" stroke-width="3.4" fill="none"/>
      <path d="M126 96 a 15 13 0 0 1 28 4 a 15 13 0 0 1 -28 -4 z" fill="#14100c"/>
      <path d="M130 98 a 11 9 0 0 1 12 -3" stroke="rgba(255,255,255,0.18)" stroke-width="2" fill="none"/>`,
  },
  {
    id: 'ace_colar_perolas',
    categoria: 'acessorio',
    slot: 'pescoco',
    nome: 'Colar de Pérolas',
    descricao: 'Clássico absoluto — combina até com moletom.',
    raridade: 'raro',
    tema: 'clássico',
    render: () => {
      let perolas = '';
      for (let i = 0; i < 11; i++) {
        const t = i / 10;
        const x = 92 + t * 56;
        const y = 194 + Math.sin(t * Math.PI) * 16;
        perolas += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="#f2ecf4" stroke="#c9bfd0" stroke-width="0.8"/>
        <circle cx="${(x - 1).toFixed(1)}" cy="${(y - 1.2).toFixed(1)}" r="1" fill="#ffffff"/>`;
      }
      return perolas;
    },
  },
  {
    id: 'ace_mochila_jato',
    categoria: 'acessorio',
    slot: 'pescoco',
    nome: 'Mochila a Jato',
    descricao: 'Para reuniões em prédios diferentes com 5 min de intervalo.',
    raridade: 'epico',
    tema: 'sci-fi',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}jato" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4a5266"/>
          <stop offset="1" stop-color="#20242e"/>
        </linearGradient>
      </defs>
      <rect x="52" y="186" width="22" height="40" rx="9" fill="url(#${u}jato)" stroke="#14171f" stroke-width="2"/>
      <rect x="166" y="186" width="22" height="40" rx="9" fill="url(#${u}jato)" stroke="#14171f" stroke-width="2"/>
      <rect x="56" y="192" width="14" height="6" rx="3" fill="${alfa(p.destaque.base, 0.85)}"/>
      <rect x="170" y="192" width="14" height="6" rx="3" fill="${alfa(p.destaque.base, 0.85)}"/>
      <path d="M58 228 q 5 8 10 0 z" fill="#ffb54d">
        <animateTransform attributeName="transform" type="scale" values="1 1;1 1.5;1 1" dur="0.5s" repeatCount="indefinite" additive="sum"/>
      </path>
      <path d="M172 228 q 5 8 10 0 z" fill="#ffb54d">
        <animateTransform attributeName="transform" type="scale" values="1 1.4;1 1;1 1.4" dur="0.5s" repeatCount="indefinite" additive="sum"/>
      </path>`,
  },
  {
    id: 'ace_aureola',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Auréola',
    descricao: 'Zero bugs em produção este mês. Santidade comprovada.',
    raridade: 'lendario',
    tema: 'fantasia',
    render: () => `
      <ellipse cx="120" cy="30" rx="30" ry="8" fill="none" stroke="#ffe89a" stroke-width="4">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="120" cy="30" rx="30" ry="8" fill="none" stroke="rgba(255,232,154,0.4)" stroke-width="8">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.25;0.6" dur="3s" repeatCount="indefinite"/>
      </ellipse>`,
  },
  // ── onda 1381 (decisão #148): ARTE NOVA destravando subcategorias
  //    "Em breve" da taxonomia v2 (mega programa, partes 4–8) ──
  {
    id: 'ace_mascara_neon',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Máscara Neon',
    descricao: 'Meia-máscara com traçado de luz — anonimato com estilo.',
    raridade: 'raro',
    tema: 'cyberpunk',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}masc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#232838"/>
          <stop offset="1" stop-color="#141824"/>
        </linearGradient>
      </defs>
      <path d="M78 128 q 42 26 84 0 l -4 30 q -38 22 -76 0 z" fill="url(#${u}masc)" stroke="#0d1018" stroke-width="2"/>
      <path d="M84 140 q 36 20 72 0" fill="none" stroke="#4ce0c3" stroke-width="2.4" stroke-linecap="round">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.2s" repeatCount="indefinite"/>
      </path>`,
  },
  {
    id: 'ace_gravata_borboleta',
    categoria: 'acessorio',
    slot: 'pescoco',
    nome: 'Gravata-borboleta',
    descricao: 'O nó perfeito para demo day e casamento no mesmo dia.',
    raridade: 'incomum',
    tema: 'executivo',
    render: (p) => `
      <path d="M120 196 l -26 -12 v 24 z" fill="${p.destaque.base}" stroke="#14171f" stroke-width="2"/>
      <path d="M120 196 l 26 -12 v 24 z" fill="${p.destaque.base}" stroke="#14171f" stroke-width="2"/>
      <rect x="113" y="189" width="14" height="14" rx="4" fill="${p.destaque.escuro}" stroke="#14171f" stroke-width="2"/>`,
  },
  {
    id: 'ace_asas_energia',
    categoria: 'acessorio',
    slot: 'costas',
    nome: 'Asas de Energia',
    descricao: 'Pura luz coerente. Não voam — pairam com intenção.',
    raridade: 'epico',
    tema: 'fantasia',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}asa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgba(124,208,255,0.9)"/>
          <stop offset="1" stop-color="rgba(124,208,255,0.15)"/>
        </linearGradient>
      </defs>
      <g>
        <path d="M92 168 q -52 -34 -64 -86 q 44 18 60 58 q -18 -4 -30 -14 q 14 26 34 42 z" fill="url(#${u}asa)"/>
        <path d="M148 168 q 52 -34 64 -86 q -44 18 -60 58 q 18 -4 30 -14 q -14 26 -34 42 z" fill="url(#${u}asa)"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="3.4s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'ace_gato_sombra',
    categoria: 'acessorio',
    slot: 'companheiro',
    nome: 'Gato Sombra',
    descricao: 'Aparece nas reuniões certas. Ignora as erradas.',
    raridade: 'raro',
    tema: 'fantasia',
    render: () => `
      <g>
        <ellipse cx="196" cy="150" rx="16" ry="12" fill="#1c1f2b"/>
        <circle cx="196" cy="132" r="10" fill="#1c1f2b"/>
        <path d="M189 126 l -3 -8 l 7 4 z" fill="#1c1f2b"/>
        <path d="M203 126 l 3 -8 l -7 4 z" fill="#1c1f2b"/>
        <circle cx="192.5" cy="131" r="1.8" fill="#4ce0c3"/>
        <circle cx="199.5" cy="131" r="1.8" fill="#4ce0c3"/>
        <path d="M210 152 q 10 -4 8 -14" fill="none" stroke="#1c1f2b" stroke-width="4" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="4s" repeatCount="indefinite"/>
      </g>`,
  },
  // ── onda 1402 (decisão #151): POPULAÇÃO Cabeça e Rosto — chapéus ────
  {
    id: 'ace_fedora',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Fedora Clássica',
    descricao: 'O acordo fecha antes do café esfriar.',
    raridade: 'incomum',
    tema: 'executivo',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}fed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.roupa.claro}"/>
          <stop offset="1" stop-color="${p.roupa.escuro}"/>
        </linearGradient>
      </defs>
      <path d="M58 82 c 40 -14 84 -14 124 0 c 6 2 5 9 -2 10 c -40 7 -80 7 -120 0 c -7 -1 -8 -8 -2 -10 z" fill="url(#${u}fed)"/>
      <path d="M84 80 c 0 -22 14 -36 36 -36 s 36 14 36 36 c -12 5 -24 7 -36 7 s -24 -2 -36 -7 z" fill="url(#${u}fed)"/>
      <path d="M112 45 q 8 -4 16 0 q -4 18 -8 34 q -4 -16 -8 -34 z" fill="${p.roupa.escuro}" opacity="0.55"/>
      <path d="M85 74 c 12 5 58 5 70 0 l 0 8 c -12 5 -58 5 -70 0 z" fill="${p.destaque.base}"/>
      <path d="M88 60 a 30 26 0 0 1 12 -12" stroke="${alfa('#ffffff', 0.35)}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'ace_cartola',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Cartola de Gala',
    descricao: 'Para apresentações em que o gráfico sobe sozinho.',
    raridade: 'raro',
    tema: 'executivo',
    lore: 'Herdada de um mágico que fazia métricas ruins desaparecerem. O truque nunca foi revelado.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}car" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2b2f3a"/>
          <stop offset="1" stop-color="#14161d"/>
        </linearGradient>
      </defs>
      <path d="M62 82 c 38 -10 78 -10 116 0 c 6 2 5 8 -1 9 c -38 6 -76 6 -114 0 c -6 -1 -7 -7 -1 -9 z" fill="url(#${u}car)"/>
      <path d="M88 80 l 2 -46 c 0 -4 3 -6 7 -6 l 46 0 c 4 0 7 2 7 6 l 2 46 c -20 5 -44 5 -64 0 z" fill="url(#${u}car)"/>
      <path d="M89 70 c 20 5 42 5 62 0 l 0 9 c -20 5 -42 5 -62 0 z" fill="${p.destaque.base}"/>
      <path d="M94 34 l 6 0 l -2 40 l -5 -1 z" fill="${alfa('#ffffff', 0.14)}"/>`,
  },
  {
    id: 'ace_chapeu_cowboy',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Chapéu de Boiadeiro',
    descricao: 'Laça os leads mais arredios do funil.',
    raridade: 'incomum',
    tema: 'casual',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}cow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a9713b"/>
          <stop offset="1" stop-color="#71481f"/>
        </linearGradient>
      </defs>
      <path d="M50 84 c 10 -12 26 -14 34 -8 c 22 6 50 6 72 0 c 8 -6 24 -4 34 8 c 4 5 -1 10 -8 9 c -42 12 -82 12 -124 0 c -7 1 -12 -4 -8 -9 z" fill="url(#${u}cow)"/>
      <path d="M86 80 c -2 -20 12 -36 34 -36 s 36 16 34 36 c -22 7 -46 7 -68 0 z" fill="url(#${u}cow)"/>
      <path d="M104 46 q 16 -6 32 0 q -6 10 -16 10 q -10 0 -16 -10 z" fill="#71481f" opacity="0.6"/>
      <path d="M87 74 c 22 6 44 6 66 0 l 0 7 c -22 6 -44 6 -66 0 z" fill="${p.destaque.base}"/>
      <circle cx="120" cy="77.5" r="3" fill="${p.destaque.claro}"/>`,
  },
  {
    id: 'ace_chapeu_chef',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Chapéu de Chef',
    descricao: 'Hoje o cardápio é dashboard no capricho.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}chef" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="1" stop-color="#d9dde8"/>
        </linearGradient>
      </defs>
      <path d="M88 78 l 0 -14 c -10 2 -18 -6 -14 -15 c 3 -8 12 -10 18 -6 c 1 -10 11 -16 20 -12 c 3 -8 15 -8 18 0 c 9 -4 19 2 20 12 c 6 -4 15 -2 18 6 c 4 9 -4 17 -14 15 l 0 14 c -22 6 -44 6 -66 0 z" fill="url(#${u}chef)"/>
      <path d="M88 76 c 22 6 44 6 66 0 l 0 10 c -22 6 -44 6 -66 0 z" fill="#c8cdda"/>
      <path d="M100 42 q 4 -6 12 -6" stroke="${alfa('#ffffff', 0.9)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M154 84 l 0 -5" stroke="${p.destaque.base}" stroke-width="3" stroke-linecap="round"/>`,
  },
  // ── onda 1402: adornos de cabeça ────────────────────────────────────
  {
    id: 'ace_bandana_testa',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Bandana de Foco',
    descricao: 'Amarrou, entrou em deep work. Ninguém interrompe.',
    raridade: 'comum',
    tema: 'gamer',
    usaCores: ['destaque'],
    render: (p) => `
      <path d="M72 84 c 30 -12 66 -12 96 0 l -2 12 c -30 -11 -62 -11 -92 0 z" fill="${p.destaque.base}"/>
      <path d="M72 84 c 30 -12 66 -12 96 0 l -1 5 c -30 -11 -64 -11 -94 0 z" fill="${p.destaque.claro}" opacity="0.5"/>
      <path d="M166 88 q 14 2 18 12 q -10 0 -14 8 q -2 -8 -8 -12 z" fill="${p.destaque.escuro}"/>
      <path d="M170 92 q 10 4 10 14" stroke="${p.destaque.profundo}" stroke-width="2" fill="none"/>`,
  },
  {
    id: 'ace_flor_lotus',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Flor de Lótus',
    descricao: 'Serenidade acima do prazo de entrega.',
    raridade: 'incomum',
    tema: 'mistico',
    usaCores: ['destaque'],
    render: (p) => `
      <g transform="translate(158 72) rotate(14)">
        <ellipse cx="0" cy="-8" rx="5" ry="10" fill="${p.destaque.claro}"/>
        <ellipse cx="-8" cy="-4" rx="5" ry="9" fill="${p.destaque.base}" transform="rotate(-40)"/>
        <ellipse cx="8" cy="-4" rx="5" ry="9" fill="${p.destaque.base}" transform="rotate(40)"/>
        <ellipse cx="-12" cy="2" rx="4" ry="8" fill="${p.destaque.escuro}" transform="rotate(-70)"/>
        <ellipse cx="12" cy="2" rx="4" ry="8" fill="${p.destaque.escuro}" transform="rotate(70)"/>
        <circle cx="0" cy="0" r="3.4" fill="#ffd75e"/>
      </g>`,
  },
  {
    id: 'ace_laco_fita',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Laço de Fita',
    descricao: 'Um toque de charme resolve reunião difícil.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['destaque'],
    render: (p) => `
      <g transform="translate(152 62) rotate(18)">
        <path d="M0 0 c -14 -10 -24 -6 -22 4 c 2 8 14 6 22 -4 z" fill="${p.destaque.base}"/>
        <path d="M0 0 c 14 -10 24 -6 22 4 c -2 8 -14 6 -22 -4 z" fill="${p.destaque.base}"/>
        <path d="M-4 2 c -8 8 -8 14 -3 16 c 4 1 7 -6 3 -16 z" fill="${p.destaque.escuro}"/>
        <path d="M4 2 c 8 8 8 14 3 16 c -4 1 -7 -6 -3 -16 z" fill="${p.destaque.escuro}"/>
        <circle cx="0" cy="1" r="4.4" fill="${p.destaque.claro}"/>
      </g>`,
  },
  {
    id: 'ace_diadema_perolas',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Diadema de Pérolas',
    descricao: 'Elegância que não precisa levantar a voz.',
    raridade: 'raro',
    tema: 'executivo',
    lore: 'Cada pérola marca um trimestre fechado acima da meta. A fileira ainda tem espaço.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}per" cx="0.35" cy="0.3" r="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="1" stop-color="#c3c9dd"/>
        </radialGradient>
      </defs>
      <path d="M74 78 c 28 -18 64 -18 92 0" stroke="${p.destaque.base}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="84" cy="72" r="4.6" fill="url(#${u}per)"/>
      <circle cx="98" cy="64.5" r="4.6" fill="url(#${u}per)"/>
      <circle cx="113" cy="60.5" r="4.6" fill="url(#${u}per)"/>
      <circle cx="128" cy="60.5" r="4.6" fill="url(#${u}per)"/>
      <circle cx="143" cy="64.5" r="4.6" fill="url(#${u}per)"/>
      <circle cx="157" cy="72" r="4.6" fill="url(#${u}per)"/>`,
  },
  // ── onda 1402: óculos ───────────────────────────────────────────────
  {
    id: 'ace_oculos_redondos',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Óculos Redondos',
    descricao: 'Aro fino de quem lê a documentação inteira.',
    raridade: 'comum',
    tema: 'executivo',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}lred" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa('#dce8ff', 0.3)}"/>
          <stop offset="1" stop-color="${alfa('#dce8ff', 0.06)}"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="108" r="13" fill="url(#${u}lred)" stroke="${p.destaque.base}" stroke-width="2.2"/>
      <circle cx="140" cy="108" r="13" fill="url(#${u}lred)" stroke="${p.destaque.base}" stroke-width="2.2"/>
      <path d="M113 106 q 7 -5 14 0" stroke="${p.destaque.base}" stroke-width="2.2" fill="none"/>
      <line x1="87" y1="105" x2="73" y2="101" stroke="${p.destaque.base}" stroke-width="2.2"/>
      <line x1="153" y1="105" x2="167" y2="101" stroke="${p.destaque.base}" stroke-width="2.2"/>`,
  },
  {
    id: 'ace_oculos_gatinho',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Óculos Gatinho',
    descricao: 'O canto levantado enxerga tendência antes de todo mundo.',
    raridade: 'incomum',
    tema: 'casual',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}gat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa('#ffd9ec', 0.3)}"/>
          <stop offset="1" stop-color="${alfa('#ffd9ec', 0.06)}"/>
        </linearGradient>
      </defs>
      <path d="M85 100 l 4 -7 l 6 5 c 8 -3 15 -3 21 0 l 1 8 a 13 11 0 0 1 -13 10 l -7 0 a 13 12 0 0 1 -12 -16 z" fill="url(#${u}gat)" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <path d="M155 100 l -4 -7 l -6 5 c -8 -3 -15 -3 -21 0 l -1 8 a 13 11 0 0 0 13 10 l 7 0 a 13 12 0 0 0 12 -16 z" fill="url(#${u}gat)" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <path d="M114 104 q 6 -4 12 0" stroke="${p.destaque.base}" stroke-width="2.4" fill="none"/>
      <line x1="86" y1="99" x2="73" y2="97" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <line x1="154" y1="99" x2="167" y2="97" stroke="${p.destaque.base}" stroke-width="2.4"/>`,
  },
  {
    id: 'ace_viseira_esporte',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Viseira Esportiva',
    descricao: 'Aerodinâmica até no scroll do backlog.',
    raridade: 'incomum',
    tema: 'gamer',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}esp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.75)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.85)}"/>
        </linearGradient>
      </defs>
      <path d="M78 98 c 28 -8 56 -8 84 0 c 4 1 5 5 4 9 c -3 12 -14 18 -28 17 l -36 0 c -14 1 -25 -5 -28 -17 c -1 -4 0 -8 4 -9 z" fill="url(#${u}esp)" stroke="#1a1e2a" stroke-width="2.4"/>
      <path d="M82 101 c 24 -6 52 -6 76 0" stroke="${alfa('#ffffff', 0.45)}" stroke-width="2.4" fill="none"/>
      <line x1="79" y1="100" x2="71" y2="97" stroke="#1a1e2a" stroke-width="3"/>
      <line x1="161" y1="100" x2="169" y2="97" stroke="#1a1e2a" stroke-width="3"/>`,
  },
  {
    id: 'ace_oculos_pixel',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Óculos Pixel',
    descricao: 'Deal with it — em 8 bits, como manda a tradição.',
    raridade: 'raro',
    tema: 'gamer',
    lore: 'Renderizados numa era em que cada pixel custava caro. Sobreviveram a todos os upgrades por puro estilo.',
    usaCores: ['destaque'],
    render: (p) => `
      <g fill="${p.destaque.profundo}">
        <rect x="84" y="100" width="32" height="6"/><rect x="124" y="100" width="32" height="6"/>
        <rect x="84" y="106" width="6" height="10"/><rect x="110" y="106" width="6" height="10"/>
        <rect x="124" y="106" width="6" height="10"/><rect x="150" y="106" width="6" height="10"/>
        <rect x="90" y="112" width="20" height="6"/><rect x="130" y="112" width="20" height="6"/>
        <rect x="116" y="102" width="8" height="4"/>
        <rect x="72" y="98" width="12" height="5"/><rect x="156" y="98" width="12" height="5"/>
      </g>
      <rect x="90" y="106" width="20" height="6" fill="${p.destaque.base}"/>
      <rect x="130" y="106" width="20" height="6" fill="${p.destaque.base}"/>
      <rect x="90" y="106" width="7" height="3" fill="${p.destaque.claro}"/>
      <rect x="130" y="106" width="7" height="3" fill="${p.destaque.claro}"/>`,
  },
  // ── onda 1402: capuzes e véus (destrava a subcategoria) ─────────────
  {
    id: 'ace_capuz_sombrio',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Capuz Sombrio',
    descricao: 'Commit às 3h da manhã pede vestimenta adequada.',
    raridade: 'raro',
    tema: 'fantasia',
    lore: 'Tecido que absorve luz de monitor. Quem o veste aparece no git log, nunca nas fotos.',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}cpz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.roupa.escuro}"/>
          <stop offset="1" stop-color="${p.roupa.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M120 40 c -36 0 -58 26 -58 62 c 0 22 6 40 16 52 l 10 -6 c -7 -12 -11 -28 -11 -44 c 0 -30 17 -50 43 -50 s 43 20 43 50 c 0 16 -4 32 -11 44 l 10 6 c 10 -12 16 -30 16 -52 c 0 -36 -22 -62 -58 -62 z" fill="url(#${u}cpz)"/>
      <path d="M120 44 c -30 0 -50 22 -50 56 l -6 2 c -1 -38 22 -64 56 -64 s 57 26 56 64 l -6 -2 c 0 -34 -20 -56 -50 -56 z" fill="${p.roupa.base}" opacity="0.5"/>
      <path d="M78 148 q 42 16 84 0 l -4 10 q -38 14 -76 0 z" fill="url(#${u}cpz)"/>
      <path d="M96 58 q 24 -12 48 0" stroke="${p.destaque.base}" stroke-width="2.6" fill="none" opacity="0.85"/>`,
  },
  {
    id: 'ace_capuz_ninja',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Capuz Ninja',
    descricao: 'Entrou no sprint, ninguém viu. Entregou, todos souberam.',
    raridade: 'epico',
    tema: 'fantasia',
    lore: 'Do clã que remove blockers em silêncio. A faixa só é concedida a quem nunca quebrou a main.',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}nin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.roupa.base}"/>
          <stop offset="1" stop-color="${p.roupa.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M120 46 c -30 0 -48 20 -48 52 c 0 12 2 22 6 30 l 12 -4 c -3 -8 -5 -16 -5 -26 c 0 -26 14 -42 35 -42 s 35 16 35 42 c 0 10 -2 18 -5 26 l 12 4 c 4 -8 6 -18 6 -30 c 0 -32 -18 -52 -48 -52 z" fill="url(#${u}nin)"/>
      <path d="M84 124 q 36 -10 72 0 l 0 22 q -36 12 -72 0 z" fill="url(#${u}nin)"/>
      <path d="M86 96 q 34 -8 68 0 l 0 10 q -34 -8 -68 0 z" fill="${p.roupa.profundo}"/>
      <path d="M88 90 c 22 -6 42 -6 64 0 l -1 6 c -20 -5 -42 -5 -62 0 z" fill="${p.destaque.base}"/>
      <path d="M152 92 q 16 4 20 16 q -8 -2 -12 4 q -4 -10 -8 -14 z" fill="${p.destaque.escuro}"/>`,
  },
  {
    id: 'ace_veu_mistico',
    categoria: 'acessorio',
    slot: 'cabeca',
    nome: 'Véu Místico',
    descricao: 'As previsões do roadmap ficam nítidas sob o véu.',
    raridade: 'epico',
    tema: 'mistico',
    lore: 'Tecido com fios de madrugadas estreladas. Quem o usa enxerga o backlog do próximo trimestre.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}veu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.5)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.16)}"/>
        </linearGradient>
      </defs>
      <path d="M70 76 c 8 -28 26 -42 50 -42 s 42 14 50 42 c 4 30 2 58 -10 82 q -6 -4 -8 -10 c 8 -22 9 -46 6 -68 c -6 -22 -20 -34 -38 -34 s -32 12 -38 34 c -3 22 -2 46 6 68 q -2 6 -8 10 c -12 -24 -14 -52 -10 -82 z" fill="url(#${u}veu)"/>
      <path d="M74 74 c 28 -12 64 -12 92 0" stroke="${p.destaque.base}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="120" cy="52" r="3" fill="#ffd75e"/>
      <circle cx="82" cy="112" r="1.6" fill="${alfa('#ffffff', 0.85)}"/>
      <circle cx="158" cy="104" r="1.6" fill="${alfa('#ffffff', 0.85)}"/>
      <circle cx="76" cy="140" r="1.3" fill="${alfa('#ffffff', 0.7)}"/>
      <circle cx="163" cy="136" r="1.3" fill="${alfa('#ffffff', 0.7)}"/>`,
  },
  // ── onda 1402: máscaras (proteção facial) ───────────────────────────
  {
    id: 'ace_mascara_oni',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Máscara Oni',
    descricao: 'Negociação difícil? O oni entra primeiro.',
    raridade: 'raro',
    tema: 'fantasia',
    lore: 'Esculpida para assustar bugs de produção. Dizem que os críticos fecham sozinhos quando ela aparece.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}oni" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#c9403a"/>
          <stop offset="1" stop-color="#8a2420"/>
        </linearGradient>
      </defs>
      <path d="M84 118 c 24 10 48 10 72 0 c 4 16 -2 34 -14 42 c -14 9 -30 9 -44 0 c -12 -8 -18 -26 -14 -42 z" fill="url(#${u}oni)"/>
      <path d="M94 132 q 8 6 16 2 M130 134 q 8 4 16 -2" stroke="#3a0f0d" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M104 150 l 5 10 l 5 -10 z M126 150 l 5 10 l 5 -10 z" fill="#fff3e0"/>
      <path d="M100 142 q 20 8 40 0" stroke="#3a0f0d" stroke-width="2.6" fill="none"/>
      <path d="M92 122 q -6 -10 -2 -18 q 8 4 8 14 z M148 122 q 6 -10 2 -18 q -8 4 -8 14 z" fill="${p.destaque.base}"/>`,
  },
  {
    id: 'ace_mascara_kitsune',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Máscara Kitsune',
    descricao: 'Nove caudas, nove sprints sem retrabalho.',
    raridade: 'epico',
    tema: 'fantasia',
    lore: 'A raposa guardiã dos deploys de sexta-feira. Sorri porque sabe que o rollback está pronto.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}kit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="1" stop-color="#e4e6f2"/>
        </linearGradient>
      </defs>
      <path d="M82 96 c 24 -12 52 -12 76 0 c 6 22 0 46 -16 58 c -8 -14 -14 -14 -22 -2 c -8 -12 -14 -12 -22 2 c -16 -12 -22 -36 -16 -58 z" fill="url(#${u}kit)"/>
      <path d="M96 112 l 16 6 l -14 6 z M144 112 l -16 6 l 14 6 z" fill="${p.destaque.base}"/>
      <path d="M112 142 q 8 6 16 0 l -8 8 z" fill="${p.destaque.escuro}"/>
      <path d="M90 100 q 10 -6 20 -4 M150 100 q -10 -6 -20 -4" stroke="${p.destaque.base}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M118 96 l 2 -6 l 2 6 z" fill="${p.destaque.base}"/>`,
  },
  {
    id: 'ace_mascara_teatro',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Máscara de Teatro',
    descricao: 'Sorriso de demo funcionando na primeira tentativa.',
    raridade: 'incomum',
    tema: 'casual',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}tea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.destaque.claro}"/>
          <stop offset="1" stop-color="${p.destaque.escuro}"/>
        </linearGradient>
      </defs>
      <path d="M86 96 c 22 -10 46 -10 68 0 c 5 20 0 42 -13 54 c -12 10 -30 10 -42 0 c -13 -12 -18 -34 -13 -54 z" fill="url(#${u}tea)"/>
      <path d="M97 116 a 8 5 0 0 0 14 0 z M129 116 a 8 5 0 0 0 14 0 z" fill="#1d2130"/>
      <path d="M102 138 q 18 16 36 0 q -8 20 -18 20 q -10 0 -18 -20 z" fill="#1d2130"/>
      <path d="M92 100 a 30 20 0 0 1 16 -8" stroke="${alfa('#ffffff', 0.5)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'ace_medico_peste',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Médico da Peste',
    descricao: 'Especialista em epidemias de bug. Faz visita de código.',
    raridade: 'epico',
    tema: 'fantasia',
    lore: 'O bico guarda ervas contra código legado. O diagnóstico é sempre o mesmo: precisa de testes.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}pes" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3a3630"/>
          <stop offset="1" stop-color="#211e1a"/>
        </linearGradient>
        <radialGradient id="${u}olh" cx="0.35" cy="0.35" r="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.9)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.9)}"/>
        </radialGradient>
      </defs>
      <path d="M84 98 c 24 -10 48 -10 72 0 c 3 10 3 20 0 28 l -34 44 c -1 2 -3 2 -4 0 l -34 -44 c -3 -8 -3 -18 0 -28 z" fill="url(#${u}pes)"/>
      <path d="M110 126 l 10 38 l 10 -38 c 8 -10 8 -20 2 -24 q -12 6 -24 0 c -6 4 -6 14 2 24 z" fill="#2b2822"/>
      <circle cx="100" cy="110" r="9" fill="url(#${u}olh)" stroke="#151310" stroke-width="2.6"/>
      <circle cx="140" cy="110" r="9" fill="url(#${u}olh)" stroke="#151310" stroke-width="2.6"/>
      <path d="M116 132 l 3 8 M124 132 l -3 8" stroke="#151310" stroke-width="2" stroke-linecap="round"/>
      <path d="M86 100 c 22 -8 46 -8 68 0" stroke="#4a453c" stroke-width="2" fill="none"/>`,
  },
  {
    id: 'ace_mascara_hoquei',
    categoria: 'acessorio',
    slot: 'rosto',
    nome: 'Máscara de Hóquei',
    descricao: 'Sexta-feira 13 é só mais um dia de deploy.',
    raridade: 'raro',
    tema: 'gamer',
    lore: 'Veterana de mil incidentes sev-1. As marcas são de gelo, não de medo.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}hoq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f2f3f8"/>
          <stop offset="1" stop-color="#c9cdda"/>
        </linearGradient>
      </defs>
      <path d="M85 92 c 22 -10 48 -10 70 0 c 6 22 1 48 -14 62 c -12 11 -30 11 -42 0 c -15 -14 -20 -40 -14 -62 z" fill="url(#${u}hoq)"/>
      <path d="M95 112 a 9 6 0 0 0 14 0 z M131 112 a 9 6 0 0 0 14 0 z" fill="#1d2130"/>
      <g fill="#1d2130">
        <circle cx="107" cy="132" r="2.2"/><circle cx="120" cy="136" r="2.2"/><circle cx="133" cy="132" r="2.2"/>
        <circle cx="112" cy="148" r="2.2"/><circle cx="128" cy="148" r="2.2"/><circle cx="120" cy="158" r="2.2"/>
      </g>
      <path d="M88 100 l 20 60 M152 100 l -20 60" stroke="${p.destaque.base}" stroke-width="2.4" opacity="0.7"/>`,
  },
  // ── onda 1403 (decisão #153): POPULAÇÃO das subcategorias vazias ────
  // Mochilas e bolsas (slot costas — alça cruza o busto, corpo da bolsa
  // aparece na lateral, como a mochila a jato faz)
  {
    id: 'ace_bolsa_mensageiro',
    categoria: 'acessorio',
    slot: 'costas',
    nome: 'Bolsa Mensageiro',
    descricao: 'Carrega o notebook e três ideias por hora.',
    raridade: 'comum',
    tema: 'executivo',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}bmsg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#5a6474"/>
          <stop offset="1" stop-color="#3a4150"/>
        </linearGradient>
      </defs>
      <path d="M86 176 l 62 -32" stroke="url(#${u}bmsg)" stroke-width="9" stroke-linecap="round"/>
      <path d="M40 168 h 52 a 6 6 0 0 1 6 6 v 30 a 8 8 0 0 1 -8 8 h -48 a 8 8 0 0 1 -8 -8 v -30 a 6 6 0 0 1 6 -6 z" fill="url(#${u}bmsg)"/>
      <path d="M36 170 h 60 l 0 12 c -20 6 -40 6 -60 0 z" fill="#2b303c"/>
      <rect x="58" y="182" width="16" height="10" rx="2.4" fill="${p.destaque.base}"/>
      <path d="M40 172 h 10 v 34" stroke="${alfa('#ffffff', 0.14)}" stroke-width="3" fill="none"/>`,
  },
  {
    id: 'ace_bolsa_tatica',
    categoria: 'acessorio',
    slot: 'costas',
    nome: 'Mochila Tática',
    descricao: 'Um bolso para cada plano B.',
    raridade: 'incomum',
    tema: 'gamer',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}btat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3c4433"/>
          <stop offset="1" stop-color="#252a1e"/>
        </linearGradient>
      </defs>
      <path d="M62 150 c -18 4 -28 18 -28 38 l 0 20 c 0 8 6 14 14 14 l 24 0 c 8 0 14 -6 14 -14 l 0 -20 c 0 -20 -8 -34 -24 -38 z" fill="url(#${u}btat)"/>
      <rect x="44" y="176" width="34" height="18" rx="4" fill="#2b3024"/>
      <rect x="50" y="200" width="22" height="12" rx="3" fill="#2b3024"/>
      <path d="M46 168 h 30 M46 216 h 30" stroke="${p.destaque.base}" stroke-width="3" stroke-linecap="round"/>
      <path d="M92 152 l 40 24" stroke="#2b3024" stroke-width="8" stroke-linecap="round"/>
      <circle cx="61" cy="185" r="3" fill="${p.destaque.claro}"/>`,
  },
  {
    id: 'ace_bolsa_couro',
    categoria: 'acessorio',
    slot: 'costas',
    nome: 'Bolsa de Couro',
    descricao: 'Envelhece melhor que a maioria dos roadmaps.',
    raridade: 'raro',
    tema: 'casual',
    lore: 'Costura reforçada por três gerações de artesãos. Já viu mais reuniões do que muito diretor.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}bcou" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a9713b"/>
          <stop offset="1" stop-color="#6e451e"/>
        </linearGradient>
      </defs>
      <path d="M150 174 l 46 -24" stroke="url(#${u}bcou)" stroke-width="9" stroke-linecap="round"/>
      <path d="M156 168 h 46 a 7 7 0 0 1 7 7 v 28 a 9 9 0 0 1 -9 9 h -42 a 9 9 0 0 1 -9 -9 v -28 a 7 7 0 0 1 7 -7 z" fill="url(#${u}bcou)"/>
      <path d="M151 170 h 56 l 0 14 c -18 7 -38 7 -56 0 z" fill="#5a3517"/>
      <path d="M172 184 a 7 7 0 0 1 14 0 l 0 8 a 7 7 0 0 1 -14 0 z" fill="${p.destaque.base}"/>
      <circle cx="179" cy="188" r="2.2" fill="${p.destaque.claro}"/>`,
  },
  // Robôs (slot companheiro — flutuam na lateral direita, como o drone)
  {
    id: 'ace_robo_assistente',
    categoria: 'acessorio',
    slot: 'companheiro',
    nome: 'Robô Assistente',
    descricao: 'Anota tudo. Julga silenciosamente as suas planilhas.',
    raridade: 'incomum',
    tema: 'tecnologia',
    piscar: false,
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}rass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e4e8f2"/>
          <stop offset="1" stop-color="#aab2c4"/>
        </linearGradient>
      </defs>
      <g>
        <rect x="180" y="120" width="34" height="40" rx="10" fill="url(#${u}rass)"/>
        <rect x="186" y="128" width="22" height="12" rx="6" fill="#1d2130"/>
        <circle cx="193" cy="134" r="2.6" fill="${p.destaque.base}"/>
        <circle cx="201" cy="134" r="2.6" fill="${p.destaque.base}"/>
        <path d="M190 148 q 7 4 14 0" stroke="${p.destaque.base}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <line x1="197" y1="112" x2="197" y2="120" stroke="#aab2c4" stroke-width="3"/>
        <circle cx="197" cy="109" r="3.4" fill="${p.destaque.claro}"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="3.6s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'ace_robo_bit',
    categoria: 'acessorio',
    slot: 'companheiro',
    nome: 'Bit',
    descricao: 'Um byte de companhia. Dois quando está feliz.',
    raridade: 'comum',
    tema: 'gamer',
    piscar: false,
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}rbit" cx="0.35" cy="0.3" r="1">
          <stop offset="0" stop-color="#3a4150"/>
          <stop offset="1" stop-color="#20242e"/>
        </radialGradient>
      </defs>
      <g>
        <circle cx="196" cy="140" r="17" fill="url(#${u}rbit)"/>
        <path d="M186 136 a 13 13 0 0 1 20 0 l 0 8 a 13 13 0 0 1 -20 0 z" fill="#141720"/>
        <rect x="189" y="136" width="5" height="7" rx="2" fill="${p.destaque.base}"/>
        <rect x="198" y="136" width="5" height="7" rx="2" fill="${p.destaque.base}"/>
        <path d="M181 126 l -5 -6 M211 126 l 5 -6" stroke="#3a4150" stroke-width="3" stroke-linecap="round"/>
        <circle cx="175" cy="118" r="2.4" fill="${p.destaque.claro}"/>
        <circle cx="217" cy="118" r="2.4" fill="${p.destaque.claro}"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="3s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'ace_robo_aranha',
    categoria: 'acessorio',
    slot: 'companheiro',
    nome: 'Robô Aranha',
    descricao: 'Oito patas, zero bugs — ele resolve os dele sozinho.',
    raridade: 'raro',
    tema: 'tecnologia',
    lore: 'Protótipo de manutenção que se recusou a ser desligado. Hoje conserta o que ninguém viu quebrar.',
    piscar: false,
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}rara" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4a5162"/>
          <stop offset="1" stop-color="#2b303c"/>
        </linearGradient>
      </defs>
      <g>
        <ellipse cx="198" cy="176" rx="15" ry="11" fill="url(#${u}rara)"/>
        <circle cx="198" cy="170" r="6" fill="#141720"/>
        <circle cx="196" cy="169" r="1.8" fill="${p.destaque.base}"/>
        <circle cx="201" cy="169" r="1.8" fill="${p.destaque.base}"/>
        <path d="M186 176 q -10 -4 -12 -14 M186 180 q -12 2 -16 10 M210 176 q 10 -4 12 -14 M210 180 q 12 2 16 10" stroke="#2b303c" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M190 186 q -4 8 -10 10 M206 186 q 4 8 10 10" stroke="#2b303c" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="198" cy="160" r="2" fill="${p.destaque.claro}"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="2.6s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'ace_robo_guardiao',
    categoria: 'acessorio',
    slot: 'companheiro',
    nome: 'Robô Guardião',
    descricao: 'Firewall com personalidade. E escudo.',
    raridade: 'epico',
    tema: 'tecnologia',
    lore: 'Sentinela aposentado dos servidores de produção. Nunca perdeu um deploy no seu turno — e não pretende começar.',
    piscar: false,
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}rgua" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3a4150"/>
          <stop offset="1" stop-color="#20242e"/>
        </linearGradient>
      </defs>
      <g>
        <path d="M182 118 l 16 -8 l 16 8 l 0 22 q 0 18 -16 26 q -16 -8 -16 -26 z" fill="url(#${u}rgua)"/>
        <path d="M186 121 l 12 -6 l 12 6 l 0 18 q 0 14 -12 21 q -12 -7 -12 -21 z" fill="none" stroke="${p.destaque.base}" stroke-width="2"/>
        <rect x="192" y="128" width="12" height="7" rx="3.5" fill="#141720"/>
        <circle cx="196" cy="131.5" r="1.8" fill="${p.destaque.claro}"/>
        <circle cx="200" cy="131.5" r="1.8" fill="${p.destaque.claro}"/>
        <path d="M192 146 l 6 4 l 6 -4" stroke="${p.destaque.base}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="4.2s" repeatCount="indefinite"/>
      </g>`,
  },
  // Espíritos (slot companheiro — presenças etéreas com alfa)
  {
    id: 'ace_espirito_chama',
    categoria: 'acessorio',
    slot: 'companheiro',
    nome: 'Espírito de Chama',
    descricao: 'Esquenta o café e as discussões de arquitetura.',
    raridade: 'raro',
    tema: 'mistico',
    lore: 'Nasceu da primeira vela de uma virada de ano fiscal. Aquece quem entrega e chamusca quem enrola.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}echa" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="${alfa('#ff8a3d', 0.9)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.claro, 0.75)}"/>
        </linearGradient>
      </defs>
      <g>
        <path d="M198 116 c 10 10 16 20 16 30 c 0 12 -8 20 -16 20 c -8 0 -16 -8 -16 -20 c 0 -6 3 -10 6 -14 c 1 5 3 8 6 9 c -2 -8 -1 -17 4 -25 z" fill="url(#${u}echa)"/>
        <circle cx="194" cy="148" r="2.2" fill="#2b1608"/>
        <circle cx="202" cy="148" r="2.2" fill="#2b1608"/>
        <path d="M195 155 q 3 2 6 0" stroke="#2b1608" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="3.2s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'ace_espirito_agua',
    categoria: 'acessorio',
    slot: 'companheiro',
    nome: 'Espírito de Água',
    descricao: 'Flui pelos bloqueios. Literalmente.',
    raridade: 'raro',
    tema: 'mistico',
    lore: 'Gota que escapou do primeiro gráfico de burndown. Desde então, só desce suave.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}eagu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa('#9fd8ff', 0.85)}"/>
          <stop offset="1" stop-color="${alfa('#3d7dd6', 0.85)}"/>
        </linearGradient>
      </defs>
      <g>
        <path d="M198 114 c 12 14 18 24 18 34 a 18 18 0 0 1 -36 0 c 0 -10 6 -20 18 -34 z" fill="url(#${u}eagu)"/>
        <circle cx="193" cy="146" r="2.2" fill="#12365e"/>
        <circle cx="203" cy="146" r="2.2" fill="#12365e"/>
        <path d="M194 153 q 4 3 8 0" stroke="#12365e" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M189 132 a 12 12 0 0 1 5 -8" stroke="${alfa('#ffffff', 0.7)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <circle cx="212" cy="122" r="2.4" fill="${alfa(p.destaque.claro, 0.8)}"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="3.8s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'ace_espirito_estelar',
    categoria: 'acessorio',
    slot: 'companheiro',
    nome: 'Wisp Estelar',
    descricao: 'Poeira de estrela com opinião própria sobre KPIs.',
    raridade: 'epico',
    tema: 'mistico',
    lore: 'Fragmento de uma constelação que só aparece para quem bate a meta anual. Ele escolheu ficar.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}eest" cx="0.5" cy="0.5" r="0.9">
          <stop offset="0" stop-color="${alfa('#ffffff', 0.95)}"/>
          <stop offset="0.55" stop-color="${alfa(p.destaque.claro, 0.7)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.12)}"/>
        </radialGradient>
      </defs>
      <g>
        <circle cx="198" cy="140" r="19" fill="url(#${u}eest)"/>
        <circle cx="193" cy="138" r="2" fill="#2b2450"/>
        <circle cx="203" cy="138" r="2" fill="#2b2450"/>
        <path d="M195 145 q 3 2 6 0" stroke="#2b2450" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M212 118 l 1.6 4 l 4 1.6 l -4 1.6 l -1.6 4 l -1.6 -4 l -4 -1.6 l 4 -1.6 z" fill="${alfa('#ffffff', 0.9)}"/>
        <circle cx="182" cy="158" r="1.6" fill="${alfa('#ffffff', 0.8)}"/>
        <circle cx="214" cy="152" r="1.3" fill="${alfa('#ffffff', 0.7)}"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -7;0 0" dur="4.4s" repeatCount="indefinite"/>
      </g>`,
  },
  // Runas e círculos (slot flutuante — glifos orbitando, como a auréola)
  {
    id: 'ace_runa_circulo',
    categoria: 'acessorio',
    slot: 'flutuante',
    nome: 'Círculo Rúnico',
    descricao: 'Um anel de símbolos que aprova PRs dignos.',
    raridade: 'raro',
    tema: 'mistico',
    lore: 'Inscrição circular achada no rodapé de um contrato antigo. Ninguém traduziu; todos respeitam.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}rcir" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.9)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0.7)}"/>
        </linearGradient>
      </defs>
      <g>
        <ellipse cx="120" cy="52" rx="46" ry="10" fill="none" stroke="url(#${u}rcir)" stroke-width="3"/>
        <g fill="${p.destaque.claro}" font-size="0">
          <rect x="78" y="46" width="5" height="7" rx="1"/>
          <rect x="100" y="40" width="5" height="7" rx="1" transform="rotate(-12 102 43)"/>
          <rect x="134" y="40" width="5" height="7" rx="1" transform="rotate(12 136 43)"/>
          <rect x="157" y="46" width="5" height="7" rx="1"/>
          <rect x="118" y="60" width="5" height="7" rx="1"/>
        </g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="5s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'ace_runa_protecao',
    categoria: 'acessorio',
    slot: 'flutuante',
    nome: 'Runa de Proteção',
    descricao: 'Escudo antigo contra hotfix de sexta-feira.',
    raridade: 'raro',
    tema: 'mistico',
    lore: 'Gravada na porta da primeira sala de servidores da Dshow. Migrou para a nuvem junto com todo o resto.',
    usaCores: ['destaque'],
    render: (p) => `
      <g>
        <path d="M64 96 l 0 26 M56 104 l 16 10 M72 104 l -16 10" stroke="${p.destaque.base}" stroke-width="3.6" stroke-linecap="round"/>
        <circle cx="64" cy="109" r="16" fill="none" stroke="${alfa(p.destaque.claro, 0.55)}" stroke-width="2"/>
        <circle cx="64" cy="88" r="1.8" fill="${p.destaque.claro}"/>
        <circle cx="64" cy="130" r="1.8" fill="${p.destaque.claro}"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="4.6s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'ace_runa_glifo',
    categoria: 'acessorio',
    slot: 'flutuante',
    nome: 'Glifo Arcano',
    descricao: 'Compila intenção em resultado. Sem warnings.',
    raridade: 'epico',
    tema: 'mistico',
    lore: 'O único glifo que aceita acento agudo. Escreve o futuro em UTF-8.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}rgli" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.95)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0.75)}"/>
        </linearGradient>
      </defs>
      <g>
        <path d="M176 84 l 12 -20 l 12 20 l -12 8 z" fill="none" stroke="url(#${u}rgli)" stroke-width="3" stroke-linejoin="round"/>
        <path d="M188 92 l 0 14" stroke="url(#${u}rgli)" stroke-width="3" stroke-linecap="round"/>
        <circle cx="188" cy="110" r="2.2" fill="${p.destaque.claro}"/>
        <path d="M172 72 l -6 -2 M204 72 l 6 -2" stroke="${alfa(p.destaque.claro, 0.6)}" stroke-width="2" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="4s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'ace_runa_orbital',
    categoria: 'acessorio',
    slot: 'flutuante',
    nome: 'Anel Orbital',
    descricao: 'Satélites pessoais em rota de brainstorm.',
    raridade: 'epico',
    tema: 'tecnologia',
    lore: 'Três núcleos de dados orbitando em sincronia perfeita. O backup do backup tem backup.',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}rorb" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.8)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.5)}"/>
        </linearGradient>
      </defs>
      <g>
        <ellipse cx="120" cy="118" rx="78" ry="20" fill="none" stroke="url(#${u}rorb)" stroke-width="2.4"/>
        <circle cx="44" cy="122" r="5" fill="${p.destaque.base}"/>
        <circle cx="196" cy="112" r="4" fill="${p.destaque.claro}"/>
        <circle cx="132" cy="137" r="3.2" fill="${p.destaque.escuro}"/>
        <circle cx="44" cy="120" r="1.6" fill="#ffffff" opacity="0.8"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="5.4s" repeatCount="indefinite"/>
      </g>`,
  },
];
