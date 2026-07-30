// engine/partes/efeitos.ts — efeitos especiais do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// `atras: true` renderiza logo após o fundo (aura, chuva digital) — o resto
// vai por cima de tudo, desenhado nas bordas para nunca cobrir o rosto.
// Animações são SMIL nativas (autocontidas no SVG salvo/exportado).
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

export const EFEITOS: ParteDef[] = [
  {
    id: 'efe_aura',
    categoria: 'efeito',
    nome: 'Aura de Poder',
    descricao: 'Halo de energia irradiando atrás do personagem.',
    raridade: 'raro',
    tema: 'fantasia',
    usaCores: ['destaque'],
    atras: true,
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}aura" cx="0.5" cy="0.55" r="0.55">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.55)}"/>
          <stop offset="0.6" stop-color="${alfa(p.destaque.base, 0.28)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0)}"/>
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}aura)">
        <animate attributeName="opacity" values="1;0.6;1" dur="3.4s" repeatCount="indefinite"/>
      </rect>`,
  },
  {
    id: 'efe_chuva',
    categoria: 'efeito',
    nome: 'Chuva Digital',
    descricao: 'Colunas de código escorrendo atrás de você.',
    raridade: 'raro',
    tema: 'cyberpunk',
    usaCores: ['destaque'],
    atras: true,
    render: (p, u) => {
      let colunas = '';
      for (let i = 0; i < 9; i++) {
        const x = 14 + i * 26;
        const alt = 40 + ((i * 37) % 60);
        const dur = (2.2 + ((i * 13) % 20) / 10).toFixed(1);
        const atraso = ((i * 7) % 20) / 10;
        colunas += `
        <line x1="${x}" y1="-${alt}" x2="${x}" y2="0" stroke="url(#${u}chv)" stroke-width="2.4">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 ${240 + alt}" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </line>`;
      }
      return `
      <defs>
        <linearGradient id="${u}chv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.base, 0)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.claro, 0.8)}"/>
        </linearGradient>
      </defs>${colunas}`;
    },
  },
  {
    id: 'efe_scanlines',
    categoria: 'efeito',
    nome: 'Scanlines CRT',
    descricao: 'Textura de monitor retrô sobre a cena.',
    raridade: 'incomum',
    tema: 'retrô',
    render: (_p, u) => `
      <defs>
        <pattern id="${u}scan" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="1.4" fill="rgba(0,0,0,0.22)"/>
        </pattern>
      </defs>
      <rect width="240" height="240" fill="url(#${u}scan)"/>
      <rect width="240" height="240" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="16"/>`,
  },
  {
    id: 'efe_particulas',
    categoria: 'efeito',
    nome: 'Partículas Flutuantes',
    descricao: 'Pontos de luz subindo lentamente pelas bordas.',
    raridade: 'raro',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (p) => {
      let pts = '';
      const pos: Array<[number, number]> = [
        [18, 200], [34, 150], [22, 96], [44, 52], [206, 190], [222, 140], [214, 84], [196, 44], [60, 224], [180, 226],
      ];
      pos.forEach(([x, y], i) => {
        const dur = (3 + (i % 4)).toFixed(0);
        pts += `
        <circle cx="${x}" cy="${y}" r="${2 + (i % 3)}" fill="${alfa(p.destaque.claro, 0.85)}">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -26; 0 0" dur="${dur}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.85;0.2;0.85" dur="${dur}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite"/>
        </circle>`;
      });
      return pts;
    },
  },
  {
    id: 'efe_portal',
    categoria: 'efeito',
    nome: 'Portal Dimensional',
    descricao: 'Anéis giratórios de outra dimensão atrás de você.',
    raridade: 'lendario',
    tema: 'sci-fi',
    usaCores: ['destaque'],
    atras: true,
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}ptl" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stop-color="${alfa(p.destaque.base, 0)}"/>
          <stop offset="0.8" stop-color="${alfa(p.destaque.base, 0.3)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0)}"/>
        </radialGradient>
      </defs>
      <circle cx="120" cy="118" r="92" fill="url(#${u}ptl)"/>
      <g stroke="${alfa(p.destaque.claro, 0.7)}" stroke-width="2.4" fill="none" stroke-dasharray="26 18">
        <circle cx="120" cy="118" r="86">
          <animateTransform attributeName="transform" type="rotate" from="0 120 118" to="360 120 118" dur="14s" repeatCount="indefinite"/>
        </circle>
      </g>
      <g stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="1.6" fill="none" stroke-dasharray="10 14">
        <circle cx="120" cy="118" r="74">
          <animateTransform attributeName="transform" type="rotate" from="360 120 118" to="0 120 118" dur="10s" repeatCount="indefinite"/>
        </circle>
      </g>`,
  },
  {
    id: 'efe_raio',
    categoria: 'efeito',
    nome: 'Tempestade Elétrica',
    descricao: 'Relâmpagos estalando ao redor — cuidado ao apertar a mão.',
    raridade: 'epico',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (p) => {
      const raio = (d: string, dur: string, atraso: string) => `
        <path d="${d}" stroke="${p.destaque.claro}" stroke-width="2.6" fill="none" stroke-linejoin="round" opacity="0">
          <animate attributeName="opacity" values="0;1;0;0" keyTimes="0;0.06;0.16;1" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </path>`;
      return `
      ${raio('M30 40 l 12 22 l -10 4 l 14 26', '2.8', '0')}
      ${raio('M208 60 l -12 20 l 10 5 l -13 23', '3.4', '1.1')}
      ${raio('M44 190 l 10 -18 l -8 -4 l 12 -20', '3.1', '2.0')}
      ${raio('M198 186 l -9 -16 l 8 -5 l -11 -19', '2.6', '0.7')}`;
    },
  },
  {
    id: 'efe_glitch',
    categoria: 'efeito',
    nome: 'Glitch',
    descricao: 'A realidade desincroniza por um instante. Você não.',
    raridade: 'epico',
    tema: 'cyberpunk',
    render: () => `
      <g opacity="0">
        <rect x="0" y="58" width="240" height="7" fill="rgba(76,217,232,0.5)"/>
        <rect x="0" y="132" width="240" height="5" fill="rgba(255,95,143,0.5)"/>
        <animate attributeName="opacity" values="0;1;0;0;1;0;0" keyTimes="0;0.03;0.08;0.5;0.53;0.58;1" dur="3.6s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate" values="0 0; -8 0; 6 0; 0 0" dur="3.6s" repeatCount="indefinite"/>
      </g>
      <g opacity="0">
        <rect x="0" y="90" width="240" height="4" fill="rgba(76,217,232,0.45)"/>
        <rect x="0" y="182" width="240" height="6" fill="rgba(255,95,143,0.45)"/>
        <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.3;0.34;0.4;1" dur="4.4s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate" values="0 0; 9 0; -5 0; 0 0" dur="4.4s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'efe_fogo',
    categoria: 'efeito',
    nome: 'Chamas Vivas',
    descricao: 'O fogo de quem carrega a meta do time inteiro.',
    raridade: 'mitico',
    tema: 'fantasia',
    atras: true,
    render: (_p, u) => {
      const chama = (x: number, esc: number, dur: string, atraso: string) => `
        <g transform="translate(${x} 236) scale(${esc})">
          <path d="M0 0 c -12 -14 -8 -30 0 -42 c 3 10 10 12 8 24 c 6 -6 6 -14 4 -20 c 8 10 10 26 -2 38 z" fill="url(#${u}fg1)">
            <animateTransform attributeName="transform" type="scale" values="1;1.14 0.92;1" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite" additive="sum"/>
          </path>
        </g>`;
      return `
      <defs>
        <linearGradient id="${u}fg1" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#ff5230"/>
          <stop offset="0.6" stop-color="#ff9a3d"/>
          <stop offset="1" stop-color="#ffd76e"/>
        </linearGradient>
      </defs>
      ${chama(28, 1, '0.9', '0')}
      ${chama(54, 0.7, '1.1', '0.3')}
      ${chama(186, 0.75, '1.0', '0.5')}
      ${chama(212, 1.05, '0.85', '0.2')}
      ${chama(40, 0.5, '1.2', '0.6')}
      ${chama(200, 0.55, '1.15', '0.1')}`;
    },
  },
  {
    id: 'efe_confete',
    categoria: 'efeito',
    nome: 'Confete Eterno',
    descricao: 'A festa do Colecionador nunca termina.',
    raridade: 'lendario',
    tema: 'conquista',
    bloqueadoPor: 'conquista:colecionador_5',
    render: () => {
      const CORES = ['#ff5f6e', '#ffb74c', '#4cd97c', '#4c9de8', '#b06ce8', '#ffd76e'];
      let pedacos = '';
      for (let i = 0; i < 16; i++) {
        const x = ((i * 61) % 224) + 8;
        const dur = (3 + (i % 5) * 0.5).toFixed(1);
        const atraso = ((i * 7) % 30) / 10;
        const rot = 40 + (i % 4) * 70;
        pedacos += `
        <rect x="${x}" y="-14" width="7" height="11" rx="1.5" fill="${CORES[i % CORES.length]}" opacity="0.9" transform="rotate(${rot} ${x} 0)">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 268" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite" additive="sum"/>
        </rect>`;
      }
      return pedacos;
    },
  },
  {
    id: 'efe_faiscas',
    categoria: 'efeito',
    nome: 'Faíscas Lendárias',
    descricao: 'Cintilações douradas em cruz — brilho de troféu.',
    raridade: 'lendario',
    tema: 'fantasia',
    render: () => {
      const faisca = (x: number, y: number, s: number, d: string, atraso: string) => `
        <path d="M${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z" fill="#ffe89a">
          <animate attributeName="opacity" values="0;1;0" dur="${d}s" begin="${atraso}s" repeatCount="indefinite"/>
        </path>`;
      return `
      ${faisca(36, 60, 9, '2.4', '0')}
      ${faisca(206, 90, 7, '2.8', '0.9')}
      ${faisca(210, 196, 10, '3.1', '1.6')}
      ${faisca(30, 176, 6, '2.2', '0.5')}
      ${faisca(120, 26, 8, '2.9', '1.2')}
      ${faisca(66, 222, 5, '2.5', '1.9')}`;
    },
  },
  // ── 4.6 F2 · Onda 3 (poderes) — 8 efeitos novos ───────────────────
  {
    id: 'efe_neve',
    categoria: 'efeito',
    nome: 'Nevasca',
    descricao: 'Flocos caindo devagar — inverno particular.',
    raridade: 'raro',
    tema: 'clima',
    atras: true,
    render: () => {
      let flocos = '';
      for (let i = 0; i < 14; i++) {
        const x = ((i * 67) % 232) + 4;
        const r = 1.4 + (i % 3);
        const dur = (4 + (i % 5)).toFixed(0);
        const atraso = ((i * 11) % 30) / 10;
        flocos += `<circle cx="${x}" cy="-8" r="${r}" fill="#eef6ff" opacity="0.85">
          <animateTransform attributeName="transform" type="translate" values="0 0;${(i % 2 ? 10 : -10)} 256" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </circle>`;
      }
      return flocos;
    },
  },
  {
    id: 'efe_folhas',
    categoria: 'efeito',
    nome: 'Folhas ao Vento',
    descricao: 'Outono constante, prazos também.',
    raridade: 'incomum',
    tema: 'natureza',
    atras: true,
    render: () => {
      let folhas = '';
      const cores = ['#d98a3a', '#b0642a', '#e8b64c'];
      for (let i = 0; i < 8; i++) {
        const y = ((i * 53) % 200) + 16;
        const dur = (5 + (i % 4)).toFixed(0);
        const atraso = ((i * 13) % 40) / 10;
        folhas += `<ellipse cx="-10" cy="${y}" rx="5" ry="2.6" fill="${cores[i % 3]}" opacity="0.8" transform="rotate(30)">
          <animateTransform attributeName="transform" type="translate" values="0 0;270 ${(i % 2 ? 30 : -20)}" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </ellipse>`;
      }
      return folhas;
    },
  },
  {
    id: 'efe_borboletas',
    categoria: 'efeito',
    nome: 'Borboletas',
    descricao: 'Um jardim decidiu te acompanhar.',
    raridade: 'raro',
    tema: 'natureza',
    usaCores: ['destaque'],
    render: (p) => {
      const borboleta = (x: number, y: number, esc: number, dur: string) => `
        <g transform="translate(${x} ${y}) scale(${esc})">
          <ellipse cx="-4" cy="0" rx="4.5" ry="3" fill="${p.destaque.base}" opacity="0.9">
            <animateTransform attributeName="transform" type="scale" values="1 1;0.35 1;1 1" dur="${dur}s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="4" cy="0" rx="4.5" ry="3" fill="${p.destaque.claro}" opacity="0.9">
            <animateTransform attributeName="transform" type="scale" values="0.35 1;1 1;0.35 1" dur="${dur}s" repeatCount="indefinite"/>
          </ellipse>
          <rect x="-0.8" y="-3" width="1.6" height="6" rx="0.8" fill="#3a2c20"/>
        </g>`;
      return `
      ${borboleta(38, 70, 1, '0.7')}
      ${borboleta(206, 110, 0.8, '0.9')}
      ${borboleta(52, 196, 0.7, '0.8')}
      ${borboleta(196, 208, 1.1, '0.75')}`;
    },
  },
  {
    id: 'efe_tempestade',
    categoria: 'efeito',
    nome: 'Tempestade',
    descricao: 'Relâmpagos cortando o céu atrás de você.',
    raridade: 'epico',
    tema: 'clima',
    atras: true,
    render: () => `
      <path d="M52 0 l -10 42 l 14 -6 l -12 40" stroke="#cfe0ff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0">
        <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.62;0.66;0.72;1" dur="3.4s" repeatCount="indefinite" calcMode="discrete"/>
      </path>
      <path d="M196 0 l 8 36 l -13 -4 l 10 44" stroke="#e8f0ff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity="0">
        <animate attributeName="opacity" values="0;1;0;0;0" keyTimes="0;0.08;0.14;0.6;1" dur="4.1s" repeatCount="indefinite" calcMode="discrete"/>
      </path>
      <rect width="240" height="240" fill="#cfe0ff" opacity="0">
        <animate attributeName="opacity" values="0;0.16;0;0;0.1;0" keyTimes="0;0.07;0.12;0.6;0.65;1" dur="4.1s" repeatCount="indefinite" calcMode="discrete"/>
      </rect>`,
  },
  {
    id: 'efe_bolhas',
    categoria: 'efeito',
    nome: 'Bolhas',
    descricao: 'Leveza subindo em câmera lenta.',
    raridade: 'comum',
    tema: 'casual',
    atras: true,
    usaCores: ['destaque'],
    render: (p) => {
      let bolhas = '';
      for (let i = 0; i < 9; i++) {
        const x = ((i * 79) % 224) + 8;
        const r = 3 + (i % 4) * 2;
        const dur = (5 + (i % 4)).toFixed(0);
        const atraso = ((i * 17) % 40) / 10;
        bolhas += `<circle cx="${x}" cy="252" r="${r}" fill="none" stroke="${alfa(p.destaque.claro, 0.5)}" stroke-width="1.4">
          <animateTransform attributeName="transform" type="translate" values="0 0;${(i % 2 ? 8 : -8)} -270" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </circle>`;
      }
      return bolhas;
    },
  },
  {
    id: 'efe_sakura',
    categoria: 'efeito',
    nome: 'Pétalas de Sakura',
    descricao: 'O dojo floresce na sua passagem.',
    raridade: 'epico',
    tema: 'fantasia',
    atras: true,
    render: () => {
      let petalas = '';
      for (let i = 0; i < 10; i++) {
        const x = ((i * 71) % 228) + 6;
        const dur = (4.5 + (i % 4) * 0.8).toFixed(1);
        const atraso = ((i * 9) % 36) / 10;
        petalas += `<path d="M${x} -6 q 3 -4 6 0 q -3 5 -6 0 z" fill="#ffb7d0" opacity="0.9">
          <animateTransform attributeName="transform" type="translate" values="0 0;${(i % 2 ? 22 : -16)} 260" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </path>`;
      }
      return petalas;
    },
  },
  {
    id: 'efe_moedas',
    categoria: 'efeito',
    nome: 'Chuva de Moedas',
    descricao: 'O trimestre fechou verde — e transbordou.',
    raridade: 'lendario',
    bloqueadoPor: 'conquista:favoritador_25',
    tema: 'executivo',
    render: () => {
      let moedas = '';
      for (let i = 0; i < 8; i++) {
        const x = i < 4 ? 14 + i * 14 : 176 + (i - 4) * 14;
        const dur = (2.2 + (i % 4) * 0.5).toFixed(1);
        const atraso = ((i * 13) % 24) / 10;
        moedas += `<g opacity="0.95">
          <circle cx="${x}" cy="-10" r="6" fill="#e8b64c" stroke="#b07d1e" stroke-width="1.6"/>
          <text x="${x}" y="-6.6" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#8a5f10">$</text>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 262" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </g>`;
      }
      return moedas;
    },
  },
  {
    id: 'efe_holo_interf',
    categoria: 'efeito',
    nome: 'Interferência Holo',
    descricao: 'O sinal falha — a lenda, nunca.',
    raridade: 'mitico',
    tema: 'cyberpunk',
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="0" y="0" width="240" height="3" fill="${alfa(p.destaque.claro, 0.55)}">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 240;0 0" dur="4.6s" repeatCount="indefinite"/>
      </rect>
      <rect x="0" y="60" width="240" height="1.4" fill="${alfa('#ffffff', 0.35)}">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 160;0 0" dur="3.1s" repeatCount="indefinite"/>
      </rect>
      <g opacity="0">
        <rect x="0" y="84" width="26" height="4" fill="${p.destaque.base}"/>
        <rect x="214" y="150" width="26" height="4" fill="${p.destaque.base}"/>
        <rect x="0" y="200" width="18" height="3" fill="#ffffff"/>
        <animate attributeName="opacity" values="0;1;0;0;1;0" keyTimes="0;0.05;0.1;0.55;0.6;1" dur="2.8s" repeatCount="indefinite" calcMode="discrete"/>
      </g>`,
  },
  // ── 4.6 F2 · Onda 5 — 6 efeitos novos (meta §28: 24 ✓) ────────────
  {
    id: 'efe_vagalumes',
    categoria: 'efeito',
    nome: 'Vagalumes',
    descricao: 'Pequenas luzes vagando na penumbra ao seu redor.',
    raridade: 'incomum',
    tema: 'natureza',
    atras: true,
    render: () => {
      let luzes = '';
      const pontos: Array<[number, number, number, number]> = [
        [40, 80, 14, -10], [200, 60, -12, 16], [30, 180, 16, 12], [210, 190, -18, -8],
        [60, 40, 8, 18], [190, 130, -10, -14], [50, 220, 12, -16],
      ];
      pontos.forEach(([x, y, dx, dy], i) => {
        const dur = (3.5 + (i % 4) * 0.9).toFixed(1);
        luzes += `<circle cx="${x}" cy="${y}" r="2.2" fill="#d8ff8a">
          <animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};0 0" dur="${dur}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0.15;0.9" dur="${(1.4 + (i % 3) * 0.5).toFixed(1)}s" repeatCount="indefinite"/>
        </circle>`;
      });
      return luzes;
    },
  },
  {
    id: 'efe_veu_aurora',
    categoria: 'efeito',
    nome: 'Véu de Aurora',
    descricao: 'Cortinas polares ondulando atrás de você.',
    raridade: 'epico',
    tema: 'clima',
    atras: true,
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}vau" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgba(61,220,132,0.5)"/>
          <stop offset="0.6" stop-color="rgba(76,157,232,0.28)"/>
          <stop offset="1" stop-color="rgba(76,157,232,0)"/>
        </linearGradient>
      </defs>
      <path d="M0 0 h 60 q -10 60 8 120 L 40 120 Q 20 60 0 40 z" fill="url(#${u}vau)">
        <animateTransform attributeName="transform" type="skewX" values="0;6;0;-4;0" dur="7s" repeatCount="indefinite"/>
      </path>
      <path d="M180 0 h 60 v 40 q -20 20 -40 80 l -28 -10 q 18 -60 8 -110 z" fill="url(#${u}vau)">
        <animateTransform attributeName="transform" type="skewX" values="0;-5;0;4;0" dur="8.5s" repeatCount="indefinite"/>
      </path>`,
  },
  {
    id: 'efe_poeira',
    categoria: 'efeito',
    nome: 'Poeira Estelar',
    descricao: 'Grãos de luz à deriva, sem pressa nenhuma.',
    raridade: 'comum',
    tema: 'espaço',
    atras: true,
    usaCores: ['destaque'],
    render: (p) => {
      let graos = '';
      for (let i = 0; i < 12; i++) {
        const x = ((i * 83) % 230) + 5;
        const y = ((i * 59) % 220) + 10;
        const dur = (6 + (i % 5)).toFixed(0);
        graos += `<circle cx="${x}" cy="${y}" r="${(0.8 + (i % 3) * 0.6).toFixed(1)}" fill="${alfa(p.destaque.claro, 0.55)}">
          <animateTransform attributeName="transform" type="translate" values="0 0;${(i % 2 ? 6 : -6)} -14;0 0" dur="${dur}s" repeatCount="indefinite"/>
        </circle>`;
      }
      return graos;
    },
  },
  {
    id: 'efe_descarga',
    categoria: 'efeito',
    nome: 'Descarga de Energia',
    descricao: 'Arcos elétricos serpenteando pelas bordas do quadro.',
    raridade: 'lendario',
    tema: 'sci-fi',
    usaCores: ['destaque'],
    render: (p) => {
      const arco = (d: string, dur: string, atraso: string) => `
        <path d="${d}" stroke="${p.destaque.claro}" stroke-width="2.2" fill="none" stroke-linejoin="round" opacity="0">
          <animate attributeName="opacity" values="0;1;0.4;1;0;0" keyTimes="0;0.05;0.09;0.13;0.2;1" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite" calcMode="discrete"/>
        </path>`;
      return `
      ${arco('M8 30 l 14 8 l -6 10 l 16 6 l -8 12 l 14 6', '2.6', '0')}
      ${arco('M232 44 l -14 6 l 8 10 l -18 4 l 10 12 l -12 8', '3.1', '0.9')}
      ${arco('M10 200 l 16 -6 l -4 -12 l 18 -2 l -6 -12', '2.9', '1.7')}
      ${arco('M230 196 l -16 -4 l 6 -12 l -18 -4 l 8 -10', '3.4', '0.4')}`;
    },
  },
  {
    id: 'efe_nevoa',
    categoria: 'efeito',
    nome: 'Névoa Baixa',
    descricao: 'Um tapete de névoa rolando aos seus pés.',
    raridade: 'incomum',
    tema: 'clima',
    render: () => `
      <g fill="rgba(210,220,240,0.16)">
        <ellipse cx="60" cy="228" rx="70" ry="18">
          <animateTransform attributeName="transform" type="translate" values="0 0;24 -3;0 0" dur="7s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="170" cy="234" rx="80" ry="20">
          <animateTransform attributeName="transform" type="translate" values="0 0;-28 -4;0 0" dur="8.5s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="120" cy="240" rx="90" ry="22">
          <animateTransform attributeName="transform" type="translate" values="0 0;14 -6;0 0" dur="6s" repeatCount="indefinite"/>
        </ellipse>
      </g>`,
  },
  {
    id: 'efe_metricas',
    categoria: 'efeito',
    nome: 'Métricas Subindo',
    descricao: 'Setas verdes decolando — o dashboard aprova.',
    raridade: 'raro',
    tema: 'executivo',
    render: () => {
      const seta = (x: number, y: number, esc: number, dur: string, atraso: string) => `
        <g transform="translate(${x} ${y}) scale(${esc})" opacity="0.9">
          <path d="M0 10 L0 -6 M-5 -1 L0 -6 L5 -1" stroke="#4cd97c" stroke-width="3" fill="none" stroke-linecap="round"/>
          <animateTransform attributeName="transform" type="translate" values="${x} ${y};${x} ${y - 34}" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite" additive="replace"/>
          <animate attributeName="opacity" values="0;0.9;0" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </g>`;
      return `
      ${seta(28, 190, 1, '2.6', '0')}
      ${seta(46, 150, 0.7, '3.1', '0.8')}
      ${seta(206, 200, 1.1, '2.8', '0.4')}
      ${seta(220, 140, 0.8, '3.4', '1.4')}
      <path d="M14 96 l 12 -10 l 8 6 l 14 -16" stroke="rgba(76,217,124,0.5)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M196 92 l 12 -8 l 8 5 l 14 -14" stroke="rgba(76,217,124,0.4)" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    },
  },
];
