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
    id: 'fun_led_wall',
    categoria: 'fundo',
    nome: 'LED Wall Dshow',
    descricao: 'O painel de LED da casa, vivo atrás de você.',
    raridade: 'incomum',
    tema: 'dshow',
    usaCores: ['destaque'],
    render: (p, u) => {
      let celulas = '';
      for (let lin = 0; lin < 10; lin++) {
        for (let col = 0; col < 10; col++) {
          const acesa = (lin * 7 + col * 11) % 13 < 3;
          if (!acesa) continue;
          const dur = (2 + ((lin + col) % 4) * 0.6).toFixed(1);
          celulas += `<rect x="${col * 24 + 3}" y="${lin * 24 + 3}" width="18" height="18" rx="3" fill="${alfa(p.destaque.base, 0.5)}">
            <animate attributeName="opacity" values="0.5;0.12;0.5" dur="${dur}s" begin="${((lin * 3 + col) % 10) / 5}s" repeatCount="indefinite"/>
          </rect>`;
        }
      }
      return `
      <defs>
        <linearGradient id="${u}lw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0b0e18"/>
          <stop offset="1" stop-color="#131829"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}lw)"/>
      <g stroke="${alfa('#ffffff', 0.05)}" stroke-width="1">
        ${Array.from({ length: 9 }, (_, i) => `<line x1="${(i + 1) * 24}" y1="0" x2="${(i + 1) * 24}" y2="240"/><line x1="0" y1="${(i + 1) * 24}" x2="240" y2="${(i + 1) * 24}"/>`).join('')}
      </g>
      ${celulas}`;
    },
  },
  {
    id: 'fun_lab',
    categoria: 'fundo',
    nome: 'Laboratório de IA',
    descricao: 'Racks, vidro e o zumbido de mil inferências por segundo.',
    raridade: 'raro',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}lab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0e1322"/>
          <stop offset="1" stop-color="#151b2e"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}lab)"/>
      <rect x="18" y="40" width="42" height="150" rx="5" fill="#171d30" stroke="${alfa('#ffffff', 0.08)}"/>
      <rect x="180" y="40" width="42" height="150" rx="5" fill="#171d30" stroke="${alfa('#ffffff', 0.08)}"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `
        <rect x="24" y="${50 + i * 23}" width="30" height="4" rx="2" fill="${alfa(p.destaque.base, 0.7)}">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="${(1.4 + i * 0.3).toFixed(1)}s" repeatCount="indefinite"/>
        </rect>
        <rect x="186" y="${50 + i * 23}" width="30" height="4" rx="2" fill="${alfa('#4cd97c', 0.6)}">
          <animate attributeName="opacity" values="0.6;0.15;0.6" dur="${(1.7 + i * 0.25).toFixed(1)}s" begin="0.4s" repeatCount="indefinite"/>
        </rect>`).join('')}
      <rect x="70" y="90" width="100" height="70" rx="6" fill="${alfa('#0a0d15', 0.8)}" stroke="${alfa(p.destaque.base, 0.35)}"/>
      <path d="M80 140 l 16 -18 l 14 8 l 18 -26 l 14 12 l 18 -20" stroke="${p.destaque.base}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <rect x="0" y="196" width="240" height="44" fill="#0a0d16"/>
      <line x1="0" y1="196" x2="240" y2="196" stroke="${alfa(p.destaque.base, 0.25)}" stroke-width="1.6"/>`,
  },
  {
    id: 'fun_dojo',
    categoria: 'fundo',
    nome: 'Dojo ao Entardecer',
    descricao: 'Shoji, montanhas e o silêncio antes do treino.',
    raridade: 'epico',
    tema: 'oriental',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}dj" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${misturar('#2a1530', p.destaque.base, 0.18)}"/>
          <stop offset="0.55" stop-color="#4a1e33"/>
          <stop offset="0.56" stop-color="#1a0f16"/>
          <stop offset="1" stop-color="#120a10"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}dj)"/>
      <circle cx="168" cy="66" r="30" fill="#ff8a5c" opacity="0.9"/>
      <path d="M0 132 l 44 -36 l 38 30 l 30 -22 l 46 30 l 42 -26 l 40 26 v 30 h -240 z" fill="#241019"/>
      <g stroke="#0c0710" stroke-width="5">
        <line x1="30" y1="132" x2="30" y2="240"/>
        <line x1="210" y1="132" x2="210" y2="240"/>
      </g>
      <rect x="30" y="132" width="180" height="6" fill="#0c0710"/>
      <g fill="${alfa('#ffd9b8', 0.14)}" stroke="#0c0710" stroke-width="2">
        ${[0, 1, 2, 3].map((i) => `<rect x="${44 + i * 40}" y="146" width="30" height="72"/>`).join('')}
      </g>
      <path d="M60 240 q 60 -14 120 0 z" fill="#0c0710"/>`,
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
  // ── 4.6 F2 · Onda 2 (aparência) — 9 fundos novos ──────────────────
  {
    id: 'fun_synthwave',
    categoria: 'fundo',
    nome: 'Pôr do Sol Synthwave',
    descricao: 'O sol riscado que nunca termina de se pôr.',
    raridade: 'raro',
    tema: 'espaço',
    usaCores: ['destaque'],
    render: (p, u) => {
      let grade = '';
      for (let i = 0; i < 7; i++) {
        grade += `<line x1="${-60 + i * 60}" y1="240" x2="${60 + i * 30}" y2="152" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="1.4"/>`;
      }
      for (let j = 0; j < 5; j++) {
        grade += `<line x1="0" y1="${156 + j * j * 5}" x2="240" y2="${156 + j * j * 5}" stroke="${alfa(p.destaque.base, 0.45)}" stroke-width="1.2"/>`;
      }
      return `
      <defs>
        <linearGradient id="${u}sw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#160b2e"/>
          <stop offset="0.65" stop-color="${misturar('#2b0f45', p.destaque.base, 0.25)}"/>
          <stop offset="1" stop-color="#0c0716"/>
        </linearGradient>
        <linearGradient id="${u}sol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffd36e"/>
          <stop offset="1" stop-color="#ff5f8f"/>
        </linearGradient>
        <clipPath id="${u}solc"><path d="M64 152 h 112 v -80 h -112 z M64 158 h 112 v 4 h -112 z"/></clipPath>
      </defs>
      <rect width="240" height="240" fill="url(#${u}sw)"/>
      <circle cx="120" cy="140" r="46" fill="url(#${u}sol)" clip-path="url(#${u}solc)"/>
      <rect y="152" width="240" height="88" fill="#0c0716"/>
      ${grade}
      ${estrelas(18, '#ffd0e8', 5)}`;
    },
  },
  {
    id: 'fun_biblioteca',
    categoria: 'fundo',
    nome: 'Biblioteca',
    descricao: 'Estantes altas e silêncio produtivo.',
    raridade: 'incomum',
    tema: 'clássico',
    usaCores: ['destaque'],
    render: (p, u) => {
      let livros = '';
      const cores = ['#7a4a32', '#3e5a4a', p.destaque.base, '#8a6a3a', '#4a4a6a'];
      for (let pr = 0; pr < 3; pr++) {
        const y = 46 + pr * 58;
        for (let i = 0; i < 12; i++) {
          const x = 12 + i * 19;
          const alt2 = 30 + ((i * 7 + pr * 5) % 12);
          livros += `<rect x="${x}" y="${y + 42 - alt2}" width="13" height="${alt2}" rx="2" fill="${cores[(i + pr) % 5]}" opacity="0.85"/>`;
        }
        livros += `<rect x="4" y="${y + 44}" width="232" height="6" fill="#2b2118"/>`;
      }
      return `
      <defs>
        <linearGradient id="${u}bib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#241a12"/>
          <stop offset="1" stop-color="#120d08"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}bib)"/>
      ${livros}
      <rect width="240" height="240" fill="${alfa('#000000', 0.25)}"/>
      <ellipse cx="120" cy="120" rx="120" ry="110" fill="${alfa(misturar('#f9d9a0', p.destaque.base, 0.2), 0.09)}"/>`;
    },
  },
  {
    id: 'fun_chuva',
    categoria: 'fundo',
    nome: 'Noite Chuvosa',
    descricao: 'Vidro molhado e a cidade desfocada lá fora.',
    raridade: 'raro',
    tema: 'urbano',
    usaCores: ['destaque'],
    render: (p, u) => {
      let gotas = '';
      for (let i = 0; i < 16; i++) {
        const x = ((i * 61) % 232) + 4;
        const y = ((i * 37) % 200) + 8;
        gotas += `<line x1="${x}" y1="${y}" x2="${x - 3}" y2="${y + 14}" stroke="${alfa('#9fc4ff', 0.4)}" stroke-width="1.6" stroke-linecap="round">
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="${(1.4 + (i % 5) * 0.3).toFixed(1)}s" repeatCount="indefinite"/>
        </line>`;
      }
      let bokeh = '';
      for (let i = 0; i < 8; i++) {
        const x = ((i * 89) % 220) + 10;
        const y = 60 + ((i * 53) % 120);
        bokeh += `<circle cx="${x}" cy="${y}" r="${6 + (i % 4) * 3}" fill="${alfa(i % 2 ? p.destaque.base : '#ffb054', 0.18)}"/>`;
      }
      return `
      <defs>
        <linearGradient id="${u}chn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0b101e"/>
          <stop offset="1" stop-color="#141b30"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}chn)"/>
      ${bokeh}${gotas}`;
    },
  },
  {
    id: 'fun_praia',
    categoria: 'fundo',
    nome: 'Praia Pixel',
    descricao: 'Férias em 16 bits — protetor solar incluso.',
    raridade: 'incomum',
    tema: 'casual',
    render: () => `
      <rect width="240" height="150" fill="#7ec8ff"/>
      <rect y="110" width="240" height="16" fill="#5db2f0"/>
      <rect y="126" width="240" height="42" fill="#2a7fd4"/>
      <rect y="150" width="240" height="10" fill="#7fd4e8"/>
      <rect y="168" width="240" height="72" fill="#f2dca2"/>
      <rect y="164" width="240" height="6" fill="#fff2c8"/>
      <rect x="176" y="24" width="28" height="28" fill="#ffd75e"/>
      <rect x="184" y="16" width="12" height="8" fill="#ffd75e"/>
      <rect x="184" y="52" width="12" height="8" fill="#ffd75e"/>
      <rect x="168" y="32" width="8" height="12" fill="#ffd75e"/>
      <rect x="204" y="32" width="8" height="12" fill="#ffd75e"/>
      <rect x="24" y="60" width="40" height="10" fill="#ffffff" opacity="0.9"/>
      <rect x="34" y="52" width="24" height="8" fill="#ffffff" opacity="0.9"/>
      <rect x="90" y="84" width="34" height="8" fill="#ffffff" opacity="0.7"/>`,
  },
  {
    id: 'fun_montanhas',
    categoria: 'fundo',
    nome: 'Montanhas',
    descricao: 'Ar puro e sinal de wi-fi surpreendentemente bom.',
    raridade: 'comum',
    tema: 'aventura',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}ceu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${misturar('#8fb7e8', p.destaque.base, 0.15)}"/>
          <stop offset="1" stop-color="#dcebf7"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}ceu)"/>
      <path d="M0 190 l 55 -90 l 40 62 l 35 -52 l 50 80 l 60 -70 v 120 h -240 z" fill="#3c556e"/>
      <path d="M55 100 l 14 24 l -10 2 l -8 -12 z" fill="#eef4fa"/>
      <path d="M130 110 l 12 20 l -9 1 l -7 -10 z" fill="#eef4fa"/>
      <path d="M0 210 l 60 -60 l 60 55 l 55 -45 l 65 50 v 30 h -240 z" fill="#22374c"/>
      <ellipse cx="60" cy="52" rx="26" ry="9" fill="#ffffff" opacity="0.85"/>
      <ellipse cx="170" cy="38" rx="20" ry="7" fill="#ffffff" opacity="0.7"/>`,
  },
  {
    id: 'fun_escritorio',
    categoria: 'fundo',
    nome: 'Escritório Noturno',
    descricao: 'A cidade acesa atrás da última entrega do dia.',
    raridade: 'comum',
    tema: 'executivo',
    usaCores: ['destaque'],
    render: (p, u) => {
      let janelas = '';
      for (let i = 0; i < 30; i++) {
        const x = 20 + (i % 6) * 34;
        const y = 40 + Math.floor(i / 6) * 26;
        const acesa = (i * 13) % 7 < 3;
        janelas += `<rect x="${x}" y="${y}" width="18" height="14" rx="1.5" fill="${acesa ? alfa('#ffd75e', 0.7) : alfa('#28324a', 0.9)}"/>`;
      }
      return `
      <defs>
        <linearGradient id="${u}esc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0d1322"/>
          <stop offset="1" stop-color="${misturar('#1a2338', p.destaque.base, 0.12)}"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}esc)"/>
      <rect x="10" y="30" width="220" height="140" rx="6" fill="#131b2e" stroke="#232d47" stroke-width="3"/>
      ${janelas}
      <rect y="176" width="240" height="64" fill="#181f31"/>
      <rect x="0" y="172" width="240" height="6" fill="#2b3550"/>`;
    },
  },
  {
    id: 'fun_codigo',
    categoria: 'fundo',
    nome: 'Cascata de Código',
    descricao: 'As colunas verdes que explicam tudo.',
    raridade: 'epico',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p, u) => {
      let colunas = '';
      for (let i = 0; i < 12; i++) {
        const x = 8 + i * 20;
        const alt2 = 60 + ((i * 37) % 120);
        colunas += `<rect x="${x}" y="0" width="3" height="${alt2}" fill="url(#${u}cod)" opacity="${(0.3 + (i % 5) * 0.12).toFixed(2)}">
          <animate attributeName="height" values="${alt2};${alt2 + 60};${alt2}" dur="${(2 + (i % 4) * 0.6).toFixed(1)}s" repeatCount="indefinite"/>
        </rect>`;
      }
      return `
      <defs>
        <linearGradient id="${u}cod" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.base, 0)}"/>
          <stop offset="0.7" stop-color="${p.destaque.base}"/>
          <stop offset="1" stop-color="#ffffff"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="#050a08"/>
      ${colunas}
      <rect width="240" height="240" fill="${alfa('#000000', 0.15)}"/>`;
    },
  },
  {
    id: 'fun_forja',
    categoria: 'fundo',
    nome: 'Forja Vulcânica',
    descricao: 'Onde os itens lendários são temperados.',
    raridade: 'lendario',
    tema: 'fantasia',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}for" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1a0d08"/>
          <stop offset="0.7" stop-color="#3a140a"/>
          <stop offset="1" stop-color="#7a2408"/>
        </linearGradient>
        <linearGradient id="${u}lava" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffb54d"/>
          <stop offset="1" stop-color="#ff5230"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}for)"/>
      <path d="M0 150 l 50 -70 l 45 55 l 50 -65 l 55 70 l 40 -40 v 140 h -240 z" fill="#12080a"/>
      <path d="M0 208 q 60 -14 120 0 t 120 0 v 32 h -240 z" fill="url(#${u}lava)">
        <animate attributeName="opacity" values="1;0.8;1" dur="3s" repeatCount="indefinite"/>
      </path>
      <circle cx="60" cy="190" r="2.4" fill="#ffb54d"><animate attributeName="cy" values="190;168;190" dur="2.8s" repeatCount="indefinite"/></circle>
      <circle cx="150" cy="196" r="1.8" fill="#ff8a4d"><animate attributeName="cy" values="196;172;196" dur="3.4s" repeatCount="indefinite"/></circle>
      <circle cx="196" cy="192" r="2.2" fill="#ffd75e"><animate attributeName="cy" values="192;170;192" dur="2.4s" repeatCount="indefinite"/></circle>`,
  },
  {
    id: 'fun_hangar',
    categoria: 'fundo',
    nome: 'Hangar Nexus',
    descricao: 'A baia de lançamento da frota Dshow.',
    raridade: 'epico',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}han" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0e1420"/>
          <stop offset="1" stop-color="#1c2536"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}han)"/>
      <path d="M20 0 v 168 M220 0 v 168 M60 0 v 168 M180 0 v 168" stroke="#28324a" stroke-width="6"/>
      <path d="M0 30 h 240 M0 90 h 240" stroke="#28324a" stroke-width="4"/>
      <path d="M0 168 h 240 v 8 h -240 z" fill="#2b3550"/>
      <path d="M0 176 l 240 34 v 30 h -240 z" fill="#161d2c"/>
      <path d="M30 176 l 30 40 M105 182 l 18 34 M180 190 l 8 28" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="2"/>
      <circle cx="40" cy="60" r="5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="200" cy="60" r="5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
      <rect x="84" y="44" width="72" height="32" rx="4" fill="${alfa(p.destaque.base, 0.16)}" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="1.6"/>
      <path d="M92 52 h 40 M92 60 h 28 M92 68 h 34" stroke="${alfa(p.destaque.claro, 0.6)}" stroke-width="2"/>`,
  },
];
