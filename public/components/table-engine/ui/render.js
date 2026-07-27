import { renderCell } from "./cell-renderers.js";
import { renderSkeleton, renderEmpty, renderError, renderLoadingOverlay, renderNoResults } from "./templates.js";
import * as formatters from "../utils/formatters.js";
const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "table-engine:render";
const RENDER_SVGS = {
  sortAsc: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
  sortDesc: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
  prevPage: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  nextPage: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  clear: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};
function renderTable(state, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const loading = state.get("loading");
  const error = state.get("error");
  const data = state.getFilteredData();
  const columns = state.get("visibleColumns") || state.get("columns") || [];
  const searchQuery = state.get("search");
  if (loading && !data.length) return renderSkeleton(Object.assign({}, opts, { columns }));
  if (error) return renderError(Object.assign({}, opts, { error }));
  if (!data.length) {
    if (searchQuery) return renderNoResults(Object.assign({}, opts, { searchQuery }));
    return renderEmpty(opts);
  }
  const stickyHeader = opts.stickyHeader !== false;
  const stickyFooter = opts.stickyFooter === true;
  const striped = opts.striped !== false;
  const hoverActions = opts.hoverActions !== false;
  return `<div class="${p}table-wrapper ${stickyHeader ? `${p}sticky-header` : ""} ${stickyFooter ? `${p}sticky-footer` : ""}">${loading ? renderLoadingOverlay(opts) : ""}<table class="${p}table ${striped ? `${p}striped` : ""} ${hoverActions ? `${p}hover-actions` : ""}">${renderHeader(columns, state, opts)}${renderBody(data, columns, state, opts)}${opts.showFooter ? renderFooter(data, columns, state, opts) : ""}</table></div>`;
}
function renderHeader(columns, state, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const sort = state.getSort?.() || {};
  const selectable = opts.selectable !== false;
  let cells = "";
  if (selectable) {
    const stateWithMethods = state;
    const allSelected = stateWithMethods.getSelection && stateWithMethods.getFilteredData && stateWithMethods.getSelection().size === stateWithMethods.getFilteredData().length && stateWithMethods.getFilteredData().length > 0;
    cells += `<th class="${p}th ${p}th-checkbox"><input type="checkbox" class="${p}checkbox-all" ${allSelected ? "checked" : ""} /></th>`;
  }
  columns.forEach((col) => {
    const sortable = col.sortable !== false;
    const sortDir = sort.column === col.id ? sort.direction : null;
    const sortIcon = sortDir === "asc" ? RENDER_SVGS.sortAsc : sortDir === "desc" ? RENDER_SVGS.sortDesc : "";
    const resizable = col.resizable !== false;
    const reorderable = col.reorderable !== false;
    const width = col.width ? `style="width: ${col.width}px"` : "";
    cells += `<th class="${p}th ${sortable ? `${p}sortable` : ""} ${sortDir ? `${p}sorted-${sortDir}` : ""}" data-col="${col.id}" ${width}><div class="${p}th-content">${reorderable ? `<span class="${p}th-grip" draggable="true">::</span>` : ""}<span class="${p}th-label" ${sortable ? `data-action="sort" data-sort="${col.id}"` : ""}>${formatters.escapeHtml(col.label || col.id)}</span>${sortIcon ? `<span class="${p}th-sort-icon">${sortIcon}</span>` : ""}${resizable ? `<div class="${p}th-resizer"></div>` : ""}</div></th>`;
  });
  if (opts.hoverActions !== false) cells += `<th class="${p}th ${p}th-actions"></th>`;
  return `<thead class="${p}thead"><tr class="${p}tr-header">${cells}</tr></thead>`;
}
function renderBody(data, columns, state, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const stateEx = state;
  const pagination = stateEx.getPagination?.() || { page: 1, pageSize: 25 };
  const start = (pagination.page - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  const pageData = data.slice(start, end);
  const selection = stateEx.getSelection?.() || /* @__PURE__ */ new Set();
  const expanded = stateEx.getExpanded?.() || /* @__PURE__ */ new Set();
  const selectable = opts.selectable !== false;
  if (!pageData.length) return `<tbody class="${p}tbody"></tbody>`;
  let rows = "";
  pageData.forEach((row, index) => {
    const rowId = String(row.id);
    const isSelected = selection.has(rowId);
    const isExpanded = expanded.has(rowId);
    const isEven = index % 2 === 0;
    let cells = "";
    if (selectable) cells += `<td class="${p}td ${p}td-checkbox"><input type="checkbox" class="${p}checkbox-row" data-id="${rowId}" ${isSelected ? "checked" : ""} /></td>`;
    columns.forEach((col) => {
      const value = row[col.id];
      const cellContent = renderCell(value, col, row, opts);
      cells += `<td class="${p}td ${p}td-${col.type || "text"}" data-col="${col.id}">${cellContent}</td>`;
    });
    if (opts.hoverActions !== false) {
      const actions = opts.rowActions || [{ action: "view", icon: "\u{1F441}", title: "Ver" }, { action: "edit", icon: "\u270F\uFE0F", title: "Editar" }, { action: "delete", icon: "\u{1F5D1}", title: "Excluir", danger: true }];
      cells += `<td class="${p}td ${p}td-hover-actions"><div class="${p}hover-actions">${actions.map((a) => `<button class="${p}hover-btn ${a.danger ? `${p}hover-btn-danger` : ""}" data-action="${a.action}" data-id="${rowId}" title="${a.title}">${a.icon}</button>`).join("")}</div></td>`;
    }
    rows += `<tr class="${p}tr ${isEven ? `${p}tr-even` : `${p}tr-odd`} ${isSelected ? `${p}selected` : ""} ${isExpanded ? `${p}expanded` : ""}" data-row-id="${rowId}" tabindex="0" aria-selected="${isSelected}">${cells}</tr>`;
    if (isExpanded && opts.renderExpansion) {
      const expansionContent = opts.renderExpansion(row, { formatters, cssPrefix: p });
      rows += `<tr class="${p}tr-expansion" data-expand-id="${rowId}"><td colspan="${columns.length + (selectable ? 1 : 0) + (opts.hoverActions !== false ? 1 : 0)}">${expansionContent}</td></tr>`;
    }
  });
  return `<tbody class="${p}tbody">${rows}</tbody>`;
}
function renderFooter(data, columns, state, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const selectable = opts.selectable !== false;
  const totals = opts.footerTotals || {};
  let cells = "";
  if (selectable) cells += `<td class="${p}tf ${p}tf-checkbox"></td>`;
  columns.forEach((col) => {
    let content = "";
    if (totals[col.id] !== void 0) {
      content = renderCell(totals[col.id], col, {}, opts);
    } else if (col.aggregate) {
      const values = data.map((row) => parseFloat(row[col.id]) || 0);
      let aggregated = 0;
      if (col.aggregate === "sum") aggregated = values.reduce((a, b) => a + b, 0);
      else if (col.aggregate === "avg") aggregated = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      else if (col.aggregate === "min") aggregated = Math.min.apply(null, values);
      else if (col.aggregate === "max") aggregated = Math.max.apply(null, values);
      else if (col.aggregate === "count") aggregated = values.length;
      content = renderCell(aggregated, col, {}, opts);
    }
    cells += `<td class="${p}tf ${p}tf-${col.type || "text"}" data-col="${col.id}">${content}</td>`;
  });
  if (opts.hoverActions !== false) cells += `<td class="${p}tf ${p}tf-actions"></td>`;
  return `<tfoot class="${p}tfoot"><tr class="${p}tr-footer">${cells}</tr></tfoot>`;
}
function renderPagination(state, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const pagination = state.getPagination?.() || { page: 1, pageSize: 25, total: 0 };
  const totalPages = Math.ceil(pagination.total / pagination.pageSize) || 1;
  const page = pagination.page;
  const pageSize = pagination.pageSize;
  const total = pagination.total;
  const pageSizes = opts.pageSizes || [10, 25, 50, 100];
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  let pageButtons = "";
  const maxButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);
  if (startPage > 1) {
    pageButtons += `<button class="${p}page-btn" data-action="page" data-page="1">1</button>`;
    if (startPage > 2) pageButtons += `<span class="${p}page-ellipsis">...</span>`;
  }
  for (let i = startPage; i <= endPage; i++) pageButtons += `<button class="${p}page-btn ${i === page ? `${p}page-active` : ""}" data-action="page" data-page="${i}">${i}</button>`;
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pageButtons += `<span class="${p}page-ellipsis">...</span>`;
    pageButtons += `<button class="${p}page-btn" data-action="page" data-page="${totalPages}">${totalPages}</button>`;
  }
  return `<div class="${p}pagination"><div class="${p}pagination-info">Mostrando ${start}\u2013${end} de ${total} registros</div><div class="${p}pagination-controls"><button class="${p}page-btn ${p}page-prev" data-action="page" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>${RENDER_SVGS.prevPage}</button>${pageButtons}<button class="${p}page-btn ${p}page-next" data-action="page" data-page="${page + 1}" ${page >= totalPages ? "disabled" : ""}>${RENDER_SVGS.nextPage}</button></div><div class="${p}pagination-size"><select class="${p}page-size" data-action="page-size">${pageSizes.map((size) => `<option value="${size}" ${size === pageSize ? "selected" : ""}>${size} por p\xE1gina</option>`).join("")}</select></div></div>`;
}
function renderToolbar(state, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const selection = state.getSelection && state.getSelection() || /* @__PURE__ */ new Set();
  const selectionCount = selection.size;
  return `<div class="${p}toolbar"><div class="${p}toolbar-left"><div class="${p}search-wrapper"><input type="text" class="${p}search-input" placeholder="Buscar..." value="${state.get("search") || ""}" /><button class="${p}search-clear" data-action="clear-search">${RENDER_SVGS.clear}</button></div></div><div class="${p}toolbar-center">${selectionCount > 0 ? `<div class="${p}bulk-bar ${p}visible"><span class="${p}bulk-count">${selectionCount} selecionado${selectionCount > 1 ? "s" : ""}</span><button class="${p}bulk-btn" data-action="bulk-export">\u{1F4E4} Exportar</button><button class="${p}bulk-btn ${p}bulk-danger" data-action="bulk-delete">\u{1F5D1} Excluir</button><button class="${p}bulk-btn" data-action="clear-selection">${RENDER_SVGS.clear} Limpar</button></div>` : ""}</div><div class="${p}toolbar-right"><button class="${p}toolbar-btn" data-action="export-csv" title="Exportar CSV">\u{1F4C4}</button><button class="${p}toolbar-btn" data-action="export-excel" title="Exportar Excel">\u{1F4CA}</button><button class="${p}toolbar-btn" data-action="toggle-columns" title="Colunas">\u2699\uFE0F</button><button class="${p}toolbar-btn" data-action="refresh" title="Atualizar">\u{1F504}</button></div></div>`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var render_default = { renderTable, renderHeader, renderBody, renderFooter, renderPagination, renderToolbar, renderSkeleton, renderEmpty, renderError, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  render_default as default,
  healthCheck,
  info,
  renderBody,
  renderFooter,
  renderHeader,
  renderPagination,
  renderTable,
  renderToolbar
};
