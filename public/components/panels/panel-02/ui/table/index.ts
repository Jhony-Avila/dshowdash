// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   VERSION, MODULE_ID, COLUMNS from ./constants.js
//   sortJobs, updateSortIndicators from ./sorting.js
//   renderSkeletonRows from ./render/skeleton.js
//   renderHeaderCells, renderFilterCells from ./render/header.js
//   renderRows, renderGroupedRows, renderEmpty from ./render/row.js
//   setup*Listeners, removeListeners from ./events.js
//
// PROVIDES: TableComponent class (render/update/destroy/showLoading/
//   hideLoading/getColumns/setColumnVisibility/setDensity/setGroupBy/
//   toggleInlineFilters/announce/healthCheck/info),
//   VERSION, MODULE_ID
//
// RECEIVES (via constructor):
//   container — DOM Element
//   logger — Logger instance
//
// BROWSER APIs (legítimo — table DOM):
//   document.createElement, document.body.appendChild (liveRegion ARIA)
// ═══════════════════════════════════════════════════════════════
// Panel-02 TableComponent - Enterprise Modular
// @version 8.1.0-ENTERPRISE
// Refatorado em módulos por responsabilidade
'use strict';

import { VERSION, MODULE_ID, COLUMNS } from './constants.js';
import { sortJobs, updateSortIndicators } from './sorting.js';
import { renderSkeletonRows } from './render/skeleton.js';
import { renderHeaderCells, renderFilterCells } from './render/header.js';
import { renderRows, renderGroupedRows, renderEmpty } from './render/row.js';
import { setupSortListeners, setupResizeListeners, setupInlineFilterListeners, setupExpandListeners, setupGroupToggleListeners, removeListeners } from './events.js';

export { VERSION, MODULE_ID };

export class TableComponent {
  [key: string]: any;
  constructor(container: HTMLElement, logger: Record<string, unknown> | null) {
    this.container = container;
    this.logger = logger;
    this.element = null;
    this.jobs = [];
    this.columns = JSON.parse(JSON.stringify(COLUMNS));
    this.sortColumns = [];
    this.density = 'normal';
    this.inlineFilters = {};
    this.expandedRows = new Set();
    this.groupBy = null;
    this.collapsedGroups = new Set();
    this.showInlineFilters = false;
    this.isLoading = true;
    this.liveRegion = null;
    
    // Event handler refs
    this._handlers = {};
    
    // Callbacks
    this.onInlineFilter = null;
    this.onRowExpand = null;
  }

  getColumns() {
    return this.columns.filter((c: Record<string, unknown>) => c.id !== 'select' && c.id !== 'expand' && c.id !== 'actions');
  }

  setColumnVisibility(columnId: string, visible: boolean) {
    const col = this.columns.find((c: Record<string, unknown>) => c.id === columnId);
    if (col) {
      col.visible = visible;
      this._updateColumnVisibility();
    }
  }

  _updateColumnVisibility() {
    if (!this.element) return;
    this.columns.forEach((col: Record<string, unknown>, idx: number) => {
      const ths = this.element.querySelectorAll(`th:nth-child(${idx + 1})`);
      const tds = this.element.querySelectorAll(`td:nth-child(${idx + 1})`);
      ths.forEach((th: Element) => th.classList.toggle('p02-col-hidden', !col.visible));
      tds.forEach((td: Element) => td.classList.toggle('p02-col-hidden', !col.visible));
    });
  }

  setDensity(density: string) {
    this.density = density;
    const table = this.element?.querySelector('.p02-table');
    if (table) table.setAttribute('data-density', density);
    this.announce(`Densidade alterada para ${density}`);
  }

  setGroupBy(field: string | null) {
    this.groupBy = field;
    this.collapsedGroups.clear();
    if (this.jobs.length) this.update(this.jobs);
    this.announce(field ? `Agrupado por ${field}` : 'Agrupamento removido');
  }

  toggleInlineFilters(show: boolean | undefined) {
    this.showInlineFilters = show !== undefined ? show : !this.showInlineFilters;
    const filterRow = this.element?.querySelector('.p02-thead-filters');
    if (filterRow) filterRow.style.display = this.showInlineFilters ? '' : 'none';
  }

  render(showSkeleton = true) {
    if (!this.container) return null;

    this.element = document.createElement('div');
    this.element.className = 'p02-table-wrapper';
    this._createLiveRegion();
    
    const headerCells = renderHeaderCells(this.columns, this.sortColumns);
    const filterCells = renderFilterCells(this.columns);
    const initialContent = showSkeleton && this.isLoading ? renderSkeletonRows(this.columns, 10) : '';

    this.element.innerHTML = `
      <a href="#p02-table-end" class="p02-skip-link">Pular tabela</a>
      <table class="p02-table" data-density="${this.density}" role="grid" aria-label="Tabela de monitoramento de jobs" aria-rowcount="${this.jobs.length || 10}">
        <thead>
          <tr role="row">${headerCells}</tr>
          <tr class="p02-thead-filters" style="display:${this.showInlineFilters ? '' : 'none'}" role="row">${filterCells}</tr>
        </thead>
        <tbody class="p02-tbody" role="rowgroup">${initialContent}</tbody>
      </table>
      <div id="p02-table-end" tabindex="-1" class="p02-sr-only">Fim da tabela</div>
    `;

    this._setupListeners();
    this.container.appendChild(this.element);
    return this.element;
  }

  _setupListeners() {
    const state = {
      sortColumns: this.sortColumns,
      inlineFilters: this.inlineFilters,
      expandedRows: this.expandedRows,
      collapsedGroups: this.collapsedGroups
    };
    
    const handlers = {
      sortAndRender: () => this._sortAndRender(),
      announce: (msg: string) => this.announce(msg),
      onInlineFilter: this.onInlineFilter
    };

    this._handlers.headerClickHandler = setupSortListeners(this.element, state, handlers);
    this._handlers.resizeHandler = setupResizeListeners(this.element, this.columns);
    // @ts-expect-error strict migration — TS2345
    this._handlers.inlineFilterHandler = setupInlineFilterListeners(this.element, state, handlers);
    this._handlers.expandHandler = setupExpandListeners(this.element, state, handlers);
    this._handlers.groupToggleHandler = setupGroupToggleListeners(this.element, state, handlers);
  }

  showLoading() {
    this.isLoading = true;
    const tbody = this.element?.querySelector('.p02-tbody');
    if (tbody) tbody.innerHTML = renderSkeletonRows(this.columns, 10);
    const table = this.element?.querySelector('.p02-table');
    if (table) table.setAttribute('aria-busy', 'true');
  }

  hideLoading() {
    this.isLoading = false;
    const table = this.element?.querySelector('.p02-table');
    if (table) table.setAttribute('aria-busy', 'false');
  }

  _createLiveRegion() {
    if (this.liveRegion) return;
    this.liveRegion = document.createElement('div');
    this.liveRegion.className = 'p02-live-region';
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.liveRegion);
  }

  announce(message: string) {
    if (!this.liveRegion) return;
    this.liveRegion.textContent = '';
    setTimeout(() => { this.liveRegion.textContent = message; }, 100);
  }

  _sortAndRender() {
    if (!this.jobs.length) return;
    const sorted = sortJobs(this.jobs, this.sortColumns);
    this._renderRows(sorted);
  }

  update(jobs: Record<string, unknown>[]) {
    this.jobs = jobs || [];
    this.isLoading = false;
    this.hideLoading();
    
    const tbody = this.element?.querySelector('.p02-tbody');
    if (!tbody) return;
    
    const table = this.element?.querySelector('.p02-table');
    if (table) table.setAttribute('aria-rowcount', this.jobs.length);
    
    if (!this.jobs.length) {
      const colCount = this.columns.filter((c: Record<string, unknown>) => c.visible).length;
      tbody.innerHTML = renderEmpty(colCount);
      this.announce('Nenhum job encontrado');
      return;
    }
    
    if (this.sortColumns.length > 0) {
      this._sortAndRender();
    } else if (this.groupBy) {
      this._renderGroupedRows(this.jobs);
    } else {
      this._renderRows(this.jobs);
    }
    
    this.announce(`${this.jobs.length} jobs carregados`);
  }

  _renderRows(jobs: Record<string, unknown>[]) {
    const tbody = this.element?.querySelector('.p02-tbody');
    if (!tbody) return;
    tbody.innerHTML = renderRows(jobs, this.columns, this.expandedRows);
  }

  _renderGroupedRows(jobs: Record<string, unknown>[]) {
    const tbody = this.element?.querySelector('.p02-tbody');
    if (!tbody) return;
    tbody.innerHTML = renderGroupedRows(jobs, this.columns, this.expandedRows, this.collapsedGroups, this.groupBy);
  }

  healthCheck() {
    return { moduleId: MODULE_ID, version: VERSION, mounted: !!this.element, jobsCount: this.jobs.length };
  }

  info() {
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      features: ['modular-architecture', 'multi-sort', 'inline-filters', 'grouping', 'expand', 'resize', 'aria'],
      mounted: !!this.element,
      jobsCount: this.jobs.length,
      sortColumns: this.sortColumns.length,
      groupBy: this.groupBy
    };
  }

  destroy() {
    removeListeners(this.element, this._handlers);
    
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    
    if (this.liveRegion) {
      this.liveRegion.remove();
      this.liveRegion = null;
    }
    
    this.jobs = [];
    this.sortColumns = [];
    this.expandedRows.clear();
    this.collapsedGroups.clear();
  }
}

export default TableComponent;
