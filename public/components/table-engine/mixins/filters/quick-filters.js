const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "table-engine:quick-filters";
const QF_SVGS = {
  check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  clear: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};
function renderQuickFilters(quickFilters, activeFilterIds, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  if (!quickFilters || quickFilters.length === 0) return "";
  const chipsHtml = quickFilters.map((qf) => {
    const isActive = activeFilterIds.indexOf(qf.id) >= 0;
    return `<button class="${p}quick-filter-chip ${isActive ? `${p}chip-active` : ""}" data-quick-filter="${qf.id}" title="${qf.description || qf.label}">${qf.icon ? `<span class="${p}chip-icon">${qf.icon}</span>` : ""}<span class="${p}chip-label">${qf.label}</span>${qf.count !== void 0 ? `<span class="${p}chip-count">${qf.count}</span>` : ""}</button>`;
  }).join("");
  return `<div class="${p}quick-filters"><span class="${p}quick-filters-label">Filtros r\xE1pidos:</span><div class="${p}quick-filters-chips">${chipsHtml}</div>${activeFilterIds.length > 0 ? `<button class="${p}quick-filters-clear" data-action="clear-quick-filters" title="Limpar todos">${QF_SVGS.clear} Limpar</button>` : ""}</div>`;
}
const COMMON_QUICK_FILTERS = {
  status: [
    { id: "active", label: "Ativos", icon: QF_SVGS.check, filters: [{ column: "status", operator: "equals", value: "ativo" }] },
    { id: "inactive", label: "Inativos", icon: QF_SVGS.x, filters: [{ column: "status", operator: "equals", value: "inativo" }] },
    { id: "pending", label: "Pendentes", icon: "\u23F3", filters: [{ column: "status", operator: "equals", value: "pendente" }] }
  ],
  date: [
    { id: "today", label: "Hoje", icon: "\u{1F4C5}", filters: [{ column: "data", operator: "today" }] },
    { id: "this_week", label: "Esta semana", icon: "\u{1F4C5}", filters: [{ column: "data", operator: "this_week" }] },
    { id: "this_month", label: "Este m\xEAs", icon: "\u{1F4C5}", filters: [{ column: "data", operator: "this_month" }] }
  ],
  value: [
    { id: "high_value", label: "Alto valor", icon: "\u{1F4B0}", filters: [{ column: "valor", operator: "gte", value: 1e4 }] },
    { id: "low_value", label: "Baixo valor", icon: "\u{1F4B5}", filters: [{ column: "valor", operator: "lt", value: 1e3 }] }
  ]
};
function createQuickFilter(id, label, filters, options) {
  const opts = options || {};
  return { id, label, filters, icon: opts.icon || null, description: opts.description || null, count: opts.count };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, commonFilters: Object.keys(COMMON_QUICK_FILTERS) };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var quick_filters_default = { renderQuickFilters, COMMON_QUICK_FILTERS, createQuickFilter, info, healthCheck, VERSION, MODULE_ID };
export {
  COMMON_QUICK_FILTERS,
  MODULE_ID,
  VERSION,
  createQuickFilter,
  quick_filters_default as default,
  healthCheck,
  info,
  renderQuickFilters
};
