const MODULE_ID = "panel-04-ui-events";
const VERSION = "9.3.0-P2-ENTERPRISE";
let _container = null;
let _handlers = {};
let _boundListeners = [];
let _debounceTimers = /* @__PURE__ */ new Map();
function _addListener(el, event, handler, options) {
  if (!el) return;
  el.addEventListener(event, handler, options);
  _boundListeners.push({ element: el, event, handler, options });
}
function _debounce(key, fn, delay = 300) {
  if (_debounceTimers.has(key)) {
    clearTimeout(_debounceTimers.get(key));
  }
  const timerId = setTimeout(() => {
    fn();
    _debounceTimers.delete(key);
  }, delay);
  _debounceTimers.set(key, timerId);
}
function setup(container, handlers = {}) {
  if (!container) return;
  destroy();
  _container = container;
  _handlers = handlers;
  _setupRefresh();
  _setupFilters();
  _setupSearch();
  _setupPagination();
  _setupRowActions();
  _setupBulkActions();
  _setupSorting();
  _setupExport();
  _setupKeyboard();
  _setupClickOutside();
}
function init(container, handlers) {
  setup(container, handlers);
}
function _setupRefresh() {
  const btn = _container.querySelector('[data-action="refresh"]');
  if (!btn) return;
  _addListener(btn, "click", (e) => {
    e.preventDefault();
    btn.classList.add("p04-spinning");
    if (_handlers.refresh) {
      Promise.resolve(_handlers.refresh()).finally(() => {
        setTimeout(() => btn.classList.remove("p04-spinning"), 500);
      });
    } else {
      setTimeout(() => btn.classList.remove("p04-spinning"), 500);
    }
  });
}
function _setupFilters() {
  const selects = _container.querySelectorAll("[data-filter]");
  selects.forEach((select) => {
    _addListener(select, "change", () => {
      const filterName = select.dataset.filter;
      const value = select.value;
      if (_handlers.setFilter) _handlers.setFilter(filterName, value);
    });
  });
  const clearBtn = _container.querySelector('[data-action="clear-filters"]');
  if (clearBtn) {
    _addListener(clearBtn, "click", (e) => {
      e.preventDefault();
      if (_handlers.clearFilters) _handlers.clearFilters();
    });
  }
}
function _setupSearch() {
  const input = _container.querySelector('[data-action="search"]');
  if (!input) return;
  _addListener(input, "input", (e) => {
    const query = e.target.value;
    _debounce("search", () => {
      if (_handlers.search) _handlers.search(query);
    }, 300);
  });
  _addListener(input, "keydown", (e) => {
    const ke = e;
    if (ke.key === "Escape") {
      ke.target.value = "";
      if (_handlers.search) _handlers.search("");
    }
  });
}
function _setupPagination() {
  const prevBtn = _container.querySelector('[data-action="prev-page"]');
  const nextBtn = _container.querySelector('[data-action="next-page"]');
  const pageSelect = _container.querySelector('[data-action="goto-page"]');
  const perPageSelect = _container.querySelector('[data-action="per-page"]');
  if (prevBtn) {
    _addListener(prevBtn, "click", (e) => {
      e.preventDefault();
      if (_handlers.prevPage) _handlers.prevPage();
    });
  }
  if (nextBtn) {
    _addListener(nextBtn, "click", (e) => {
      e.preventDefault();
      if (_handlers.nextPage) _handlers.nextPage();
    });
  }
  if (pageSelect) {
    _addListener(pageSelect, "change", () => {
      const page = parseInt(pageSelect.value, 10);
      if (_handlers.gotoPage && !isNaN(page)) _handlers.gotoPage(page);
    });
  }
  if (perPageSelect) {
    _addListener(perPageSelect, "change", () => {
      const perPage = parseInt(perPageSelect.value, 10);
      if (_handlers.setPerPage && !isNaN(perPage)) _handlers.setPerPage(perPage);
    });
  }
}
function _setupRowActions() {
  _addListener(_container, "click", (e) => {
    const btn = e.target.closest("[data-row-action]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const action = btn.dataset.rowAction;
    const row = btn.closest("[data-row-id]");
    const rowId = row?.dataset.rowId;
    if (!rowId) return;
    if (action === "view" && _handlers.viewRow) _handlers.viewRow(rowId);
    else if (action === "edit" && _handlers.editRow) _handlers.editRow(rowId);
    else if (action === "delete" && _handlers.deleteRow) _handlers.deleteRow(rowId);
    else if (action === "duplicate" && _handlers.duplicateRow) _handlers.duplicateRow(rowId);
    else if (_handlers.rowAction) _handlers.rowAction(action, rowId);
  });
  _addListener(_container, "dblclick", (e) => {
    const row = e.target.closest("[data-row-id]");
    if (!row) return;
    const rowId = row.dataset.rowId;
    if (_handlers.viewRow) _handlers.viewRow(rowId);
  });
}
function _setupBulkActions() {
  const selectAllCb = _container.querySelector('[data-action="select-all"]');
  if (selectAllCb) {
    _addListener(selectAllCb, "change", () => {
      if (selectAllCb.checked) {
        if (_handlers.selectAll) _handlers.selectAll();
      } else {
        if (_handlers.deselectAll) _handlers.deselectAll();
      }
    });
  }
  _addListener(_container, "change", (e) => {
    const cb = e.target.closest('[data-action="select-row"]');
    if (!cb) return;
    const row = cb.closest("[data-row-id]");
    const rowId = row?.dataset.rowId;
    if (rowId && _handlers.toggleRowSelection) {
      _handlers.toggleRowSelection(rowId, cb.checked);
    }
  });
  const bulkDeleteBtn = _container.querySelector('[data-action="bulk-delete"]');
  if (bulkDeleteBtn) {
    _addListener(bulkDeleteBtn, "click", (e) => {
      e.preventDefault();
      if (_handlers.bulkDelete) _handlers.bulkDelete();
    });
  }
  const bulkExportBtn = _container.querySelector('[data-action="bulk-export"]');
  if (bulkExportBtn) {
    _addListener(bulkExportBtn, "click", (e) => {
      e.preventDefault();
      if (_handlers.bulkExport) _handlers.bulkExport();
    });
  }
}
function _setupSorting() {
  const headers = _container.querySelectorAll("[data-sort]");
  headers.forEach((header) => {
    _addListener(header, "click", () => {
      const column = header.dataset.sort;
      if (_handlers.sort) _handlers.sort(column);
    });
  });
}
function _setupExport() {
  const exportCsvBtn = _container.querySelector('[data-action="export-csv"]');
  if (exportCsvBtn) {
    _addListener(exportCsvBtn, "click", (e) => {
      e.preventDefault();
      if (_handlers.exportCsv) _handlers.exportCsv();
    });
  }
  const exportJsonBtn = _container.querySelector('[data-action="export-json"]');
  if (exportJsonBtn) {
    _addListener(exportJsonBtn, "click", (e) => {
      e.preventDefault();
      if (_handlers.exportJson) _handlers.exportJson();
    });
  }
  const printBtn = _container.querySelector('[data-action="print"]');
  if (printBtn) {
    _addListener(printBtn, "click", (e) => {
      e.preventDefault();
      if (_handlers.print) _handlers.print();
    });
  }
}
function _setupKeyboard() {
  _addListener(_container, "keydown", (e) => {
    const ke = e;
    if (ke.target.matches("input, textarea, select")) return;
    if (ke.key === "r" && !ke.ctrlKey && !ke.metaKey) {
      ke.preventDefault();
      if (_handlers.refresh) _handlers.refresh();
    }
    if (ke.key === "/" && !ke.ctrlKey && !ke.metaKey) {
      ke.preventDefault();
      const searchInput = _container.querySelector('[data-action="search"]');
      if (searchInput) searchInput.focus();
    }
    if (ke.key === "Escape") {
      if (_handlers.clearSelection) _handlers.clearSelection();
    }
  });
}
function _setupClickOutside() {
  _addListener(document, "click", (e) => {
    const dropdowns = _container.querySelectorAll(".p04-dropdown--open");
    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("p04-dropdown--open");
      }
    });
  });
}
function destroy() {
  _boundListeners.forEach((item) => {
    if (item.element?.removeEventListener) {
      item.element.removeEventListener(item.event, item.handler, item.options);
    }
  });
  _boundListeners = [];
  _debounceTimers.forEach((timerId) => clearTimeout(timerId));
  _debounceTimers.clear();
  _container = null;
  _handlers = {};
}
function getListenerCount() {
  return _boundListeners.length;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    listenerCount: _boundListeners.length,
    hasContainer: _container !== null,
    handlerCount: Object.keys(_handlers).length
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      containerBound: _container !== null,
      handlersReady: Object.keys(_handlers).length > 0,
      listenersActive: _boundListeners.length > 0
    }
  };
}
function updatePeriodUI(container, period) {
  if (!container) return;
  container.querySelectorAll("[data-period]").forEach((btn) => {
    const el = btn;
    el.classList.toggle("p04-active", el.dataset.period === period);
  });
}
function updateViewModeUI(container, mode) {
  if (!container) return;
  container.querySelectorAll("[data-view-mode]").forEach((btn) => {
    const el = btn;
    el.classList.toggle("p04-active", el.dataset.viewMode === mode);
  });
}
function updateFilterUI(container, severity, filterText) {
  if (!container) return;
  container.querySelectorAll("[data-severity-filter]").forEach((btn) => {
    const el = btn;
    el.classList.toggle("p04-active", el.dataset.severityFilter === severity);
  });
  const searchInput = container.querySelector("[data-filter]");
  if (searchInput && searchInput.value !== (filterText || "")) {
    searchInput.value = filterText || "";
  }
}
function updateSortIndicators(container, column, order) {
  if (!container) return;
  container.querySelectorAll("[data-sort-col]").forEach((th) => {
    const el = th;
    el.classList.remove("p04-sort-asc", "p04-sort-desc");
    if (el.dataset.sortCol === column) {
      el.classList.add(order === "asc" ? "p04-sort-asc" : "p04-sort-desc");
    }
  });
}
function updateSoundToggle(container, enabled) {
  if (!container) return;
  const btn = container.querySelector('[data-action="toggle-sound"]');
  if (btn) {
    btn.classList.toggle("p04-active", enabled);
    btn.setAttribute("aria-pressed", String(enabled));
  }
}
const bindEvents = setup;
var events_default = {
  MODULE_ID,
  VERSION,
  setup,
  init,
  destroy,
  getListenerCount,
  info,
  healthCheck,
  updatePeriodUI,
  updateViewModeUI,
  updateFilterUI,
  updateSortIndicators,
  updateSoundToggle
};
export {
  MODULE_ID,
  VERSION,
  bindEvents,
  events_default as default,
  destroy,
  getListenerCount,
  healthCheck,
  info,
  init,
  setup,
  updateFilterUI,
  updatePeriodUI,
  updateSortIndicators,
  updateSoundToggle,
  updateViewModeUI
};
