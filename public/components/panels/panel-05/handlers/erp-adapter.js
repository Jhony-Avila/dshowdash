const VERSION = "9.3.2-P2-ENTERPRISE";
const MODULE_ID = "panel-05:handlers:erp-adapter";
const num = (v) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};
const arr = (v) => Array.isArray(v) ? v : [];
const STAGE_ID = { leads: "prospecto", orcamentos: "proposta", "em negociacao": "negociacao", "em negocia\xE7\xE3o": "negociacao", ganhos: "ganho", perdidos: "perdido" };
function adaptCharts(response) {
  const charts = response.charts || null;
  const receitaMensal = arr(charts?.receita_mensal).map((m) => ({ mes: String(m.mes_label ?? m.mes ?? ""), valor: num(m.receita) }));
  const topClientes = arr(response.topClientes).map((c) => ({ id: c.Id_Organizacao ?? c.id, nome: String(c.Nome_Empresa ?? c.nome ?? ""), receita: num(c.total_receita ?? c.receita) }));
  const porUF = (arr(response.heatmap).length ? arr(response.heatmap) : arr(charts?.por_uf)).map((h) => ({ uf: String(h.uf ?? "N/D"), valor: num(h.receita ?? h.clientes) }));
  const vendedores = arr(response.vendedores).map((v) => ({ nome: String(v.vendedor ?? v.nome ?? ""), receita: num(v.receita), ganhos: num(v.ganhos), conversao: num(v.taxa_conversao ?? v.conversao), ticketMedio: num(v.ticket_medio ?? v.ticketMedio), clientes: num(v.clientes) }));
  if (!receitaMensal.length && !topClientes.length && !porUF.length && !vendedores.length) return null;
  return { receitaMensal, topClientes, porUF, vendedores };
}
function adaptFunil(response) {
  const funil = response.funil || null;
  const etapas = arr(funil?.etapas);
  const first = etapas.length ? num(etapas[0].valor) : 0;
  const stages = etapas.map((e) => {
    const nome = String(e.nome ?? "");
    const quantidade = num(e.valor);
    return { id: STAGE_ID[nome.toLowerCase()] || "prospecto", nome, quantidade, valor: 0, conversao: first > 0 ? quantidade / first * 100 : 0 };
  });
  const motivos = arr(funil?.motivos_perda);
  const totalMotivos = motivos.reduce((s, m) => s + num(m.qtd ?? m.quantidade), 0);
  const motivosPerda = motivos.map((m) => {
    const q = num(m.qtd ?? m.quantidade);
    return { motivo: String(m.motivo ?? "N\xE3o informado"), quantidade: q, percentual: num(m.percentual) || (totalMotivos > 0 ? q / totalMotivos * 100 : 0) };
  });
  const metrics = response.metrics || {};
  const comparativo = response.comparativo || {};
  const crescimento = num((arr(comparativo.metricas)[0] || {}).variacao);
  const kpis = response.kpis || {};
  const receitaTotal = num(kpis.receita_total ?? kpis.receita);
  const rankingItems = arr((response.ranking || {}).items);
  const top10 = rankingItems.reduce((s, r) => s + num(r.valor), 0);
  const receitaMensal = arr((response.charts || {}).receita_mensal);
  const melhor = receitaMensal.reduce((best, m) => !best || num(m.receita) > num(best.receita) ? m : best, null);
  const metricas = {
    ltv: num(metrics.ltv_medio ?? metrics.ltv),
    tempoConversao: Math.round(num(metrics.tempo_medio_conversao ?? metrics.tempoConversao)),
    taxaRetencao: num(metrics.taxa_retencao ?? metrics.taxaRetencao),
    clientesRetidos: num(metrics.clientes_retidos ?? metrics.clientesRetidos),
    crescimento,
    concentracaoTop10: receitaTotal > 0 ? top10 / receitaTotal * 100 : 0,
    melhorMes: melhor ? { nome: String(melhor.mes_label ?? melhor.mes ?? ""), valor: num(melhor.receita) } : null
  };
  if (!stages.length && !motivosPerda.length && !Object.keys(metrics).length) return null;
  return { stages, motivosPerda, metricas };
}
function adaptChurn(response) {
  const churn = response.churn;
  const lista = Array.isArray(churn) ? arr(churn) : arr(churn?.clientes);
  if (!lista.length) return null;
  return lista.map((c) => ({ ...c, risco: num(c.risco_score ?? c.risco), nivel: String(c.nivel ?? "baixo"), fatores: arr(c.fatores) }));
}
function adaptAll(response) {
  return { charts: adaptCharts(response), funil: adaptFunil(response), churn: adaptChurn(response) };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { adapterReady: true } };
}
var erp_adapter_default = { adaptCharts, adaptFunil, adaptChurn, adaptAll, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  adaptAll,
  adaptCharts,
  adaptChurn,
  adaptFunil,
  erp_adapter_default as default,
  healthCheck,
  info
};
