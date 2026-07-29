// engine/cores.ts — utilidades de cor do motor de renderização.
// @version 1.0.0  @created 2026-07-29
//
// Cada slot de cor (pele/cabelo/roupa/destaque) vira uma "tinta" com tons
// derivados (claro/escuro/profundo) para sombreamento AAA determinístico.
// Nenhuma cor entra no SVG sem passar por normalizarHex (defesa contra injeção).
import type { SlotCor } from '../domain/types';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function hexValido(hex: unknown): hex is string {
  return typeof hex === 'string' && HEX_RE.test(hex);
}

/** Garante #rrggbb; qualquer coisa fora do padrão vira o fallback. */
export function normalizarHex(hex: unknown, fallback: string): string {
  if (hexValido(hex)) return hex.toLowerCase();
  // aceita forma curta #rgb
  if (typeof hex === 'string' && /^#[0-9a-fA-F]{3}$/.test(hex)) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function hexRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mistura linear entre duas cores (t: 0 = a, 1 = b). */
export function misturar(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexRgb(a);
  const [r2, g2, b2] = hexRgb(b);
  return rgbHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/** Escurece puxando para um azul-noite (mais rico que preto puro). */
export function escurecer(hex: string, t: number): string {
  return misturar(hex, '#0b0e1a', t);
}

/** Clareia puxando para um branco-quente. */
export function clarear(hex: string, t: number): string {
  return misturar(hex, '#fff6ec', t);
}

/** rgba() a partir de hex + alfa — para brilhos e vidros. */
export function alfa(hex: string, a: number): string {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Paleta derivada ─────────────────────────────────────────────────

export interface Tinta {
  base: string;
  claro: string;      // realce / luz
  escuro: string;     // sombra
  profundo: string;   // sombra intensa / contorno
}

export function tinta(hex: string): Tinta {
  return {
    base: hex,
    claro: clarear(hex, 0.32),
    escuro: escurecer(hex, 0.28),
    profundo: escurecer(hex, 0.52),
  };
}

export interface Paleta {
  pele: Tinta;
  cabelo: Tinta;
  roupa: Tinta;
  destaque: Tinta;
}

export const CORES_PADRAO: Record<SlotCor, string> = {
  pele: '#e8b58c',
  cabelo: '#3d2b1f',
  roupa: '#2d4a8a',
  destaque: '#7c5cff',
};

export function paletaDe(cores: Partial<Record<SlotCor, string>> | undefined): Paleta {
  const c = cores ?? {};
  return {
    pele: tinta(normalizarHex(c.pele, CORES_PADRAO.pele)),
    cabelo: tinta(normalizarHex(c.cabelo, CORES_PADRAO.cabelo)),
    roupa: tinta(normalizarHex(c.roupa, CORES_PADRAO.roupa)),
    destaque: tinta(normalizarHex(c.destaque, CORES_PADRAO.destaque)),
  };
}
