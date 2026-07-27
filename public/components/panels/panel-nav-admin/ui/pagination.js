import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE3";
const MODULE_ID = "panel-nav-admin.ui.pagination";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const PAGE_SIZES = [10, 25, 50, 100];
function _formatNumber(n) {
  if (typeof n !== "number") return "0";
  return n.toLocaleString("pt-BR");
}
class Pagination {
  /**
   * @param {Object} [options]
   * @param {Function} [options.onPageChange] — (page: number) => void
   * @param {Function} [options.onPageSizeChange] — (size: number) => void
   */
  constructor(options = {}) {
    this.onPageChange = options.onPageChange || (() => {
    });
    this.onPageSizeChange = options.onPageSizeChange || (() => {
    });
    this._el = null;
    this._boundHandler = null;
  }
  /**
   * Render pagination controls.
   * @param {Object} state
   * @param {number} state.page — Current page (1-indexed)
   * @param {number} state.perPage — Items per page
   * @param {number} state.total — Total items
   * @param {number} [state.totalPages] — Total pages (calculated if not provided)
   * @returns {string} HTML
   */
  render(state) {
    const page = state.page || 1;
    const perPage = state.perPage || 50;
    const total = state.total || 0;
    const totalPages = state.totalPages || Math.ceil(total / perPage) || 1;
    const start = Math.min(total, (page - 1) * perPage + 1);
    const end = Math.min(total, page * perPage);
    const isFirst = page <= 1;
    const isLast = page >= totalPages;
    const pageSizeOptions = PAGE_SIZES.map((s) => {
      const selected = s === perPage ? " selected" : "";
      return '<option value="' + s + '"' + selected + ">" + s + "</option>";
    }).join("");
    return '<div class="pna-pagination" data-pagination><div class="pna-pagination-info"><span>' + _formatNumber(start) + "\u2013" + _formatNumber(end) + " de " + _formatNumber(total) + '</span></div><div class="pna-pagination-controls"><button class="pna-pagination-btn" data-page-action="first" title="Primeira"' + (isFirst ? " disabled" : "") + '>\xAB</button><button class="pna-pagination-btn" data-page-action="prev" title="Anterior"' + (isFirst ? " disabled" : "") + '>\u2039</button><span class="pna-pagination-current">' + page + " / " + totalPages + '</span><button class="pna-pagination-btn" data-page-action="next" title="Pr\xF3xima"' + (isLast ? " disabled" : "") + '>\u203A</button><button class="pna-pagination-btn" data-page-action="last" title="\xDAltima"' + (isLast ? " disabled" : "") + '>\xBB</button></div><div class="pna-pagination-size"><label>Por p\xE1gina: </label><select class="pna-pagination-select" data-page-action="size">' + pageSizeOptions + "</select></div></div>";
  }
  /**
   * Bind pagination to a container (attaches event delegation).
   * @param {HTMLElement} container
   * @param {Object} currentState — { page, perPage, total }
   */
  bind(container, currentState) {
    if (!container) return;
    this._el = container.querySelector("[data-pagination]") || container;
    this._state = currentState || { page: 1, perPage: 50, total: 0 };
    this._boundHandler = (e) => {
      const target = e.target.closest("[data-page-action]");
      if (!target) return;
      const action = target.dataset.pageAction;
      const totalPages = Math.ceil(this._state.total / this._state.perPage) || 1;
      switch (action) {
        case "first":
          if (this._state.page > 1) this.onPageChange(1);
          break;
        case "prev":
          if (this._state.page > 1) this.onPageChange(this._state.page - 1);
          break;
        case "next":
          if (this._state.page < totalPages) this.onPageChange(this._state.page + 1);
          break;
        case "last":
          if (this._state.page < totalPages) this.onPageChange(totalPages);
          break;
        case "size":
          if (target.tagName === "SELECT") {
            this.onPageSizeChange(parseInt(target.value, 10));
          }
          break;
      }
    };
    this._el.addEventListener("click", this._boundHandler);
    this._el.addEventListener("change", this._boundHandler);
  }
  /**
   * Update internal state reference.
   * @param {Object} state — { page, perPage, total }
   */
  updateState(state) {
    this._state = state || this._state;
  }
  /** Cleanup */
  destroy() {
    if (this._el && this._boundHandler) {
      this._el.removeEventListener("click", this._boundHandler);
      this._el.removeEventListener("change", this._boundHandler);
    }
    this._el = null;
    this._boundHandler = null;
  }
}
function createPagination(options = {}) {
  return new Pagination(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, pageSizes: PAGE_SIZES };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var pagination_default = { Pagination, createPagination, PAGE_SIZES, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  PAGE_SIZES,
  Pagination,
  VERSION,
  createPagination,
  pagination_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
