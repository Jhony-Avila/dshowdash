// lib/format.ts — formatacao pt-BR compartilhada.
// @version 1.0.0  @created 2026-07-21

/** "2026-07-21 15:11:43" ou ISO -> "21/07/2026 15:11". */
export function fmtData(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v.includes('T') ? v : v.replace(' ', 'T'));
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Valor monetario compacto em pt-BR (R$). */
export function fmtBRL(v?: number | null, currency = 'BRL'): string {
  if (v == null) return '—';
  try {
    return v.toLocaleString('pt-BR', { style: 'currency', currency, maximumFractionDigits: 0 });
  } catch {
    return `${currency} ${Math.round(v).toLocaleString('pt-BR')}`;
  }
}

export function fmtNum(v?: number | null): string {
  return v == null ? '—' : v.toLocaleString('pt-BR');
}
