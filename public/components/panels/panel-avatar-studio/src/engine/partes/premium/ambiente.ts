// engine/partes/premium/ambiente.ts — onda 1417 (MEGA_BRIEFING_01 P10-F,
// P9-A, P9-B 2D, P9-E; decisões #166/#199–#200): AMBIENTE PREMIUM —
// 6 fundos `fun_px_*` (BG01–BG06) em PLANOS de profundidade, 4 auras
// `aur_px_*` (rear glow + main + partículas na frente) e 4 molduras
// `mol_px_*` (borda viva, centro SEMPRE livre — teste de área coberta).
//
// Planos (#200): o `render` do fundo desenha far → mid → floor com
// marcadores `data-plano` (o shell aplica parallax/blur por CSS —
// apresentação; o SVG salvo é estático); `renderPlanos.frente` desenha a
// ATMOSFERA na frente da figura (SÓ opcoes.premium, §2427). Auras:
// `renderAtras` = rear glow, `render` = massa principal (com `data-nucleo`
// p/ o param §71), `renderFrente` = partículas na frente. Zero filtros.
// @version 1.0.0  @created 2026-08-21
import { alfa, tintaPremium } from '../../cores';
import type { Paleta } from '../../cores';
import type { ParteDef } from '../../base-api';

const sec = (p: Paleta) => tintaPremium(p.secundario?.base ?? p.destaque.escuro);

// ── 6 FUNDOS PREMIUM (BG01–BG06) — planos de profundidade ───────────────

function fundoPlanos(far: string, mid: string, floor: string): string {
  return `<g data-plano="far">${far}</g><g data-plano="mid">${mid}</g><g data-plano="floor">${floor}</g>`;
}

const comumFun = {
  categoria: 'fundo' as const, raridade: 'raro' as const,
  acabamento: 'premium' as const, usaCores: ['destaque' as const, 'secundario' as const],
};

export const FUNDOS_PREMIUM: ParteDef[] = [
  {
    ...comumFun, id: 'fun_px_estudio', nome: 'Estúdio Premium', tema: 'executivo',
    descricao: 'BG01 — ciclorama com luz de recorte e piso refletivo.',
    render: (p, u) => {
      const t = tintaPremium('#232836');
      return `<defs>
        <linearGradient id="${u}pxbg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${t.claro}"/><stop offset="0.62" stop-color="${t.base}"/><stop offset="1" stop-color="${t.profundo}"/>
        </linearGradient>
        <radialGradient id="${u}pxbg1k" cx="0.3" cy="0.2" r="0.9">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.22)}"/><stop offset="1" stop-color="${alfa(p.destaque.claro, 0)}"/>
        </radialGradient></defs>
      ${fundoPlanos(
    `<rect width="240" height="240" fill="url(#${u}pxbg1)"/><rect width="240" height="240" fill="url(#${u}pxbg1k)"/>`,
    `<path d="M0 178 q 120 -22 240 0 v 62 h -240 z" fill="${alfa(t.profundo, 0.8)}"/>`,
    `<ellipse cx="120" cy="228" rx="150" ry="26" fill="${alfa('#0b0e1a', 0.5)}"/><ellipse cx="120" cy="224" rx="96" ry="14" fill="${alfa(p.destaque.base, 0.06)}"/>`)}`;
    },
    renderPlanos: {
      frente: (p) => `<g data-plano="fg">
        <ellipse cx="30" cy="234" rx="60" ry="10" fill="${alfa('#0b0e1a', 0.35)}"/>
        <ellipse cx="214" cy="236" rx="52" ry="9" fill="${alfa('#0b0e1a', 0.3)}"/>
        <path d="M0 214 q 120 -14 240 0" stroke="${alfa(p.destaque.claro, 0.1)}" stroke-width="1.4" fill="none"/>
      </g>`,
    },
  },
  {
    ...comumFun, id: 'fun_px_metropole', nome: 'Metrópole Premium', tema: 'urbano',
    descricao: 'BG02 — skyline em três profundidades com janelas acesas.',
    render: (p, u) => {
      const t = tintaPremium('#1a2030');
      const s = sec(p);
      return `<defs><linearGradient id="${u}pxbg2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${s.claro}"/><stop offset="0.55" stop-color="${t.base}"/><stop offset="1" stop-color="${t.profundo}"/>
      </linearGradient></defs>
      ${fundoPlanos(
    `<rect width="240" height="240" fill="url(#${u}pxbg2)"/><circle cx="184" cy="52" r="20" fill="${alfa('#f5efdf', 0.5)}"/>`,
    `<path d="M0 150 h 26 v -46 h 20 v 24 h 24 v -58 h 22 v 40 h 26 v -30 h 22 v 52 h 24 v -34 h 20 v 30 h 28 v -20 h 28 v 82 h -240 z" fill="${alfa(t.escuro, 0.9)}"/>
     <g fill="${alfa(p.destaque.base, 0.5)}"><rect x="30" y="112" width="4" height="5"/><rect x="76" y="76" width="4" height="5"/><rect x="118" y="128" width="4" height="5"/><rect x="164" y="120" width="4" height="5"/><rect x="206" y="146" width="4" height="5"/></g>`,
    `<rect y="196" width="240" height="44" fill="${t.profundo}"/><path d="M0 200 h 240" stroke="${alfa(p.destaque.base, 0.2)}" stroke-width="1.4"/>`)}`;
    },
    renderPlanos: {
      frente: (_p) => `<g data-plano="fg">
        <path d="M-4 238 l 40 -10 l 44 12 z" fill="${alfa('#0b0e1a', 0.5)}"/>
        <path d="M244 238 l -44 -9 l -40 11 z" fill="${alfa('#0b0e1a', 0.45)}"/>
      </g>`,
    },
  },
  {
    ...comumFun, id: 'fun_px_horizonte', nome: 'Horizonte Premium', tema: 'clássico',
    descricao: 'BG03 — pôr do sol em camadas com colinas e névoa.',
    render: (p, u) => {
      const s = sec(p);
      return `<defs><linearGradient id="${u}pxbg3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2c2440"/><stop offset="0.5" stop-color="#7a3d52"/><stop offset="0.78" stop-color="#c9744c"/><stop offset="1" stop-color="#e8b25e"/>
      </linearGradient></defs>
      ${fundoPlanos(
    `<rect width="240" height="240" fill="url(#${u}pxbg3)"/><circle cx="120" cy="150" r="26" fill="${alfa('#ffe9c4', 0.85)}"/>`,
    `<path d="M0 172 q 60 -26 120 -6 q 60 18 120 -8 v 82 h -240 z" fill="${alfa('#402a3c', 0.9)}"/>`,
    `<path d="M0 204 q 80 -16 240 -2 v 38 h -240 z" fill="#241826"/><path d="M0 196 q 120 -10 240 -4" stroke="${alfa(s.claro, 0.25)}" stroke-width="2" fill="none"/>`)}`;
    },
    renderPlanos: {
      frente: (_p) => `<g data-plano="fg"><path d="M0 228 q 120 -12 240 0 v 12 h -240 z" fill="${alfa('#120c16', 0.55)}"/></g>`,
    },
  },
  {
    ...comumFun, id: 'fun_px_neon', nome: 'Beco Neon Premium', tema: 'cyberpunk',
    descricao: 'BG04 — profundidade de beco com letreiros e chuva de luz.',
    render: (p, u) => {
      const t = tintaPremium('#12141f');
      return `<defs><linearGradient id="${u}pxbg4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${t.escuro}"/><stop offset="1" stop-color="${t.profundo}"/>
      </linearGradient></defs>
      ${fundoPlanos(
    `<rect width="240" height="240" fill="url(#${u}pxbg4)"/>`,
    `<path d="M8 40 v 160 M232 40 v 160" stroke="${alfa(t.claro, 0.3)}" stroke-width="3"/>
     <rect x="20" y="64" width="34" height="14" rx="3" fill="none" stroke="${p.destaque.base}" stroke-width="2"/>
     <rect x="186" y="96" width="34" height="14" rx="3" fill="none" stroke="${alfa(p.destaque.claro, 0.8)}" stroke-width="2"/>
     <path d="M24 106 h 26 M190 130 h 26" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="2"/>`,
    `<rect y="200" width="240" height="40" fill="#0b0d16"/><path d="M0 206 h 240" stroke="${alfa(p.destaque.base, 0.35)}" stroke-width="1.6"/><ellipse cx="120" cy="226" rx="80" ry="9" fill="${alfa(p.destaque.base, 0.08)}"/>`)}`;
    },
    renderPlanos: {
      frente: (p) => `<g data-plano="fg">
        <path d="M14 0 v 240 M226 6 v 234" stroke="${alfa(p.destaque.base, 0.08)}" stroke-width="6"/>
      </g>`,
    },
  },
  {
    ...comumFun, id: 'fun_px_biblioteca', nome: 'Biblioteca Premium', tema: 'clássico',
    descricao: 'BG05 — estantes ao fundo, luz de abajur e poeira no ar.',
    render: (p, u) => {
      const t = tintaPremium('#2e2418');
      const s = sec(p);
      return `<defs><linearGradient id="${u}pxbg5" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${t.claro}"/><stop offset="1" stop-color="${t.profundo}"/>
      </linearGradient></defs>
      ${fundoPlanos(
    `<rect width="240" height="240" fill="url(#${u}pxbg5)"/><radialGradient id="${u}pxbg5l" cx="0.72" cy="0.3" r="0.5"><stop offset="0" stop-color="${alfa('#ffd9a0', 0.3)}"/><stop offset="1" stop-color="${alfa('#ffd9a0', 0)}"/></radialGradient><rect width="240" height="240" fill="url(#${u}pxbg5l)"/>`,
    `<g fill="${alfa(t.escuro, 0.95)}"><rect x="10" y="46" width="70" height="150" rx="4"/><rect x="160" y="46" width="70" height="150" rx="4"/></g>
     <g stroke="${alfa(s.claro, 0.4)}" stroke-width="2"><path d="M16 76 h 58 M16 108 h 58 M16 140 h 58 M166 76 h 58 M166 108 h 58 M166 140 h 58"/></g>
     <g fill="${alfa(p.destaque.base, 0.4)}"><rect x="22" y="64" width="5" height="12"/><rect x="34" y="62" width="5" height="14"/><rect x="176" y="96" width="5" height="12"/><rect x="196" y="128" width="5" height="12"/></g>`,
    `<rect y="196" width="240" height="44" fill="#1a1208"/><path d="M0 200 h 240" stroke="${alfa('#ffd9a0', 0.18)}" stroke-width="1.4"/>`)}`;
    },
    renderPlanos: {
      frente: (_p) => `<g data-plano="fg" opacity="0.5">
        <circle cx="60" cy="80" r="1.2" fill="#ffe9c4"><animate attributeName="cy" values="80;74;80" dur="7s" repeatCount="indefinite"/></circle>
        <circle cx="180" cy="120" r="1" fill="#ffe9c4"><animate attributeName="cy" values="120;114;120" dur="9s" repeatCount="indefinite"/></circle>
        <circle cx="130" cy="60" r="0.8" fill="#ffe9c4"><animate attributeName="cy" values="60;66;60" dur="8s" repeatCount="indefinite"/></circle>
      </g>`,
    },
  },
  {
    ...comumFun, id: 'fun_px_nebulosa', nome: 'Nebulosa Premium', tema: 'espacial',
    descricao: 'BG06 — véus cósmicos em três profundidades e poeira estelar.',
    render: (p, u) => {
      const s = sec(p);
      return `<defs><radialGradient id="${u}pxbg6" cx="0.5" cy="0.42" r="0.9">
        <stop offset="0" stop-color="#241a4a"/><stop offset="0.6" stop-color="#141028"/><stop offset="1" stop-color="#0a0816"/>
      </radialGradient></defs>
      ${fundoPlanos(
    `<rect width="240" height="240" fill="url(#${u}pxbg6)"/><g fill="#e8ecff"><circle cx="36" cy="44" r="1.1"/><circle cx="204" cy="66" r="1.4"/><circle cx="88" cy="30" r="0.9"/><circle cx="168" cy="26" r="1"/><circle cx="220" cy="150" r="0.9"/><circle cx="20" cy="170" r="1.1"/></g>`,
    `<path d="M-10 96 q 70 -40 130 -6 q 62 34 130 -8 l 0 60 q -70 40 -130 8 q -62 -32 -130 6 z" fill="${alfa(p.destaque.base, 0.16)}"/>
     <path d="M-10 120 q 80 -30 250 -6" stroke="${alfa(s.claro, 0.3)}" stroke-width="2.4" fill="none"/>`,
    `<path d="M-10 190 q 90 -22 260 4 l 0 56 h -260 z" fill="${alfa('#08060f', 0.85)}"/>`)}`;
    },
    renderPlanos: {
      frente: (p) => `<g data-plano="fg" opacity="0.7">
        <circle cx="48" cy="200" r="1.4" fill="${p.destaque.claro}"><animate attributeName="opacity" values="0.9;0.3;0.9" dur="4s" repeatCount="indefinite"/></circle>
        <circle cx="198" cy="188" r="1.1" fill="${p.destaque.claro}"><animate attributeName="opacity" values="0.4;1;0.4" dur="5s" repeatCount="indefinite"/></circle>
      </g>`,
    },
  },
];

// ── 4 AURAS PREMIUM (rear glow + main + partículas na frente) ───────────

/** Massa principal com `data-nucleo` (param §71 `nucleo` regula a opacidade
 *  do miolo — aplicarParamsSvg substitui o valor marcado). */
function auraMain(cor: string, corNucleo: string, anel: string): string {
  return `<g data-nucleo="1" opacity="0.4"><ellipse cx="120" cy="120" rx="60" ry="68" fill="${alfa(corNucleo, 0.24)}"/></g>${anel}
    <ellipse cx="120" cy="120" rx="94" ry="102" fill="none" stroke="${alfa(cor, 0.26)}" stroke-width="1.5"/>`;
}

const comumAura = {
  categoria: 'aura' as const, raridade: 'epico' as const,
  acabamento: 'premium' as const, usaCores: ['destaque' as const, 'secundario' as const],
};

function glowAtras(u: string, cor: string): string {
  return `<defs><radialGradient id="${u}pxag" cx="0.5" cy="0.5" r="0.6">
    <stop offset="0" stop-color="${alfa(cor, 0.4)}"/><stop offset="1" stop-color="${alfa(cor, 0)}"/>
  </radialGradient></defs><ellipse cx="120" cy="122" rx="112" ry="118" fill="url(#${u}pxag)"/>`;
}

export const AURAS_PREMIUM: ParteDef[] = [
  {
    ...comumAura, id: 'aur_px_fluxo', nome: 'Aura de Fluxo Premium', tema: 'tecnologia',
    descricao: 'Corrente de energia com núcleo regulável e faíscas vivas.',
    lore: 'Um circuito fechado entre intenção e execução.',
    render: (p) => auraMain(p.destaque.base, sec(p).base,
      `<path d="M58 148 q 62 -64 124 0" stroke="${alfa(p.destaque.claro, 0.38)}" stroke-width="1.8" fill="none"><animate attributeName="opacity" values="0.5;0.24;0.5" dur="3.4s" repeatCount="indefinite"/></path>`),
    renderAtras: (p, u) => glowAtras(u, p.destaque.base),
    renderFrente: (p) => `<g opacity="0.85">
      <circle cx="70" cy="176" r="2" fill="${p.destaque.claro}"><animate attributeName="cy" values="176;158;176" dur="3.8s" repeatCount="indefinite"/></circle>
      <circle cx="176" cy="168" r="1.6" fill="${p.destaque.claro}"><animate attributeName="cy" values="168;150;168" dur="4.6s" repeatCount="indefinite"/></circle>
    </g>`,
  },
  {
    ...comumAura, id: 'aur_px_cristal', nome: 'Aura de Cristal Premium', tema: 'fantasia',
    descricao: 'Fragmentos lapidados orbitando com luz interna.',
    lore: 'Cada face guarda um reflexo de quem a conquistou.',
    render: (p) => auraMain(p.destaque.base, sec(p).claro,
      `<g fill="${alfa(p.destaque.claro, 0.7)}"><path d="M52 96 l 7 -12 l 7 12 l -7 12 z"/><path d="M180 84 l 6 -10 l 6 10 l -6 10 z"/><path d="M190 168 l 5 -9 l 5 9 l -5 9 z"/></g>`),
    renderAtras: (p, u) => glowAtras(u, sec(p).base),
    renderFrente: (p) => `<g opacity="0.8"><path d="M62 184 l 5 -8 l 5 8 l -5 8 z" fill="${alfa(p.destaque.claro, 0.75)}"><animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" dur="5s" repeatCount="indefinite"/></path></g>`,
  },
  {
    ...comumAura, id: 'aur_px_chama', nome: 'Aura de Chama Premium', tema: 'fantasia',
    descricao: 'Labaredas com temperatura em dois tons e brasas subindo.',
    lore: 'Não é fúria: é constância em alta temperatura.',
    render: (p) => auraMain(p.destaque.base, '#ff8a3d',
      `<path d="M60 168 q -10 -26 8 -44 q -2 20 12 28 q 2 -14 12 -20 q -2 24 10 34" stroke="${alfa('#ffb066', 0.65)}" stroke-width="2.6" fill="none"><animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.6s" repeatCount="indefinite"/></path>
       <path d="M180 168 q 10 -26 -8 -44 q 2 20 -12 28 q -2 -14 -12 -20 q 2 24 -10 34" stroke="${alfa('#ffb066', 0.55)}" stroke-width="2.4" fill="none"><animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.9s" repeatCount="indefinite"/></path>`),
    renderAtras: (_p, u) => glowAtras(u, '#ff7a3d'),
    renderFrente: () => `<g opacity="0.85">
      <circle cx="84" cy="188" r="1.8" fill="#ffb066"><animate attributeName="cy" values="188;164;188" dur="2.8s" repeatCount="indefinite"/></circle>
      <circle cx="160" cy="192" r="1.4" fill="#ff8a3d"><animate attributeName="cy" values="192;170;192" dur="3.4s" repeatCount="indefinite"/></circle>
    </g>`,
  },
  {
    ...comumAura, id: 'aur_px_estelar', nome: 'Aura Estelar Premium', tema: 'espacial',
    descricao: 'Órbitas inclinadas com poeira de estrelas na frente.',
    lore: 'Um sistema inteiro decidiu girar em volta de você.',
    render: (p) => auraMain(p.destaque.base, sec(p).base,
      `<ellipse cx="120" cy="120" rx="98" ry="34" fill="none" stroke="${alfa(p.destaque.claro, 0.5)}" stroke-width="1.6" transform="rotate(-18 120 120)"/>
       <circle cx="30" cy="104" r="3" fill="${p.destaque.claro}"><animateTransform attributeName="transform" type="rotate" values="0 120 120;360 120 120" dur="12s" repeatCount="indefinite"/></circle>`),
    renderAtras: (p, u) => glowAtras(u, p.destaque.base),
    renderFrente: (p) => `<g opacity="0.8">
      <circle cx="58" cy="196" r="1.2" fill="#e8ecff"><animate attributeName="opacity" values="1;0.3;1" dur="3.6s" repeatCount="indefinite"/></circle>
      <circle cx="186" cy="184" r="1.5" fill="${p.destaque.claro}"><animate attributeName="opacity" values="0.4;1;0.4" dur="4.4s" repeatCount="indefinite"/></circle>
    </g>`,
  },
];

// ── 4 MOLDURAS PREMIUM — borda viva, centro SEMPRE livre ────────────────

const comumMol = {
  categoria: 'moldura' as const, raridade: 'raro' as const,
  acabamento: 'premium' as const, usaCores: ['destaque' as const],
};

export const MOLDURAS_PREMIUM: ParteDef[] = [
  {
    ...comumMol, id: 'mol_px_ouro', nome: 'Moldura Ouro Premium', tema: 'clássico',
    descricao: 'Filete duplo de ouro com cantos lapidados.',
    render: (_p) => {
      const t = tintaPremium('#c9a75a');
      return `<rect x="5" y="5" width="230" height="230" rx="22" fill="none" stroke="${t.base}" stroke-width="4"/>
      <rect x="11" y="11" width="218" height="218" rx="18" fill="none" stroke="${alfa(t.claro, 0.6)}" stroke-width="1.6"/>
      <path d="M22 8 h 18 M8 22 v 18 M200 8 h 18 M232 22 v 18 M22 232 h 18 M8 200 v 18 M200 232 h 18 M232 200 v 18" stroke="${t.brilho}" stroke-width="2.4"/>`;
    },
  },
  {
    ...comumMol, id: 'mol_px_holo', nome: 'Moldura Holo Premium', tema: 'tecnologia',
    descricao: 'Aro holográfico com cantos vivos e varredura.',
    render: (p) => `<rect x="6" y="6" width="228" height="228" rx="24" fill="none" stroke="${alfa(p.destaque.base, 0.7)}" stroke-width="3" stroke-dasharray="46 18">
        <animate attributeName="stroke-dashoffset" values="0;64" dur="6s" repeatCount="indefinite"/>
      </rect>
      <path d="M20 6 h 26 M6 20 v 26 M194 6 h 26 M234 20 v 26 M20 234 h 26 M6 194 v 26 M194 234 h 26 M234 194 v 26" stroke="${p.destaque.claro}" stroke-width="3"/>`,
  },
  {
    ...comumMol, id: 'mol_px_laurel', nome: 'Moldura Laurel Premium', tema: 'clássico',
    descricao: 'Ramos de louro nas laterais, vitória silenciosa.',
    render: (p) => {
      const t = tintaPremium('#7a8a4c');
      const folhas = (x: number, dir: 1 | -1) => Array.from({ length: 6 }, (_, i) =>
        `<path d="M${x} ${196 - i * 26} q ${10 * dir} -4 ${12 * dir} -14 q ${-12 * dir} 2 -12 14 z" fill="${i % 2 ? t.base : t.claro}"/>`).join('');
      return `<rect x="6" y="6" width="228" height="228" rx="24" fill="none" stroke="${alfa(t.escuro, 0.6)}" stroke-width="2"/>
      ${folhas(16, 1)}${folhas(224, -1)}
      <circle cx="120" cy="228" r="4" fill="${p.destaque.base}"/>`;
    },
  },
  {
    ...comumMol, id: 'mol_px_eclipse', nome: 'Moldura Eclipse Premium', tema: 'espacial',
    descricao: 'Anel de eclipse com corona no topo.',
    render: (p) => `<rect x="6" y="6" width="228" height="228" rx="116" fill="none" stroke="#12141f" stroke-width="6"/>
      <rect x="6" y="6" width="228" height="228" rx="116" fill="none" stroke="${alfa(p.destaque.base, 0.7)}" stroke-width="2.4"/>
      <path d="M64 14 a 118 118 0 0 1 112 0" stroke="${alfa(p.destaque.claro, 0.85)}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  },
];
