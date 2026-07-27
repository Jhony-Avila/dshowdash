const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "table-engine:card-view";
const CARD_SVGS = {
  chevronUp: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
  chevronDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};
function renderCardView(data, columns, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const selection = opts.selection || /* @__PURE__ */ new Set();
  const expanded = opts.expanded || /* @__PURE__ */ new Set();
  if (!data.length) return `<div class="${p}cards-empty">Nenhum registro encontrado</div>`;
  const cards = data.map((row) => {
    const rowId = String(row.id);
    const isSelected = selection.has(rowId);
    const isExpanded = expanded.has(rowId);
    const primaryCol = columns.find((c) => c.primary) || columns[0];
    const secondaryCol = columns.find((c) => c.secondary) || columns[1];
    const fieldsHtml = columns.filter((c) => !c.primary && !c.secondary && c.showInCard !== false).map((col) => `<div class="${p}card-field"><span class="${p}card-label">${col.label || col.id}</span><span class="${p}card-value">${formatValue(row[col.id], col)}</span></div>`).join("");
    const actionsHtml = (opts.rowActions || []).map((action) => `<button class="${p}card-action ${action.danger ? `${p}action-danger` : ""}" data-action="${action.action}" data-id="${rowId}" title="${action.title}">${action.icon} ${action.label || ""}</button>`).join("");
    return `<div class="${p}card ${isSelected ? `${p}card-selected` : ""} ${isExpanded ? `${p}card-expanded` : ""}" data-row-id="${rowId}" tabindex="0"><div class="${p}card-header"><input type="checkbox" class="${p}card-checkbox" data-id="${rowId}" ${isSelected ? "checked" : ""} /><div class="${p}card-title"><span class="${p}card-primary">${formatValue(row[primaryCol && primaryCol.id], primaryCol)}</span>${secondaryCol ? `<span class="${p}card-secondary">${formatValue(row[secondaryCol && secondaryCol.id], secondaryCol)}</span>` : ""}</div><button class="${p}card-expand" data-action="toggle-card" data-id="${rowId}">${isExpanded ? CARD_SVGS.chevronUp : CARD_SVGS.chevronDown}</button></div><div class="${p}card-body ${isExpanded ? `${p}visible` : ""}">${fieldsHtml}</div><div class="${p}card-actions">${actionsHtml}</div></div>`;
  }).join("");
  return `<div class="${p}cards-container">${cards}</div>`;
}
function formatValue(value, column) {
  if (value == null || value === "") return "\u2014";
  const type = column && column.type || "text";
  if (type === "currency") return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  if (type === "date") return new Date(value).toLocaleDateString("pt-BR");
  if (type === "boolean") return value ? CARD_SVGS.check : CARD_SVGS.x;
  if (type === "status") return `<span class="status-${value}">${value}</span>`;
  return escapeHtml(String(value));
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function renderViewToggle(currentView, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  return `<div class="${p}view-toggle"><button class="${p}view-btn ${currentView === "table" ? `${p}active` : ""}" data-action="set-view" data-view="table" title="Visualiza\xE7\xE3o em tabela">\u2630</button><button class="${p}view-btn ${currentView === "card" ? `${p}active` : ""}" data-action="set-view" data-view="card" title="Visualiza\xE7\xE3o em cards">\u25A6</button></div>`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var card_view_default = { renderCardView, renderViewToggle, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  card_view_default as default,
  healthCheck,
  info,
  renderCardView,
  renderViewToggle
};
