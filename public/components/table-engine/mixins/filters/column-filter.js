import { getOperatorsForType } from "./engine.js";
const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "table-engine:column-filter";
const CF_SVGS = {
  close: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};
function renderColumnFilterDropdown(column, data, activeFilter, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const operators = getOperatorsForType(column.type);
  const currentOperator = activeFilter && activeFilter.operator || operators[0] && operators[0].id;
  const currentValue = activeFilter && activeFilter.value || "";
  const uniqueValues = getUniqueValues(data, column.id);
  const opsHtml = operators.map((op) => `<option value="${op.id}" ${op.id === currentOperator ? "selected" : ""}>${op.icon} ${op.label}</option>`).join("");
  let quickPickHtml = "";
  if (uniqueValues.length <= 20) {
    quickPickHtml = `<div class="${p}filter-quickpick-section"><label class="${p}filter-label">Sele\xE7\xE3o r\xE1pida:</label><div class="${p}filter-quickpick-list">${uniqueValues.map((v) => `<label class="${p}filter-quickpick-item"><input type="checkbox" value="${v}" ${currentValue === v ? "checked" : ""} /><span>${v || "(vazio)"}</span></label>`).join("")}</div></div>`;
  }
  return `<div class="${p}column-filter-dropdown" data-col="${column.id}"><div class="${p}filter-dropdown-header"><span class="${p}filter-dropdown-title">Filtrar: ${column.label || column.id}</span><button class="${p}filter-dropdown-close" data-action="close-filter">${CF_SVGS.close}</button></div><div class="${p}filter-dropdown-body"><div class="${p}filter-operator-section"><label class="${p}filter-label">Condi\xE7\xE3o:</label><select class="${p}filter-operator-select" data-col="${column.id}">${opsHtml}</select></div><div class="${p}filter-value-section"><label class="${p}filter-label">Valor:</label>${renderValueInput(column, currentValue, opts)}</div>${quickPickHtml}</div><div class="${p}filter-dropdown-footer"><button class="${p}filter-btn ${p}filter-btn-clear" data-action="clear-column-filter" data-col="${column.id}">Limpar</button><button class="${p}filter-btn ${p}filter-btn-apply" data-action="apply-column-filter" data-col="${column.id}">Aplicar</button></div></div>`;
}
function renderValueInput(column, value, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const type = column.type || "text";
  if (["date", "datetime"].indexOf(type) >= 0) return `<input type="date" class="${p}filter-value-input" value="${value}" />`;
  if (["number", "currency", "percent"].indexOf(type) >= 0) return `<input type="number" class="${p}filter-value-input" value="${value}" step="any" />`;
  return `<input type="text" class="${p}filter-value-input" value="${value}" placeholder="Digite o valor..." />`;
}
function getUniqueValues(data, columnId) {
  const values = /* @__PURE__ */ new Set();
  data.forEach((row) => {
    const val = row[columnId];
    if (val != null) values.add(String(val));
  });
  return Array.from(values).sort();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var column_filter_default = { renderColumnFilterDropdown, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  column_filter_default as default,
  healthCheck,
  info,
  renderColumnFilterDropdown
};
