import { VERSION, MODULE_ID, COLUMNS } from "./constants.js";
import { sortJobs } from "./sorting.js";
import { renderSkeletonRows } from "./render/skeleton.js";
import { renderHeaderCells, renderFilterCells } from "./render/header.js";
import { renderRows, renderGroupedRows, renderEmpty } from "./render/row.js";
import { setupSortListeners, setupResizeListeners, setupInlineFilterListeners, setupExpandListeners, setupGroupToggleListeners, removeListeners } from "./events.js";
class TableComponent {
  constructor(container, logger) {
    this.container = container;
    this.logger = logger;
    this.element = null;
    this.jobs = [];
    this.columns = JSON.parse(JSON.stringify(COLUMNS));
    this.sortColumns = [];
    this.density = "normal";
    this.inlineFilters = {};
    this.expandedRows = /* @__PURE__ */ new Set();
    this.groupBy = null;
    this.collapsedGroups = /* @__PURE__ */ new Set();
    this.showInlineFilters = false;
    this.isLoading = true;
    this.liveRegion = null;
    this._handlers = {};
    this.onInlineFilter = null;
    this.onRowExpand = null;
  }
  getColumns() {
    return this.columns.filter((c) => c.id !== "select" && c.id !== "expand" && c.id !== "actions");
  }
  setColumnVisibility(columnId, visible) {
    const col = this.columns.find((c) => c.id === columnId);
    if (col) {
      col.visible = visible;
      this._updateColumnVisibility();
    }
  }
  _updateColumnVisibility() {
    if (!this.element) return;
    this.columns.forEach((col, idx) => {
      const ths = this.element.querySelectorAll(`th:nth-child(${idx + 1})`);
      const tds = this.element.querySelectorAll(`td:nth-child(${idx + 1})`);
      ths.forEach((th) => th.classList.toggle("p02-col-hidden", !col.visible));
      tds.forEach((td) => td.classList.toggle("p02-col-hidden", !col.visible));
    });
  }
  setDensity(density) {
    this.density = density;
    const table = this.element?.querySelector(".p02-table");
    if (table) table.setAttribute("data-density", density);
    this.announce(`Densidade alterada para ${density}`);
  }
  setGroupBy(field) {
    this.groupBy = field;
    this.collapsedGroups.clear();
    if (this.jobs.length) this.update(this.jobs);
    this.announce(field ? `Agrupado por ${field}` : "Agrupamento removido");
  }
  toggleInlineFilters(show) {
    this.showInlineFilters = show !== void 0 ? show : !this.showInlineFilters;
    const filterRow = this.element?.querySelector(".p02-thead-filters");
    if (filterRow) filterRow.style.display = this.showInlineFilters ? "" : "none";
  }
  render(showSkeleton = true) {
    if (!this.container) return null;
    this.element = document.createElement("div");
    this.element.className = "p02-table-wrapper";
    this._createLiveRegion();
    const headerCells = renderHeaderCells(this.columns, this.sortColumns);
    const filterCells = renderFilterCells(this.columns);
    const initialContent = showSkeleton && this.isLoading ? renderSkeletonRows(this.columns, 10) : "";
    this.element.innerHTML = `
      <a href="#p02-table-end" class="p02-skip-link">Pular tabela</a>
      <table class="p02-table" data-density="${this.density}" role="grid" aria-label="Tabela de monitoramento de jobs" aria-rowcount="${this.jobs.length || 10}">
        <thead>
          <tr role="row">${headerCells}</tr>
          <tr class="p02-thead-filters" style="display:${this.showInlineFilters ? "" : "none"}" role="row">${filterCells}</tr>
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
      announce: (msg) => this.announce(msg),
      onInlineFilter: this.onInlineFilter
    };
    this._handlers.headerClickHandler = setupSortListeners(this.element, state, handlers);
    this._handlers.resizeHandler = setupResizeListeners(this.element, this.columns);
    this._handlers.inlineFilterHandler = setupInlineFilterListeners(this.element, state, handlers);
    this._handlers.expandHandler = setupExpandListeners(this.element, state, handlers);
    this._handlers.groupToggleHandler = setupGroupToggleListeners(this.element, state, handlers);
  }
  showLoading() {
    this.isLoading = true;
    const tbody = this.element?.querySelector(".p02-tbody");
    if (tbody) tbody.innerHTML = renderSkeletonRows(this.columns, 10);
    const table = this.element?.querySelector(".p02-table");
    if (table) table.setAttribute("aria-busy", "true");
  }
  hideLoading() {
    this.isLoading = false;
    const table = this.element?.querySelector(".p02-table");
    if (table) table.setAttribute("aria-busy", "false");
  }
  _createLiveRegion() {
    if (this.liveRegion) return;
    this.liveRegion = document.createElement("div");
    this.liveRegion.className = "p02-live-region";
    this.liveRegion.setAttribute("role", "status");
    this.liveRegion.setAttribute("aria-live", "polite");
    this.liveRegion.setAttribute("aria-atomic", "true");
    document.body.appendChild(this.liveRegion);
  }
  announce(message) {
    if (!this.liveRegion) return;
    this.liveRegion.textContent = "";
    setTimeout(() => {
      this.liveRegion.textContent = message;
    }, 100);
  }
  _sortAndRender() {
    if (!this.jobs.length) return;
    const sorted = sortJobs(this.jobs, this.sortColumns);
    this._renderRows(sorted);
  }
  update(jobs) {
    this.jobs = jobs || [];
    this.isLoading = false;
    this.hideLoading();
    const tbody = this.element?.querySelector(".p02-tbody");
    if (!tbody) return;
    const table = this.element?.querySelector(".p02-table");
    if (table) table.setAttribute("aria-rowcount", this.jobs.length);
    if (!this.jobs.length) {
      const colCount = this.columns.filter((c) => c.visible).length;
      tbody.innerHTML = renderEmpty(colCount);
      this.announce("Nenhum job encontrado");
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
  _renderRows(jobs) {
    const tbody = this.element?.querySelector(".p02-tbody");
    if (!tbody) return;
    tbody.innerHTML = renderRows(jobs, this.columns, this.expandedRows);
  }
  _renderGroupedRows(jobs) {
    const tbody = this.element?.querySelector(".p02-tbody");
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
      features: ["modular-architecture", "multi-sort", "inline-filters", "grouping", "expand", "resize", "aria"],
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
var table_default = TableComponent;
export {
  MODULE_ID,
  TableComponent,
  VERSION,
  table_default as default
};
