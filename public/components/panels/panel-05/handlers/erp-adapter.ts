// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.3.2-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05/handlers/erp-adapter
// PURPOSE: Adapta o payload da API (api/modules/panels/panel-05/api.php) para o shape que os renderers de
//          gráficos/funil/churn esperam (ui/charts.ts, ui/funil.ts, ui/advanced.ts, render/sections.ts).
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
// PROVIDES: adaptCharts(), adaptFunil(), adaptChurn(), adaptAll()
//
// HISTÓRICO:
//   2026-09-16 (backlog do painel 05): a API sempre devolveu receita_mensal/por_uf/etapas/por_mes/{clientes,stats}…
//   e os renderers liam receitaMensal/porUF/stages/motivosPerda/metricas/[].risco — gráficos, funil e churn nunca
//   renderizaram. Um único ponto de tradução, chamado em handlers/data.ts antes de gravar no store.
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.2-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:handlers:erp-adapter';

type Row = Record<string, unknown>;
const num = (v: unknown): number => { const n = typeof v === 'number' ? v : parseFloat(String(v ?? '')); return Number.isFinite(n) ? n : 0; };
const arr = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);

// etapa da API → id de cor do funil (ui/funil.ts STAGE_COLORS)
const STAGE_ID: Record<string, string> = { leads: 'prospecto', orcamentos: 'proposta', 'em negociacao': 'negociacao', 'em negociação': 'negociacao', ganhos: 'ganho', perdidos: 'perdido' };

/** charts: { receitaMensal[{mes,valor}], topClientes[{id,nome,receita}], porUF[{uf,valor}], vendedores[{nome,receita,ganhos,conversao,ticketMedio,clientes}] } */
export function adaptCharts(response: Row): Row | null {
  const charts = (response.charts as Row) || null;
  const receitaMensal = arr(charts?.receita_mensal).map((m) => ({ mes: String(m.mes_label ?? m.mes ?? ''), valor: num(m.receita) }));
  const topClientes = arr(response.topClientes).map((c) => ({ id: c.Id_Organizacao ?? c.id, nome: String(c.Nome_Empresa ?? c.nome ?? ''), receita: num(c.total_receita ?? c.receita) }));
  // "Receita por UF": o heatmap traz receita por UF; charts.por_uf só traz contagem de clientes
  const porUF = (arr(response.heatmap).length ? arr(response.heatmap) : arr(charts?.por_uf)).map((h) => ({ uf: String(h.uf ?? 'N/D'), valor: num(h.receita ?? h.clientes) }));
  const vendedores = arr(response.vendedores).map((v) => ({ nome: String(v.vendedor ?? v.nome ?? ''), receita: num(v.receita), ganhos: num(v.ganhos), conversao: num(v.taxa_conversao ?? v.conversao), ticketMedio: num(v.ticket_medio ?? v.ticketMedio), clientes: num(v.clientes) }));
  if (!receitaMensal.length && !topClientes.length && !porUF.length && !vendedores.length) return null;
  return { receitaMensal, topClientes, porUF, vendedores };
}

/** funil: { stages[{id,nome,quantidade,valor,conversao}], motivosPerda[{motivo,quantidade,percentual}], metricas{ltv,tempoConversao,taxaRetencao,clientesRetidos,crescimento,concentracaoTop10,melhorMes} } */
export function adaptFunil(response: Row): Row | null {
  const funil = (response.funil as Row) || null;
  const etapas = arr(funil?.etapas);
  const first = etapas.length ? num(etapas[0].valor) : 0;
  const stages = etapas.map((e) => { const nome = String(e.nome ?? ''); const quantidade = num(e.valor); return { id: STAGE_ID[nome.toLowerCase()] || 'prospecto', nome, quantidade, valor: 0, conversao: first > 0 ? (quantidade / first) * 100 : 0 }; });
  const motivos = arr(funil?.motivos_perda);
  const totalMotivos = motivos.reduce((s, m) => s + num(m.qtd ?? m.quantidade), 0);
  const motivosPerda = motivos.map((m) => { const q = num(m.qtd ?? m.quantidade); return { motivo: String(m.motivo ?? 'Não informado'), quantidade: q, percentual: num(m.percentual) || (totalMotivos > 0 ? (q / totalMotivos) * 100 : 0) }; });
  const metrics = (response.metrics as Row) || {};
  const comparativo = (response.comparativo as Row) || {};
  const crescimento = num((arr(comparativo.metricas)[0] || {}).variacao);
  const kpis = (response.kpis as Row) || {};
  const receitaTotal = num(kpis.receita_total ?? kpis.receita);
  const rankingItems = arr(((response.ranking as Row) || {}).items);
  const top10 = rankingItems.reduce((s, r) => s + num(r.valor), 0);
  const receitaMensal = arr(((response.charts as Row) || {}).receita_mensal);
  const melhor = receitaMensal.reduce<Row | null>((best, m) => (!best || num(m.receita) > num(best.receita) ? m : best), null);
  const metricas = {
    ltv: num(metrics.ltv_medio ?? metrics.ltv),
    tempoConversao: Math.round(num(metrics.tempo_medio_conversao ?? metrics.tempoConversao)),
    taxaRetencao: num(metrics.taxa_retencao ?? metrics.taxaRetencao),
    clientesRetidos: num(metrics.clientes_retidos ?? metrics.clientesRetidos),
    crescimento,
    concentracaoTop10: receitaTotal > 0 ? (top10 / receitaTotal) * 100 : 0,
    melhorMes: melhor ? { nome: String(melhor.mes_label ?? melhor.mes ?? ''), valor: num(melhor.receita) } : null,
  };
  if (!stages.length && !motivosPerda.length && !Object.keys(metrics).length) return null;
  return { stages, motivosPerda, metricas };
}

/** churn: [{id,nome,cidade,uf,receita,risco(0-100),nivel,fatores[]}] */
export function adaptChurn(response: Row): Row[] | null {
  const churn = response.churn;
  const lista = Array.isArray(churn) ? arr(churn) : arr((churn as Row)?.clientes);
  if (!lista.length) return null;
  return lista.map((c) => ({ ...c, risco: num(c.risco_score ?? c.risco), nivel: String(c.nivel ?? 'baixo'), fatores: arr(c.fatores) as unknown as string[] }));
}

export function adaptAll(response: Row): { charts: Row | null; funil: Row | null; churn: Row[] | null } {
  return { charts: adaptCharts(response), funil: adaptFunil(response), churn: adaptChurn(response) };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { adapterReady: true } }; }
export default { adaptCharts, adaptFunil, adaptChurn, adaptAll, info, healthCheck, VERSION, MODULE_ID };
