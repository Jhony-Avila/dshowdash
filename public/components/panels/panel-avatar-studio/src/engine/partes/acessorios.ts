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
];
