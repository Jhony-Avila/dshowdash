const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:renderer:kpis";
function formatCurrency(v) {
  if (v == null || isNaN(Number(v))) return "\u2014";
  const n = Number(v);
  if (n >= 1e6) return `R$ ${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `R$ ${(n / 1e3).toFixed(1)}K`;
  return `R$ ${n.toFixed(2)}`;
}
function formatNumber(v) {
  if (v == null || isNaN(Number(v))) return "\u2014";
  const n = Number(v);
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
function formatPercent(v) {
  if (v == null || isNaN(Number(v))) return "\u2014";
  return `${Number(v).toFixed(1)}%`;
}
function updateKPIs(refs, data) {
  if (!refs || !data) return;
  const pick = (...keys) => {
    for (const k of keys) {
      if (data[k] !== void 0 && data[k] !== null) return data[k];
    }
    return void 0;
  };
  const updates = [
    { ref: refs.kpiReceita, value: formatCurrency(pick("receita", "receita_total")) },
    { ref: refs.kpiClientes, value: formatNumber(pick("clientes", "clientes_ativos")) },
    { ref: refs.kpiConversao, value: formatPercent(pick("conversao", "taxa_conversao")) },
    { ref: refs.kpiOrcamentos, value: formatNumber(pick("orcamentos", "orcamentos_total")) },
    { ref: refs.kpiAReceber, value: formatCurrency(pick("aReceber", "a_receber_aberto")) },
    { ref: refs.kpiContatos, value: formatNumber(pick("contatos", "contatos_ativos")) },
    { ref: refs.kpiCidades, value: formatNumber(pick("cidades")) }
  ];
  updates.forEach(({ ref, value }) => {
    const el = ref;
    if (el && el.textContent !== value) {
      el.textContent = value;
    }
  });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { kpisReady: true } };
}
var kpis_default = { updateKPIs, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  kpis_default as default,
  healthCheck,
  info,
  updateKPIs
};
