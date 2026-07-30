// engine/partes/molduras.ts — molduras (aros de raridade) do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Desenhadas POR CIMA de tudo, rente à borda do quadro (240×240, raio 26).
// São o principal marcador visual de raridade no header/menu.
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

const R = 26; // raio dos cantos do quadro

export const MOLDURAS: ParteDef[] = [
  {
    id: 'mol_aro',
    categoria: 'moldura',
    nome: 'Aro Clean',
    descricao: 'Contorno fino e elegante.',
    raridade: 'comum',
    tema: 'clássico',
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="4"/>`,
  },
  {
    id: 'mol_duplo',
    categoria: 'moldura',
    nome: 'Aro Duplo',
    descricao: 'Linha dupla com respiro interno.',
    raridade: 'incomum',
    tema: 'clássico',
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="3.4"/>
      <rect x="10" y="10" width="220" height="220" rx="${R - 6}" fill="none" stroke="${alfa(p.destaque.base, 0.45)}" stroke-width="1.6"/>`,
  },
  {
    id: 'mol_tech',
    categoria: 'moldura',
    nome: 'Cantos Táticos',
    descricao: 'Suportes de HUD nos quatro cantos.',
    raridade: 'raro',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p) => {
      const c = p.destaque.base;
      return `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa(c, 0.35)}" stroke-width="2"/>
      <g stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round">
        <path d="M8 42 v-16 a 18 18 0 0 1 18 -18 h 16"/>
        <path d="M232 42 v-16 a 18 18 0 0 0 -18 -18 h -16"/>
        <path d="M8 198 v 16 a 18 18 0 0 0 18 18 h 16"/>
        <path d="M232 198 v 16 a 18 18 0 0 1 -18 18 h -16"/>
      </g>
      <circle cx="120" cy="8" r="3" fill="${c}"/>
      <circle cx="120" cy="232" r="3" fill="${c}"/>`;
    },
  },
  {
    id: 'mol_neon',
    categoria: 'moldura',
    nome: 'Neon Pulsante',
    descricao: 'Tubo de neon vivo respirando luz.',
    raridade: 'epico',
    tema: 'cyberpunk',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <filter id="${u}blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
      </defs>
      <rect x="5" y="5" width="230" height="230" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="7" filter="url(#${u}blur)" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.35;0.8" dur="2.6s" repeatCount="indefinite"/>
      </rect>
      <rect x="5" y="5" width="230" height="230" rx="${R}" fill="none" stroke="${p.destaque.claro}" stroke-width="2.6"/>`,
  },
  {
    id: 'mol_ouro',
    categoria: 'moldura',
    nome: 'Ouro Imperial',
    descricao: 'Moldura lendária cravejada de gemas.',
    raridade: 'lendario',
    tema: 'fantasia',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}ouro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffe89a"/>
          <stop offset="0.35" stop-color="#e8b64c"/>
          <stop offset="0.65" stop-color="#b07d1e"/>
          <stop offset="1" stop-color="#ffe89a"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="url(#${u}ouro)" stroke-width="7"/>
      <rect x="10" y="10" width="220" height="220" rx="${R - 6}" fill="none" stroke="${alfa('#8a5f10', 0.55)}" stroke-width="1.6"/>
      <circle cx="120" cy="7" r="4" fill="#ff5f8f" stroke="#8a5f10" stroke-width="1"/>
      <circle cx="120" cy="233" r="4" fill="#4cd9e8" stroke="#8a5f10" stroke-width="1"/>
      <circle cx="7" cy="120" r="4" fill="#7ce87c" stroke="#8a5f10" stroke-width="1"/>
      <circle cx="233" cy="120" r="4" fill="#c99aff" stroke="#8a5f10" stroke-width="1"/>`,
  },
  {
    id: 'mol_rgb',
    categoria: 'moldura',
    nome: 'LED RGB',
    descricao: 'O aro gamer clássico — todas as cores, o tempo todo.',
    raridade: 'raro',
    tema: 'gamer',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}rgb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff5f6e"/>
          <stop offset="0.25" stop-color="#ffb74c"/>
          <stop offset="0.5" stop-color="#4cd97c"/>
          <stop offset="0.75" stop-color="#4c9de8"/>
          <stop offset="1" stop-color="#b06ce8"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="url(#${u}rgb)" stroke-width="5">
        <animate attributeName="opacity" values="1;0.55;1" dur="3.2s" repeatCount="indefinite"/>
      </rect>
      <rect x="10" y="10" width="220" height="220" rx="${R - 6}" fill="none" stroke="url(#${u}rgb)" stroke-width="1.4" opacity="0.4"/>`,
  },
  {
    id: 'mol_cristal',
    categoria: 'moldura',
    nome: 'Cristal Mítico',
    descricao: 'Lascas de gelo eterno cravadas no quadro.',
    raridade: 'mitico',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}cri" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#dff4ff"/>
          <stop offset="0.5" stop-color="${p.destaque.claro}"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="url(#${u}cri)" stroke-width="5"/>
      <g fill="url(#${u}cri)" stroke="${alfa('#ffffff', 0.5)}" stroke-width="1">
        <path d="M120 2 l 10 12 l -10 12 l -10 -12 z"/>
        <path d="M120 214 l 9 11 l -9 12 l -9 -12 z"/>
        <path d="M2 120 l 12 -10 l 12 10 l -12 10 z"/>
        <path d="M214 120 l 12 -9 l 12 9 l -12 9 z"/>
        <path d="M28 22 l 9 8 l -5 11 l -11 -7 z"/>
        <path d="M212 22 l -9 8 l 5 11 l 11 -7 z"/>
        <path d="M28 218 l 9 -8 l -5 -11 l -11 7 z"/>
        <path d="M212 218 l -9 -8 l 5 -11 l 11 7 z"/>
      </g>
      <path d="M120 6 l 6 8 l -6 7" stroke="${alfa('#ffffff', 0.7)}" stroke-width="1.4" fill="none"/>`,
  },
  {
    id: 'mol_pioneiro',
    categoria: 'moldura',
    nome: 'Pioneiro',
    descricao: 'A moldura de quem criou a própria identidade primeiro.',
    raridade: 'epico',
    tema: 'conquista',
    usaCores: ['destaque'],
    bloqueadoPor: 'conquista:primeiro_avatar',
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}pio" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#d8deea"/>
          <stop offset="0.5" stop-color="#8a94ab"/>
          <stop offset="1" stop-color="#d8deea"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="url(#${u}pio)" stroke-width="6"/>
      <circle cx="120" cy="8" r="11" fill="url(#${u}pio)" stroke="#5b6578" stroke-width="1.4"/>
      <path d="M117 3 l 3 -2 v 13 h -3 m 0 0 h 7" stroke="${p.destaque.profundo}" stroke-width="2.2" fill="none"/>
      <rect x="10" y="10" width="220" height="220" rx="${R - 6}" fill="none" stroke="${alfa(p.destaque.base, 0.35)}" stroke-width="1.4"/>`,
  },
  {
    id: 'mol_dshow',
    categoria: 'moldura',
    nome: 'Exclusiva Dshow',
    descricao: 'Moldura assinada da casa — edição exclusiva.',
    raridade: 'exclusivo',
    tema: 'dshow',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}dsh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${p.destaque.claro}"/>
          <stop offset="0.5" stop-color="${p.destaque.base}"/>
          <stop offset="1" stop-color="#e8b64c"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="url(#${u}dsh)" stroke-width="5.5"/>
      <path d="M92 232 h 56" stroke="#0c0f18" stroke-width="10" stroke-linecap="round"/>
      <text x="120" y="236.5" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="700" fill="url(#${u}dsh)" letter-spacing="2">DSHOW</text>`,
  },
  // ── 4.6 F2 · Onda 2 — 6 molduras novas (comportamento cresce com a
  //    raridade, §7.3: comum = estática · épico+ = viva/animada) ─────
  {
    id: 'mol_madeira',
    categoria: 'moldura',
    nome: 'Madeira de Lei',
    descricao: 'Clássica, quente e impossível de sair de moda.',
    raridade: 'comum',
    tema: 'clássico',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}mad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#9a6a3a"/>
          <stop offset="0.5" stop-color="#6a4426"/>
          <stop offset="1" stop-color="#4a2d18"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="url(#${u}mad)" stroke-width="8"/>
      <rect x="8" y="8" width="224" height="224" rx="${R - 5}" fill="none" stroke="${alfa('#2b1a0e', 0.6)}" stroke-width="1.6"/>
      <path d="M30 5 q 30 3 60 0 M150 235 q 30 -3 60 0" stroke="${alfa('#ffdca8', 0.25)}" stroke-width="2" fill="none"/>`,
  },
  {
    id: 'mol_selo',
    categoria: 'moldura',
    nome: 'Selo Oficial',
    descricao: 'Carimbo de autenticidade no canto do quadro.',
    raridade: 'incomum',
    tema: 'executivo',
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="3.6"/>
      <circle cx="206" cy="206" r="20" fill="${p.destaque.profundo}" stroke="${p.destaque.claro}" stroke-width="2.4"/>
      <circle cx="206" cy="206" r="14" fill="none" stroke="${alfa('#ffffff', 0.5)}" stroke-width="1.4" stroke-dasharray="3 3"/>
      <path d="M199 206 l 5 5 l 9 -10" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    id: 'mol_louros',
    categoria: 'moldura',
    nome: 'Louros da Vitória',
    descricao: 'Folhas de quem subiu no pódio e pretende voltar.',
    raridade: 'raro',
    tema: 'esportivo',
    render: (_p, u) => {
      let folhas = '';
      for (let lado = 0; lado < 2; lado++) {
        const dir = lado === 0 ? 1 : -1;
        for (let i = 0; i < 7; i++) {
          const t = i / 6;
          const ang = 150 - t * 120;
          const rad = (ang * Math.PI) / 180;
          const x = 120 - dir * Math.cos(rad) * 108;
          const yy = 122 - Math.sin(rad) * 104;
          folhas += `<ellipse cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" rx="10" ry="4.4" fill="url(#${u}lou)" transform="rotate(${(dir * (30 + t * 90)).toFixed(0)} ${x.toFixed(1)} ${yy.toFixed(1)})"/>`;
        }
      }
      return `
      <defs>
        <linearGradient id="${u}lou" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#6fae5c"/>
          <stop offset="1" stop-color="#3a7a34"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="#3a7a34" stroke-width="3"/>
      ${folhas}
      <circle cx="120" cy="228" r="7" fill="#e8b64c" stroke="#b07d1e" stroke-width="1.6"/>`;
    },
  },
  {
    id: 'mol_circuito',
    categoria: 'moldura',
    nome: 'Circuito Vivo',
    descricao: 'Trilhas energizadas percorrendo o contorno.',
    raridade: 'epico',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa(p.destaque.profundo, 0.9)}" stroke-width="5"/>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${p.destaque.claro}" stroke-width="2.2" stroke-dasharray="26 210">
        <animate attributeName="stroke-dashoffset" values="0;-944" dur="6s" repeatCount="indefinite"/>
      </rect>
      <circle cx="120" cy="4" r="4" fill="${p.destaque.base}"><animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite"/></circle>
      <circle cx="120" cy="236" r="4" fill="${p.destaque.base}"><animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite"/></circle>
      <circle cx="4" cy="120" r="4" fill="${p.destaque.base}"/>
      <circle cx="236" cy="120" r="4" fill="${p.destaque.base}"/>
      <path d="M30 12 h 24 l 8 -8 M186 228 h 24 l 8 8" stroke="${alfa(p.destaque.base, 0.7)}" stroke-width="2" fill="none"/>`,
  },
  {
    id: 'mol_chamas',
    categoria: 'moldura',
    nome: 'Chamas Eternas',
    descricao: 'O contorno queima — o conteúdo ainda mais.',
    raridade: 'lendario',
    tema: 'fantasia',
    render: (_p, u) => {
      let chamas = '';
      for (let i = 0; i < 8; i++) {
        const x = 26 + i * 27;
        chamas += `<path d="M${x} 238 q -6 -14 0 -24 q 3 6 6 8 q 4 -8 2 -16 q 8 10 6 22 q -2 8 -14 10 z" fill="url(#${u}fla)" opacity="0.9">
          <animateTransform attributeName="transform" type="scale" values="1 1;1 ${(1.12 + (i % 3) * 0.06).toFixed(2)};1 1" dur="${(1.2 + (i % 4) * 0.25).toFixed(2)}s" repeatCount="indefinite" additive="sum"/>
        </path>`;
      }
      return `
      <defs>
        <linearGradient id="${u}fla" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#ff5230"/>
          <stop offset="0.6" stop-color="#ff8a3d"/>
          <stop offset="1" stop-color="#ffd75e"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="#ff5230" stroke-width="4.4"/>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="#ffd75e" stroke-width="1.6" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite"/>
      </rect>
      ${chamas}`;
    },
  },
  {
    id: 'mol_glitch',
    categoria: 'moldura',
    nome: 'Glitch Dimensional',
    descricao: 'O quadro não decide em qual realidade ficar.',
    raridade: 'mitico',
    bloqueadoPor: 'conquista:centuriao_100',
    tema: 'cyberpunk',
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="6" y="6" width="228" height="228" rx="${R}" fill="none" stroke="#ff2e63" stroke-width="3" opacity="0.8">
        <animateTransform attributeName="transform" type="translate" values="0 0;-3 1;2 -1;0 0" dur="0.9s" repeatCount="indefinite" calcMode="discrete"/>
      </rect>
      <rect x="6" y="6" width="228" height="228" rx="${R}" fill="none" stroke="#2ee6ff" stroke-width="3" opacity="0.8">
        <animateTransform attributeName="transform" type="translate" values="0 0;3 -1;-2 1;0 0" dur="0.9s" repeatCount="indefinite" calcMode="discrete"/>
      </rect>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="4"/>
      <path d="M4 84 h 14 M4 92 h 8 M236 148 h -14 M236 156 h -8" stroke="#ffffff" stroke-width="3">
        <animate attributeName="opacity" values="1;0;1;0;1" dur="1.4s" repeatCount="indefinite" calcMode="discrete"/>
      </path>`,
  },
  // ── 4.6 F2 · Onda 5 — 9 molduras novas (meta §28: 24 ✓) ───────────
  {
    id: 'mol_minimal',
    categoria: 'moldura',
    nome: 'Fio Minimal',
    descricao: 'Um traço fino. Nada mais é necessário.',
    raridade: 'comum',
    tema: 'clássico',
    render: () => `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa('#c4c9d6', 0.65)}" stroke-width="2"/>`,
  },
  {
    id: 'mol_pontilhada',
    categoria: 'moldura',
    nome: 'Pontilhada',
    descricao: 'Recorte aqui — mas só se for para emoldurar.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="3" stroke-dasharray="1 9" stroke-linecap="round"/>`,
  },
  {
    id: 'mol_degrade',
    categoria: 'moldura',
    nome: 'Degradê Duplo',
    descricao: 'Duas cores escorrendo pelo contorno.',
    raridade: 'incomum',
    tema: 'casual',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}mdg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${p.destaque.claro}"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="url(#${u}mdg)" stroke-width="5"/>
      <rect x="9" y="9" width="222" height="222" rx="${R - 5}" fill="none" stroke="${alfa(p.destaque.base, 0.3)}" stroke-width="1.6"/>`,
  },
  {
    id: 'mol_colmeia',
    categoria: 'moldura',
    nome: 'Colmeia',
    descricao: 'Hexágonos disciplinados guardando os cantos.',
    raridade: 'raro',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p) => {
      const hex = (x: number, y: number, r: number, o: number) => {
        let d = '';
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          d += `${i === 0 ? 'M' : 'L'}${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)} `;
        }
        return `<path d="${d}z" fill="none" stroke="${alfa(p.destaque.base, o)}" stroke-width="2"/>`;
      };
      return `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa(p.destaque.base, 0.75)}" stroke-width="3.4"/>
      ${hex(24, 24, 12, 0.9)}${hex(43, 15, 8, 0.5)}${hex(15, 43, 8, 0.5)}
      ${hex(216, 216, 12, 0.9)}${hex(197, 225, 8, 0.5)}${hex(225, 197, 8, 0.5)}`;
    },
  },
  {
    id: 'mol_vetores',
    categoria: 'moldura',
    nome: 'Vetores',
    descricao: 'Setas de alinhamento apontando para quem importa.',
    raridade: 'raro',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="6" y="6" width="228" height="228" rx="${R}" fill="none" stroke="${alfa(p.destaque.base, 0.6)}" stroke-width="2.4"/>
      <g stroke="${p.destaque.claro}" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M20 34 v -14 h 14 M206 20 h 14 v 14 M220 206 v 14 h -14 M34 220 h -14 v -14">
          <animate attributeName="opacity" values="1;0.45;1" dur="2.6s" repeatCount="indefinite"/>
        </path>
      </g>`,
  },
  {
    id: 'mol_geada',
    categoria: 'moldura',
    nome: 'Geada',
    descricao: 'Cristais de gelo avançando pelas bordas.',
    raridade: 'epico',
    tema: 'clima',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}gel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#bfe8ff"/>
          <stop offset="1" stop-color="#5da8d8"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="url(#${u}gel)" stroke-width="4.4"/>
      <g fill="none" stroke="#dff4ff" stroke-width="2" stroke-linecap="round" opacity="0.9">
        <path d="M10 60 l 14 -8 m -14 -6 l 18 2 m -18 -16 l 12 6"/>
        <path d="M230 180 l -14 8 m 14 6 l -18 -2 m 18 16 l -12 -6"/>
        <path d="M60 10 l -6 14 m 14 -14 l -2 18 m 16 -18 l -6 12"/>
        <path d="M180 230 l 6 -14 m -14 14 l 2 -18 m -16 18 l 6 -12"/>
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="3.2s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'mol_espinhos',
    categoria: 'moldura',
    nome: 'Espinhos',
    descricao: 'Bela por fora, intransponível por definição.',
    raridade: 'epico',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (p) => {
      let espinhos = '';
      for (let i = 0; i < 8; i++) {
        const x = 36 + i * 24;
        espinhos += `<path d="M${x} 5 l 5 -0.5 l -2.5 -8 z M${x + 10} 235 l 5 0.5 l -2.5 8 z" fill="${p.destaque.profundo}"/>`;
      }
      return `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${p.destaque.profundo}" stroke-width="4.4"/>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa(p.destaque.claro, 0.35)}" stroke-width="1.4"/>
      ${espinhos}`;
    },
  },
  {
    id: 'mol_serpente',
    categoria: 'moldura',
    nome: 'Serpente de Luz',
    descricao: 'Duas serpentes luminosas se perseguindo para sempre.',
    raridade: 'lendario',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa(p.destaque.profundo, 0.55)}" stroke-width="4"/>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${p.destaque.claro}" stroke-width="3" stroke-dasharray="60 412" stroke-linecap="round">
        <animate attributeName="stroke-dashoffset" values="0;-944" dur="7s" repeatCount="indefinite"/>
      </rect>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa('#ffffff', 0.85)}" stroke-width="3" stroke-dasharray="60 412" stroke-linecap="round">
        <animate attributeName="stroke-dashoffset" values="-472;-1416" dur="7s" repeatCount="indefinite"/>
      </rect>`,
  },
  {
    id: 'mol_constelacao',
    categoria: 'moldura',
    nome: 'Constelação',
    descricao: 'Estrelas ligadas em volta — o mapa aponta para você.',
    raridade: 'lendario',
    tema: 'espaço',
    render: () => {
      const pontos: Array<[number, number]> = [
        [30, 10], [90, 6], [160, 12], [228, 34], [234, 110], [228, 186],
        [180, 230], [100, 234], [30, 226], [8, 150], [6, 70],
      ];
      let linhas = '';
      let estrelas = '';
      for (let i = 0; i < pontos.length; i++) {
        const [x, y] = pontos[i];
        const [x2, y2] = pontos[(i + 1) % pontos.length];
        linhas += `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="rgba(200,220,255,0.35)" stroke-width="1.2"/>`;
        estrelas += `<circle cx="${x}" cy="${y}" r="${2 + (i % 3)}" fill="#fff2c8">
          <animate attributeName="opacity" values="1;0.35;1" dur="${(2 + (i % 4) * 0.6).toFixed(1)}s" repeatCount="indefinite"/>
        </circle>`;
      }
      return `${linhas}${estrelas}`;
    },
  },
];
