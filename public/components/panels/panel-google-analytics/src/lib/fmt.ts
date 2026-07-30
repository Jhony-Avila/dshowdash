// lib/fmt.ts — formatação pt-BR.
// @version 1.0.0  @created 2026-07-30
//
// ⚠️ `Intl` NATIVO, de propósito. `date-fns` não está instalado e instalar mexe no
// `package.json` da RAIZ, que afeta o build de todos os painéis do dashboard. O módulo
// Google Calendar tomou a mesma decisão semana passada.
import type { Unidade } from '../shell/types';

const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function fmtInt(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return nf0.format(v);
}

export function fmtPct(v: number | null | undefined, casas = 2): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${(casas === 1 ? nf1 : nf2).format(v)}%`;
}

export function fmtMoeda(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return brl.format(v);
}

/** Duração legível. 214 → "3m 34s". */
export function fmtSegundos(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const s = Math.round(v);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r === 0 ? `${m}m` : `${m}m ${r}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

/** Formata pela UNIDADE declarada — nunca por adivinhação a partir do valor. */
export function fmtValor(v: number | null | undefined, u: Unidade): string {
  switch (u) {
    case 'currency': return fmtMoeda(v);
    case 'pct': return fmtPct(v);
    case 'decimal': return v === null || v === undefined ? '—' : nf2.format(v);
    case 'seg': return fmtSegundos(v);
    default: return fmtInt(v);
  }
}

/** Compacto para eixo de gráfico: 45698 → "45,7 mil". */
export function fmtCompacto(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${nf1.format(v / 1_000_000)} mi`;
  if (Math.abs(v) >= 1_000) return `${nf1.format(v / 1_000)} mil`;
  return nf0.format(v);
}

export function fmtVariacao(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const s = v > 0 ? '+' : '';
  return `${s}${nf1.format(v)}%`;
}

/** "2026-07-30" → "30/jul". */
export function fmtDiaCurto(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || !d) return iso;
  const dt = new Date(Date.UTC(a, m - 1, d));
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).replace('.', '');
}

/** ISO → "há 4 minutos". Usado no rodapé de procedência (§12, §69.4). */
export function fmtDesde(iso: string | undefined): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const seg = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (seg < 60) return 'agora';
  const min = Math.round(seg / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.round(h / 24)}d`;
}

/**
 * A variação é BOA ou RUIM?
 *
 * ⚠️ §15.3 do briefing: crescer não é automaticamente positivo. Aumento de abandono, de
 * eventos duplicados ou de tempo de carregamento é ruim. Quem sabe o sentido da métrica é
 * quem a produziu — por isso `maiorMelhor` vem do backend e o default é `true` só porque a
 * maioria das métricas de volume é assim.
 */
export function sentidoVariacao(
  variacao: number | null | undefined,
  maiorMelhor: boolean | undefined,
): 'bom' | 'ruim' | 'neutro' {
  if (variacao === null || variacao === undefined || Math.abs(variacao) < 0.05) return 'neutro';
  const bom = maiorMelhor === false ? variacao < 0 : variacao > 0;
  return bom ? 'bom' : 'ruim';
}
