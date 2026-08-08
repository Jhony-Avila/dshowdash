// engine/cor-hsl.ts — matemática de cor do COLOR STUDIO (AS6 §206–§212,
// lote 811–820, flag as6.color_studio — decisão #84).
// @version 1.0.0  @created 2026-08-08
//
// Módulo PURO (sem DOM/estado): conversões hex↔HSL e harmonias derivadas
// da cor atual. Tudo determinístico e clampado; hex sempre minúsculo
// #rrggbb (mesma normalização do validarConfig — byte-estável).

export interface Hsl { h: number; s: number; l: number } // h 0–360 · s/l 0–100

export function hexParaHsl(hex: string): Hsl {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0;
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslParaHex({ h, s, l }: Hsl): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.min(100, Math.max(0, s)) / 100;
  const ll = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ll - c / 2;
  const [r, g, b] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x]
    : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
  const canal = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${canal(r)}${canal(g)}${canal(b)}`;
}

export interface Harmonia { id: string; nome: string; hex: string }

/** §212: harmonias derivadas da cor ATUAL — sugestões, nunca imposição. */
export function harmoniasDe(hex: string): Harmonia[] {
  const base = hexParaHsl(hex);
  const gira = (graus: number): string => hslParaHex({ ...base, h: base.h + graus });
  return [
    { id: 'complementar', nome: 'Complementar', hex: gira(180) },
    { id: 'analoga_a', nome: 'Análoga −30°', hex: gira(-30) },
    { id: 'analoga_b', nome: 'Análoga +30°', hex: gira(30) },
    { id: 'triade_a', nome: 'Tríade −120°', hex: gira(-120) },
    { id: 'triade_b', nome: 'Tríade +120°', hex: gira(120) },
  ];
}
