// engine/partes/premium/acessorios.ts — onda 1416 (MEGA_BRIEFING_01 P10-E,
// P6-A; decisões #166/#196): ACESSÓRIOS PREMIUM — 10 `ace_px_*` novos.
// Arte NOVA (partes/* intocadas), tokens de material, zero filtros (§2510).
//
// Itens de COSTAS (mochila/asas) e a parte de trás da coroa usam
// `renderAtras` (SÓ no modo premium — atrás da figura inteira §2414);
// o `render` desenha a parte da frente (alças, aro frontal). Pets/drones
// têm MOTION SMIL determinístico (congelarSvg remove nas thumbs).
// Props (cetro) encaixam na MÃO no corpo inteiro via `renderCorpo`.
// @version 1.0.0  @created 2026-08-21
import { alfa, tintaPremium } from '../../cores';
import { material2d } from '../../materiais2d';
import type { ParteDef } from '../../base-api';

const OURO = tintaPremium('#c9a75a');

export const ACESSORIOS_PREMIUM: ParteDef[] = [
  {
    id: 'ace_px_oculos', categoria: 'acessorio', slot: 'rosto', materialToken: 'glass',
    nome: 'Óculos Premium', descricao: 'Lente com gradiente real e highlight de vidro.',
    raridade: 'incomum', tema: 'executivo', usaCores: ['destaque'], acabamento: 'premium',
    render: (p, u) => `
      <defs><linearGradient id="${u}pxol" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="${alfa('#bfe3ff', 0.55)}"/><stop offset="0.5" stop-color="${alfa('#6b87b8', 0.35)}"/><stop offset="1" stop-color="${alfa('#20304e', 0.45)}"/>
      </linearGradient></defs>
      <rect x="86" y="99" width="28" height="19" rx="8" fill="url(#${u}pxol)" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <rect x="126" y="99" width="28" height="19" rx="8" fill="url(#${u}pxol)" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <path d="M114 106 h 12 M86 104 l -12 -3 M154 104 l 12 -3" stroke="${p.destaque.base}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M91 103 l 7 -2 M131 103 l 7 -2" stroke="${alfa('#ffffff', 0.75)}" stroke-width="1.8" stroke-linecap="round"/>`,
  },
  {
    id: 'ace_px_coroa', categoria: 'acessorio', slot: 'cabeca', materialToken: 'metal',
    nome: 'Coroa Premium', descricao: 'Aro completo: frente em ouro vivo, arco de trás atrás do cabelo.',
    raridade: 'raro', tema: 'fantasia', usaCores: ['destaque'], acabamento: 'premium',
    render: (p, u) => {
      const m = material2d('metal', '#c9a75a');
      return `<defs>${m.defs(u)}</defs>
      <path d="M84 56 l 8 -18 l 10 12 l 10 -16 l 8 14 l 8 -14 l 10 16 l 10 -12 l 8 18 q -36 12 -72 0 z" fill="${m.fill(u)}"/>
      <path d="M84 56 q 36 12 72 0 l 0 8 q -36 12 -72 0 z" fill="${OURO.escuro}"/>
      <circle cx="120" cy="42" r="3" fill="${p.destaque.base}"/><circle cx="98" cy="52" r="2" fill="${p.destaque.claro}"/><circle cx="142" cy="52" r="2" fill="${p.destaque.claro}"/>
      <path d="M88 54 l 6 -12" stroke="${alfa('#ffffff', 0.5)}" stroke-width="1.6" stroke-linecap="round"/>`;
    },
    renderAtras: () => `
      <path d="M86 58 a 40 16 0 0 1 68 0 l 0 6 a 40 16 0 0 0 -68 0 z" fill="${OURO.profundo}"/>
      <path d="M92 54 a 34 12 0 0 1 56 0" stroke="${alfa(OURO.claro, 0.5)}" stroke-width="1.6" fill="none"/>`,
  },
  {
    id: 'ace_px_colar', categoria: 'acessorio', slot: 'pescoco', materialToken: 'metal',
    nome: 'Colar Premium', descricao: 'Elos com peso e pingente lapidado.',
    raridade: 'incomum', tema: 'clássico', usaCores: ['destaque'], acabamento: 'premium',
    render: (p, u) => {
      const m = material2d('metal', p.destaque.base);
      return `<defs>${m.defs(u)}</defs>
      <path d="M100 192 q 20 18 40 0" stroke="${m.fill(u)}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M101 194 q 19 15 38 0" stroke="${alfa('#ffffff', 0.3)}" stroke-width="1.4" fill="none"/>
      <path d="M120 206 l -6 8 l 6 10 l 6 -10 z" fill="${m.fill(u)}"/>
      <path d="M120 208 l -3.6 6 l 3.6 6" stroke="${alfa('#ffffff', 0.5)}" stroke-width="1.2" fill="none"/>`;
    },
  },
  {
    id: 'ace_px_mochila', categoria: 'acessorio', slot: 'costas', materialToken: 'technical',
    nome: 'Mochila Premium', descricao: 'Corpo técnico atrás da figura, alças reais na frente.',
    raridade: 'incomum', tema: 'urbano', usaCores: ['roupa', 'destaque'], acabamento: 'premium',
    render: (p) => `
      <path d="M96 188 q -3 26 2 46 l 9 2 q -4 -24 -1 -44 z M144 188 q 3 26 -2 46 l -9 2 q 4 -24 1 -44 z" fill="${p.roupa.escuro}"/>
      <path d="M98 192 q -2 20 2 38 M142 192 q 2 20 -2 38" stroke="${p.destaque.base}" stroke-width="1.6" fill="none"/>
      <rect x="101" y="206" width="7" height="9" rx="1.6" fill="${p.destaque.escuro}"/><rect x="132" y="206" width="7" height="9" rx="1.6" fill="${p.destaque.escuro}"/>`,
    renderAtras: (p, u) => {
      const tec = material2d('technical', p.roupa.base);
      return `<defs>${tec.defs(u)}</defs>
      <rect x="76" y="176" width="88" height="64" rx="18" fill="${tec.fill(u)}"/>
      <rect x="86" y="188" width="68" height="20" rx="8" fill="${alfa(tec.tinta.profundo, 0.6)}"/>
      <path d="M86 224 h 68" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <path d="M82 184 q -2 26 4 48" stroke="${alfa(tec.tinta.brilho, 0.4)}" stroke-width="1.8" fill="none"/>`;
    },
  },
  {
    id: 'ace_px_asas', categoria: 'acessorio', slot: 'costas', materialToken: 'emissive',
    nome: 'Asas Premium', descricao: 'Envergadura de energia em camadas atrás da figura.',
    raridade: 'epico', tema: 'fantasia', usaCores: ['destaque'], acabamento: 'premium',
    lore: 'Duas lâminas de luz que respondem à postura de quem as veste.',
    render: (p) => `
      <path d="M104 190 q -3 8 0 16 M136 190 q 3 8 0 16" stroke="${p.destaque.base}" stroke-width="3" stroke-linecap="round" fill="none"/>`,
    renderAtras: (p, u) => `
      <defs><linearGradient id="${u}pxasa" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.85)}"/><stop offset="1" stop-color="${alfa(p.destaque.escuro, 0.25)}"/>
      </linearGradient></defs>
      <g>
        <path d="M100 188 Q 40 150 22 96 Q 66 116 92 150 Q 76 116 68 78 Q 96 112 104 156 z" fill="url(#${u}pxasa)"/>
        <path d="M140 188 Q 200 150 218 96 Q 174 116 148 150 Q 164 116 172 78 Q 144 112 136 156 z" fill="url(#${u}pxasa)"/>
        <path d="M96 168 Q 60 140 44 108 M144 168 Q 180 140 196 108" stroke="${alfa('#ffffff', 0.35)}" stroke-width="1.6" fill="none"/>
        <animateTransform attributeName="transform" type="scale" additive="sum" values="1 1;1.015 0.99;1 1" dur="3.6s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'ace_px_brinco', categoria: 'acessorio', slot: 'orelha', materialToken: 'metal',
    nome: 'Brinco Premium', descricao: 'Argola dupla com gota de luz.',
    raridade: 'comum', tema: 'clássico', usaCores: ['destaque'], acabamento: 'premium',
    render: (p) => `
      <circle cx="164" cy="124" r="5" fill="none" stroke="${OURO.base}" stroke-width="2"/>
      <circle cx="164" cy="131" r="2.6" fill="${p.destaque.base}"/>
      <path d="M161 121 a 5 5 0 0 1 4 -2" stroke="${alfa('#ffffff', 0.65)}" stroke-width="1.2" fill="none"/>`,
  },
  {
    id: 'ace_px_relogio', categoria: 'acessorio', slot: 'pulso_e', materialToken: 'metal',
    nome: 'Relógio Premium', descricao: 'Caixa polida com mostrador vivo no pulso.',
    raridade: 'incomum', tema: 'executivo', usaCores: ['destaque'], acabamento: 'premium',
    render: () => '',
    renderCorpo: (p, u) => {
      const m = material2d('metal', '#b8bcc8');
      return `<defs>${m.defs(u)}</defs>
      <path d="M62 180 h 20 v 9 h -20 z" fill="${p.destaque.escuro}"/>
      <circle cx="72" cy="184.5" r="8.5" fill="${m.fill(u)}" stroke="${p.destaque.base}" stroke-width="2"/>
      <circle cx="72" cy="184.5" r="5.4" fill="#141824"/>
      <path d="M72 184.5 l 0 -3.6 M72 184.5 l 2.6 1.6" stroke="${p.destaque.claro}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M66 180 a 8 8 0 0 1 5 -3" stroke="${alfa('#ffffff', 0.5)}" stroke-width="1.2" fill="none"/>`;
    },
  },
  {
    id: 'ace_px_cetro', categoria: 'acessorio', slot: 'mao_d', materialToken: 'metal',
    nome: 'Cetro Premium', descricao: 'Prop que encaixa na mão: haste de ouro e núcleo vivo.',
    raridade: 'raro', tema: 'fantasia', usaCores: ['destaque'], acabamento: 'premium',
    render: () => '',
    renderCorpo: (p, u) => {
      const m = material2d('metal', '#c9a75a');
      return `<defs>${m.defs(u)}</defs>
      <path d="M166 186 l 16 -64" stroke="${m.fill(u)}" stroke-width="5" stroke-linecap="round"/>
      <path d="M167 184 l 14 -58" stroke="${alfa('#ffffff', 0.3)}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="183" cy="116" r="9" fill="${p.destaque.base}"/>
      <circle cx="183" cy="116" r="9" fill="none" stroke="${OURO.claro}" stroke-width="2"/>
      <circle cx="180" cy="113" r="2.6" fill="${alfa('#ffffff', 0.7)}"/>
      <circle cx="166" cy="187" r="5.4" fill="${OURO.escuro}"/>`;
    },
  },
  {
    id: 'ace_px_drone', categoria: 'acessorio', slot: 'flutuante', materialToken: 'technical',
    nome: 'Drone Premium', descricao: 'Companheiro voador com bobbing real e olho vivo.',
    raridade: 'raro', tema: 'gamer', usaCores: ['destaque'], acabamento: 'premium',
    render: (p, u) => {
      const tec = material2d('technical', '#3a4150');
      return `<defs>${tec.defs(u)}</defs>
      <g>
        <ellipse cx="196" cy="66" rx="16" ry="11" fill="${tec.fill(u)}"/>
        <circle cx="196" cy="66" r="5" fill="${p.destaque.base}">
          <animate attributeName="r" values="5;3.6;5" dur="2.8s" repeatCount="indefinite"/>
        </circle>
        <path d="M182 60 l -6 -4 M210 60 l 6 -4" stroke="${tec.tinta.claro}" stroke-width="2" stroke-linecap="round"/>
        <path d="M186 74 q 10 4 20 0" stroke="${alfa(p.destaque.base, 0.6)}" stroke-width="1.6" fill="none"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="3.2s" repeatCount="indefinite"/>
      </g>`;
    },
  },
  {
    id: 'ace_px_gato', categoria: 'acessorio', slot: 'companheiro', materialToken: 'wool',
    nome: 'Gato Premium', descricao: 'Companheiro de pelo denso com cauda que balança.',
    raridade: 'raro', tema: 'casual', usaCores: ['destaque'], acabamento: 'premium',
    render: (p, u) => {
      const t = tintaPremium('#2c2f3a');
      return `
      <defs><linearGradient id="${u}pxgat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${t.claro}"/><stop offset="1" stop-color="${t.profundo}"/>
      </linearGradient></defs>
      <g>
        <ellipse cx="42" cy="216" rx="17" ry="13" fill="url(#${u}pxgat)"/>
        <circle cx="42" cy="196" r="10" fill="url(#${u}pxgat)"/>
        <path d="M35 189 l -3 -8 l 7 4 z M49 189 l 3 -8 l -7 4 z" fill="${t.base}"/>
        <circle cx="38.5" cy="195" r="1.6" fill="${p.destaque.base}"/><circle cx="45.5" cy="195" r="1.6" fill="${p.destaque.base}"/>
        <path d="M40 200 q 2 1.6 4 0" stroke="${t.claro}" stroke-width="1" fill="none" stroke-linecap="round"/>
        <path d="M57 214 q 12 -6 10 -18" stroke="${t.base}" stroke-width="4" fill="none" stroke-linecap="round">
          <animate attributeName="d" values="M57 214 q 12 -6 10 -18;M57 214 q 14 -2 14 -14;M57 214 q 12 -6 10 -18" dur="4.2s" repeatCount="indefinite"/>
        </path>
        <path d="M30 210 q 10 -4 22 -1" stroke="${alfa('#ffffff', 0.14)}" stroke-width="1.6" fill="none"/>
      </g>`;
    },
  },
];
