// panel-bling/src/lib/ausencia.ts — "ausência ≠ zero" (pacote B do Bling, decisão do Jhony, 24/11/2026)
//
// Valor desconhecido chega da API como null (subtotal, custo, itens, margem, totais).
// Regras únicas para todas as telas do painel:
//   - null aparece como "—" (os formatadores de _shared-react/lib/formato e fmtValor já fazem isso);
//   - soma/média com QUALQUER parcela desconhecida é desconhecida (nunca soma parcial, nunca 0);
//   - margem/lucro sem custo conhecido é desconhecida (nunca calculada com custo 0);
//   - ponto null numa série é lacuna (ver viz/Echarts.tsx: acumularSerie, connectNulls:false).
// NUNCA usar `?? 0` / `|| 0` em campo que pode ser desconhecido.

import type { Kpi } from '@shared';

/** true quando o valor é desconhecido (null/undefined/NaN/±Infinity/'' ). */
export function desconhecido(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return true;
  const n = typeof v === 'number' ? v : Number(v);
  return !Number.isFinite(n);
}

/** Número ou null — sem transformar ausência em zero. */
export function numOuNulo(v: unknown): number | null {
  return desconhecido(v) ? null : Number(v);
}

/** Soma que respeita a ausência: qualquer parcela null → null. Lista vazia → 0 (nada a somar é zero legítimo). */
export function somaOuNulo(vals: unknown[]): number | null {
  let s = 0;
  for (const v of vals) {
    if (desconhecido(v)) return null;
    s += Number(v);
  }
  return Math.round(s * 100) / 100;
}

/** Média que respeita a ausência: qualquer parcela null → null; lista vazia → null (média de nada não existe). */
export function mediaOuNulo(vals: unknown[]): number | null {
  if (vals.length === 0) return null;
  const s = somaOuNulo(vals);
  return s === null ? null : s / vals.length;
}

/** Margem % = (receita − custo) ÷ receita. Custo ou receita desconhecidos, ou receita ≤ 0 → null. */
export function margemOuNulo(receita: unknown, custo: unknown): number | null {
  const r = numOuNulo(receita), c = numOuNulo(custo);
  if (r === null || c === null || r <= 0) return null;
  return Math.round(((r - c) / r) * 1000) / 10;
}

export const TOOLTIP_DESCONHECIDO =
  'Valor desconhecido: há pedidos cujo custo ou itens ainda não foram lidos do Bling. Não é zero.';

/**
 * KPI da API → KPI da tela.
 * DSHOW-012: null com a FONTE fora do ar = "Indisponível".
 * Pacote B: null com a fonte no ar (estado 'ok' ou sem estado declarado) = valor DESCONHECIDO = "—".
 */
export function kpiDaApi(k: Record<string, any>): Kpi {
  const estado = k?.disponibilidade?.estado as string | undefined;
  const foraDoAr = estado !== undefined && estado !== 'ok';
  const nulo = desconhecido(k.valor);
  return {
    ...(k as Kpi),
    valor: nulo ? null : Number(k.valor),
    variacao: nulo || desconhecido(k.variacao) ? null : Number(k.variacao),
    rotuloNulo: nulo && !foraDoAr ? '—' : undefined,
    tooltip: nulo && !foraDoAr ? (k.tooltip || TOOLTIP_DESCONHECIDO) : k.tooltip,
  };
}
