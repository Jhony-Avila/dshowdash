import { renderControls } from "./controls.js";
import { renderQuickStats, renderKPIs, renderDistributions, renderLoading } from "./kpis.js";
import { renderFilterChips, renderFilters } from "./filterbar.js";
import { renderTable, renderEmpty } from "./table.js";
import { renderPagination } from "./pagination.js";
import { renderDetailPanel, renderBulkActions, renderAdvancedFiltersModal, renderExportProgress, renderKeyboardHint } from "./modals.js";
import { getActiveFiltersCount } from "../filters.js";
function renderMain(state, displayData) {
  const { selectedFornecedor, viewMode, isLoading, selectedRows, showAdvancedFilters, isExporting, focusedRowIndex, useInfiniteScroll, clientSearchTerm, sortColumns, favorites } = state;
  const filters = state.filters;
  const data = state.data;
  const dataKpis = data.kpis;
  const dataList = data.list;
  const dataPagination = data.pagination;
  const selectedRowsSet = selectedRows;
  const hasDetail = selectedFornecedor;
  const compactClass = viewMode === "compact" ? "p16-compact" : "";
  const hasFilters = getActiveFiltersCount(filters) > 0 || filters.search || clientSearchTerm;
  return `
    <div class="p16-layout ${hasDetail ? "p16-with-detail" : ""} ${compactClass}" role="application" aria-label="Painel de Fornecedores 360\xBA">
      <div class="p16-main ${isLoading ? "p16-loading-overlay" : ""}">
        ${renderFilterChips(filters, sortColumns, clientSearchTerm)}
        ${selectedRowsSet.size > 0 ? renderBulkActions(selectedRowsSet) : ""}
        ${dataKpis ? renderQuickStats(dataKpis, displayData.length, dataList.length, clientSearchTerm, favorites) : ""}
        <section class="p16-kpis" id="p16-kpis" aria-label="Indicadores principais">${dataKpis ? renderKPIs(dataKpis) : renderLoading("kpis")}</section>
        <section class="p16-distributions" id="p16-distributions" aria-label="Distribui\xE7\xF5es">${dataKpis ? renderDistributions(dataKpis) : renderLoading("dist")}</section>
        <section class="p16-filters" id="p16-filters" aria-label="Filtros">${renderFilters({ ...state, displayDataLength: displayData.length })}</section>
        <section class="p16-table-wrapper p16-sticky-wrapper ${useInfiniteScroll ? "p16-infinite-scroll" : ""}" id="p16-table" role="region" aria-label="Tabela de fornecedores" aria-live="polite">${displayData.length > 0 || isLoading ? renderTable(state, displayData) : renderEmpty(!!hasFilters)}</section>
        ${!useInfiniteScroll ? `<nav class="p16-pagination" id="p16-pagination" aria-label="Pagina\xE7\xE3o">${renderPagination(dataPagination)}</nav>` : ""}
      </div>
      ${hasDetail ? renderDetailPanel(selectedFornecedor, favorites) : ""}
    </div>
    ${showAdvancedFilters ? renderAdvancedFiltersModal(filters) : ""}
    ${isExporting ? renderExportProgress() : ""}
    ${renderKeyboardHint(focusedRowIndex)}
  `;
}
var render_default = { renderMain, renderControls };
const MODULE_ID = "panel-16.ui.render";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { indexReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  render_default as default,
  healthCheck,
  info,
  renderControls,
  renderMain
};
