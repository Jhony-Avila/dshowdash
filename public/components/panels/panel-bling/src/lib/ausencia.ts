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

/** Motivo de indisponibilidade das análises (campo `indisponivel` da API, ACIMA_DIREITA 24/11). */
export type MotivoIndisponivel = 'itens_desconhecidos' | 'custo_desconhecido' | 'valores_desconhecidos';
export const TEXTO_INDISPONIVEL: Record<MotivoIndisponivel, string> = {
  itens_desconhecidos: 'O detalhe dos pedidos ainda não foi lido do Bling: itens, subtotal, desconto, frete, custo e margem aparecem como "—" (não é zero).',
  custo_desconhecido: 'O custo dos produtos vendidos não vem nos pedidos do Bling: custo, lucro e margem aparecem como "—" e não são calculados.',
  valores_desconhecidos: 'Parte das ligações do fluxo tem valor desconhecido (desconto, frete ou comissão ainda não lidos): elas não são desenhadas e não são zero.',
};
export const motivoIndisponivel = (v: unknown): MotivoIndisponivel | null =>
  v === 'itens_desconhecidos' || v === 'custo_desconhecido' || v === 'valores_desconhecidos' ? v : null;

export const TOOLTIP_DESCONHECIDO =
  'Valor desconhecido: há pedidos cujo custo ou itens ainda não foram lidos do Bling. Não é zero.';

/**
 * KPI da API → KPI da tela.
 * DSHOW-012: a FONTE sem dados / incompleta / desativada (estados 'sem_dados', 'incompleto', fonte_desativada) = "Indisponível".
 * Pacote B: valor DESCONHECIDO com a fonte no ar ('ok', 'indisponivel' com motivo de dado, ou sem estado) = "—",
 * com o motivo no tooltip ("Indisponível: <motivo>", como a API manda). Nunca zero.
 */
export function kpiDaApi(k: Record<string, any>): Kpi {
  const disp = k?.disponibilidade ?? null;
  const estado = disp?.estado as string | undefined;
  const foraDoAr = estado === 'sem_dados' || estado === 'incompleto' || disp?.fonte_desativada === true;
  const nulo = desconhecido(k.valor);
  return {
    ...(k as Kpi),
    valor: nulo ? null : Number(k.valor),
    variacao: nulo || desconhecido(k.variacao) ? null : Number(k.variacao),
    rotuloNulo: nulo && !foraDoAr ? '—' : undefined,
    tooltip: nulo && !foraDoAr ? (k.tooltip || TOOLTIP_DESCONHECIDO) : k.tooltip,
  };
}
