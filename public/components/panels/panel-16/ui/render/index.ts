// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16.ui.render
// PURPOSE: Panel-16 Render Index - Main Orchestrator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   renderControls from ./controls.js
//   renderQuickStats, renderKPIs, renderDistributions, renderLoading from ./kpis.js
//   renderFilterChips, renderFilters from ./filterbar.js
//   renderTable, renderEmpty from ./table.js
//   renderPagination from ./pagination.js
//   renderDetailPanel, renderBulkActions, renderAdvancedFiltersModal, renderExpor...
//   getActiveFiltersCount from ../filters.js
//
// PROVIDES:
//   renderMain() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//   renderControls — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
// @version 1.0.0-ENTERPRISE-AAA

import { renderControls } from './controls.js';

import { renderQuickStats, renderKPIs, renderDistributions, renderLoading } from './kpis.js';

import { renderFilterChips, renderFilters } from './filterbar.js';

import { renderTable, renderEmpty } from './table.js';
import { renderPagination } from './pagination.js';

import { renderDetailPanel, renderBulkActions, renderAdvancedFiltersModal, renderExportProgress, renderKeyboardHint } from './modals.js';
import { getActiveFiltersCount } from '../filters.js';

export function renderMain(state: Record<string, unknown>, displayData: Array<Record<string, unknown>>) {
  const { selectedFornecedor, viewMode, isLoading, selectedRows, showAdvancedFilters, isExporting, focusedRowIndex, useInfiniteScroll, clientSearchTerm, sortColumns, favorites } = state;
  const filters = state.filters as Record<string, unknown>;
  const data = state.data as Record<string, unknown>;
  const dataKpis = data.kpis as Record<string, unknown> | null;
  const dataList = data.list as unknown[];
  const dataPagination = data.pagination as Record<string, unknown>;
  const selectedRowsSet = selectedRows as Set<string>;
  const hasDetail = selectedFornecedor;
  const compactClass = viewMode === 'compact' ? 'p16-compact' : '';
  const hasFilters = getActiveFiltersCount(filters) > 0 || filters.search || clientSearchTerm;

  return `
    <div class="p16-layout ${hasDetail ? 'p16-with-detail' : ''} ${compactClass}" role="application" aria-label="Painel de Fornecedores 360º">
      <div class="p16-main ${isLoading ? 'p16-loading-overlay' : ''}">
        ${renderFilterChips(filters, sortColumns as Array<{ key: string }>, clientSearchTerm as string)}
        ${selectedRowsSet.size > 0 ? renderBulkActions(selectedRowsSet) : ''}
        ${dataKpis ? renderQuickStats(dataKpis, displayData.length, dataList.length, clientSearchTerm as string, favorites as Set<string> | Record<string, unknown>) : ''}
        <section class="p16-kpis" id="p16-kpis" aria-label="Indicadores principais">${dataKpis ? (renderKPIs as unknown as (kpis: Record<string, unknown>) => string)(dataKpis) : renderLoading('kpis')}</section>
        <section class="p16-distributions" id="p16-distributions" aria-label="Distribuições">${dataKpis ? renderDistributions(dataKpis) : renderLoading('dist')}</section>
        <section class="p16-filters" id="p16-filters" aria-label="Filtros">${renderFilters({ ...state, displayDataLength: displayData.length })}</section>
        <section class="p16-table-wrapper p16-sticky-wrapper ${useInfiniteScroll ? 'p16-infinite-scroll' : ''}" id="p16-table" role="region" aria-label="Tabela de fornecedores" aria-live="polite">${displayData.length > 0 || isLoading ? (renderTable as unknown as (state: Record<string, unknown>, data: Record<string, unknown>[]) => string)(state, displayData) : renderEmpty(!!hasFilters)}</section>
        ${!useInfiniteScroll ? `<nav class="p16-pagination" id="p16-pagination" aria-label="Paginação"></nav>` : ''}
      </div>
      ${hasDetail ? renderDetailPanel(selectedFornecedor as Record<string, unknown>, favorites as Set<string>) : ''}
    </div>
    ${showAdvancedFilters ? renderAdvancedFiltersModal(filters) : ''}
    ${isExporting ? renderExportProgress() : ''}
    ${renderKeyboardHint(focusedRowIndex as number)}
  `;
}

export { renderControls };

export default { renderMain, renderControls };

export const MODULE_ID = 'panel-16.ui.render';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { indexReady: true } }; }
