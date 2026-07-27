import { COLUMN_TYPES } from "./constants.js";
function getActiveFiltersCount(filters) {
  return Object.entries(filters).filter(([k, v]) => v && v.length > 0 && k !== "search").length;
}
function getActiveFilters(filters, clientSearchTerm) {
  const active = [];
  if (filters.status) active.push({ key: "status", label: "Status", value: filters.status });
  if (filters.tipo) active.push({ key: "tipo", label: "Tipo", value: filters.tipo });
  if (filters.uf) active.push({ key: "uf", label: "UF", value: filters.uf });
  if (filters.risco) active.push({ key: "risco", label: "Risco", value: filters.risco });
  if (filters.temPix) active.push({ key: "temPix", label: "PIX", value: filters.temPix === "1" ? "Sim" : "N\xE3o" });
  if (filters.valorMin) active.push({ key: "valorMin", label: "Valor \u2265", value: `R$ ${filters.valorMin}` });
  if (filters.valorMax) active.push({ key: "valorMax", label: "Valor \u2264", value: `R$ ${filters.valorMax}` });
  if (clientSearchTerm) active.push({ key: "clientSearch", label: "Busca local", value: clientSearchTerm });
  return active;
}
function applyClientFilters(data, clientSearchTerm, filters) {
  if (!data || data.length === 0) return data;
  let filtered = [...data];
  if (clientSearchTerm && clientSearchTerm.length >= 2) {
    const term = clientSearchTerm.toLowerCase().trim();
    const searchableCols = Object.entries(COLUMN_TYPES).filter(([k, v]) => v.searchable).map(([k]) => k);
    filtered = filtered.filter((item) => searchableCols.some((col) => {
      const val = item[col] || item[col === "cnpj" ? "cpf" : col];
      return val && String(val).toLowerCase().includes(term);
    }));
  }
  if (filters.valorMinClient) {
    const min = parseFloat(filters.valorMinClient);
    if (!isNaN(min)) filtered = filtered.filter((item) => (parseFloat(item.total_pago) || 0) >= min);
  }
  if (filters.valorMaxClient) {
    const max = parseFloat(filters.valorMaxClient);
    if (!isNaN(max)) filtered = filtered.filter((item) => (parseFloat(item.total_pago) || 0) <= max);
  }
  if (filters.reqMinClient) {
    const min = parseInt(filters.reqMinClient);
    if (!isNaN(min)) filtered = filtered.filter((item) => (parseInt(item.qtd_requisicoes) || 0) >= min);
  }
  if (filters.reqMaxClient) {
    const max = parseInt(filters.reqMaxClient);
    if (!isNaN(max)) filtered = filtered.filter((item) => (parseInt(item.qtd_requisicoes) || 0) <= max);
  }
  return filtered;
}
var filters_default = { getActiveFiltersCount, getActiveFilters, applyClientFilters };
const MODULE_ID = "panels-panel-16-ui-filters";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { filtersReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  applyClientFilters,
  filters_default as default,
  getActiveFilters,
  getActiveFiltersCount,
  healthCheck,
  info
};
