// lib/format.ts — helpers de formatação (moeda BRL, números, percentuais).
// @version 1.0.0  @created 2026-07-21
import type { Unit } from '../shell/types';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const BRL0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const NUM = new Intl.NumberFormat('pt-BR');
const DEC = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Moeda BRL (R$ 1.234,56). Compacta acima de 100 mil (R$ 1,2 mi). */
export function moeda(v: number, compact = false): string {
  if (compact && Math.abs(v) >= 100_000) return 'R$ ' + compacto(v);
  return BRL.format(v || 0);
}
export function moeda0(v: number): string { return BRL0.format(v || 0); }

/** Inteiro com separador de milhar. */
export function inteiro(v: number): string { return NUM.format(Math.round(v || 0)); }

/** Número compacto (12,3 mil / 1,2 mi). */
export function compacto(v: number): string {
  const n = v || 0;
  if (Math.abs(n) >= 1_000_000) return DEC.format(n / 1_000_000) + ' mi';
  if (Math.abs(n) >= 1_000) return DEC.format(n / 1_000) + ' mil';
  return NUM.format(Math.round(n));
}

/** Percentual a partir de fração (0.083 -> "8,3%"). */
export function pct(fr: number, casas = 1): string {
  return (fr * 100).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + '%';
}

/** Percentual de variação com sinal (+12,4% / −8,1%). */
export function pctVar(fr: number): string {
  const s = fr > 0 ? '+' : (fr < 0 ? '−' : '');
  return s + Math.abs(fr * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
}

export function decimal(v: number, casas = 1): string {
  return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function razao(v: number): string {
  return (v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '×';
}

/** Formata um valor conforme sua unidade (§7.2). */
export function formatarValor(v: number, unit: Unit, compact = false): string {
  switch (unit) {
    case 'currency': return moeda(v, compact);
    case 'int': return compact ? compacto(v) : inteiro(v);
    case 'pct': return pct(v);
    case 'ratio': return razao(v);
    case 'decimal': return decimal(v);
    default: return String(v);
  }
}

/** Data curta pt-BR (12 mar) ou completa. */
export function dataCurta(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function dataHora(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** Cor determinística (HSL) a partir de uma string — avatares/contas. */
export function corDeterministica(s?: string | null): string {
  const base = s || 'x';
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) % 360;
  return `hsl(${h} 52% 45%)`;
}
