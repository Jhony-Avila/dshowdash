const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-audit-trail-events";
let _container = null;
let _handlers = {};
let _abortController = null;
let _searchTimeout = null;
function init(container, handlers = {}) {
  if (!container) return { ok: false, error: "Container required" };
  if (_abortController) destroy();
  _container = container;
  _handlers = handlers;
  _abortController = new AbortController();
  _attachListeners();
  _setupKeyboardShortcuts();
  _setupClickOutside();
  return { ok: true };
}
function destroy() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
  if (_searchTimeout) clearTimeout(_searchTimeout);
  _container = null;
  _handlers = {};
}
function _attachListeners() {
  const signal = _abortController.signal;
  _container.addEventListener("click", _handleClick, { signal });
  _container.addEventListener("change", _handleChange, { signal });
  _container.addEventListener("input", _handleInput, { signal });
}
function _setupClickOutside() {
  const signal = _abortController.signal;
  document.addEventListener("click", (e) => {
    const columnsMenu = _container?.querySelector("[data-columns-menu]");
    const columnsBtn = _container?.querySelector('[data-action="toggle-columns"]');
    if (columnsMenu?.classList.contains("open") && !columnsMenu.contains(e.target) && !columnsBtn?.contains(e.target)) {
      columnsMenu.classList.remove("open");
      columnsBtn?.classList.remove("active");
    }
    const exportMenu = _container?.querySelector("[data-export-menu]");
    const exportBtn = _container?.querySelector('[data-action="toggle-export-menu"]');
    if (exportMenu?.classList.contains("open") && !exportMenu.contains(e.target) && !exportBtn?.contains(e.target)) {
      exportMenu.classList.remove("open");
      exportBtn?.classList.remove("active");
    }
  }, { signal });
}
function _setupKeyboardShortcuts() {
  const signal = _abortController.signal;
  document.addEventListener("keydown", (e) => {
    const activeTag = document.activeElement?.tagName;
    const isInputFocused = ["INPUT", "TEXTAREA", "SELECT"].includes(activeTag);
    if (isInputFocused) {
      if (e.key === "/") {
        const searchInput = _container?.querySelector('[data-filter="search"]');
        if (searchInput && document.activeElement !== searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
      if (e.key === "Escape") document.activeElement?.blur();
      return;
    }
    switch (e.key.toLowerCase()) {
      case "/":
        e.preventDefault();
        _container?.querySelector('[data-filter="search"]')?.focus();
        break;
      case "r":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          _handlers.onRefresh?.();
        }
        break;
      case "a":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          _handlers.onToggleAutoRefresh?.();
        }
        break;
      case "p":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          _handlers.onPrint?.();
        }
        break;
      case "f":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          _handlers.onFullscreen?.();
        }
        break;
      case "e":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          _toggleExportMenu();
        }
        break;
      case "g":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          _focusGroupSelect();
        }
        break;
      case "i":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          _handlers.onToggleInlineFilters?.();
        }
        break;
      case "escape":
        if (_container?.classList.contains("fullscreen")) _handlers.onFullscreen?.();
        _handlers.onClearSelection?.();
        _closeAllMenus();
        break;
      case "1":
        _handlers.onDensityChange?.("compact");
        break;
      case "2":
        _handlers.onDensityChange?.("normal");
        break;
      case "3":
        _handlers.onDensityChange?.("comfortable");
        break;
      case "arrowleft":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          _handlers.onPrevPage?.();
        }
        break;
      case "arrowright":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          _handlers.onNextPage?.();
        }
        break;
    }
  }, { signal });
}
function _toggleExportMenu() {
  const menu = _container?.querySelector("[data-export-menu]");
  const btn = _container?.querySelector('[data-action="toggle-export-menu"]');
  if (menu) {
    const isOpen = menu.classList.toggle("open");
    btn?.classList.toggle("active", isOpen);
  }
}
function _focusGroupSelect() {
  _container?.querySelector('[data-action="group-by"]')?.focus();
}
function _closeAllMenus() {
  _container?.querySelector("[data-columns-menu]")?.classList.remove("open");
  _container?.querySelector("[data-export-menu]")?.classList.remove("open");
  _container?.querySelectorAll(".active[data-action]")?.forEach((btn) => btn.classList.remove("active"));
}
function _handleClick(e) {
  const target = e.target;
  if (!target) return;
  const tabBtn = target.closest("[data-tab]");
  if (tabBtn) {
    e.preventDefault();
    _handlers.onTabChange?.(tabBtn.dataset.tab);
    return;
  }
  const presetBtn = target.closest("[data-preset]");
  if (presetBtn) {
    e.preventDefault();
    _handlers.onTimePreset?.(presetBtn.dataset.preset);
    return;
  }
  const densityBtn = target.closest("[data-density]");
  if (densityBtn) {
    e.preventDefault();
    _handlers.onDensityChange?.(densityBtn.dataset.density);
    return;
  }
  const sortHeader = target.closest("th.sortable");
  if (sortHeader) {
    e.preventDefault();
    _handlers.onSort?.(sortHeader.dataset.sortKey);
    return;
  }
  const healthItem = target.closest("[data-health]");
  if (healthItem) {
    e.preventDefault();
    _handlers.onHealthFilter?.(healthItem.dataset.health);
    return;
  }
  const columnToggle = target.closest("[data-toggle-column]");
  if (columnToggle) {
    e.preventDefault();
    e.stopPropagation();
    columnToggle.classList.toggle("checked");
    _handlers.onColumnToggle?.(columnToggle.dataset.toggleColumn, columnToggle.classList.contains("checked"));
    return;
  }
  const expandTrigger = target.closest('[data-action="toggle-expand"]');
  if (expandTrigger) {
    e.preventDefault();
    e.stopPropagation();
    _handlers.onToggleExpand?.(expandTrigger.dataset.logId);
    return;
  }
  const groupHeader = target.closest(".pat-group-header");
  if (groupHeader) {
    e.preventDefault();
    _handlers.onToggleGroup?.(groupHeader.dataset.group);
    return;
  }
  const actionBtn = target.closest("[data-action]");
  if (actionBtn) {
    const action = actionBtn.dataset.action;
    const logId = actionBtn.dataset.logId;
    switch (action) {
      case "refresh":
        _handlers.onRefresh?.();
        break;
      case "print":
        _handlers.onPrint?.();
        break;
      case "fullscreen":
        _handlers.onFullscreen?.();
        break;
      case "toggle-auto-refresh":
        _handlers.onToggleAutoRefresh?.();
        break;
      case "apply-filters":
        _handlers.onApplyFilters?.();
        break;
      case "clear-filters":
        _handlers.onClearFilters?.();
        break;
      case "prev":
        _handlers.onPrevPage?.();
        break;
      case "next":
        _handlers.onNextPage?.();
        break;
      case "show-details":
        _handlers.onShowDetails?.(logId);
        break;
      case "toggle-columns":
        _toggleColumnsMenu(actionBtn);
        break;
      case "toggle-inline-filters":
        _handlers.onToggleInlineFilters?.();
        actionBtn.classList.toggle("active");
        break;
      case "toggle-export-menu":
        _toggleExportMenu();
        break;
      case "export-csv":
        _handlers.onExportCSV?.();
        _closeAllMenus();
        break;
      case "export-json":
        _handlers.onExportJSON?.();
        _closeAllMenus();
        break;
      case "export-clipboard":
        _handlers.onExportClipboard?.();
        _closeAllMenus();
        break;
      case "bulk-export":
        _handlers.onBulkExport?.();
        break;
      case "bulk-copy":
        _handlers.onBulkCopy?.();
        break;
      case "bulk-clear":
        _handlers.onClearSelection?.();
        break;
      case "copy-log":
        _handlers.onCopyLog?.(logId);
        break;
    }
    return;
  }
  const row = target.closest("[data-log-id]");
  if (row && !target.closest("button") && !target.closest('input[type="checkbox"]') && !target.closest(".pat-expand-trigger")) {
    if (e.ctrlKey || e.metaKey) {
      _handlers.onRowToggleSelect?.(row.dataset.logId);
    } else {
      _handlers.onRowClick?.(row.dataset.logId);
    }
    return;
  }
}
function _toggleColumnsMenu(btn) {
  const menu = _container?.querySelector("[data-columns-menu]");
  if (menu) {
    const isOpen = menu.classList.toggle("open");
    btn.classList.toggle("active", isOpen);
  }
}
function _handleChange(e) {
  const target = e.target;
  if (!target) return;
  if (target.matches("[data-filter]")) {
    _handlers.onFilterChange?.(target.dataset.filter, target.value);
    return;
  }
  if (target.matches('[data-action="group-by"]')) {
    _handlers.onGroupBy?.(target.value);
    return;
  }
  if (target.matches('[data-action="select-all"]')) {
    _handlers.onSelectAll?.(target.checked);
    return;
  }
  if (target.matches("[data-row-select]")) {
    _handlers.onRowSelect?.(target.dataset.rowSelect, target.checked);
    return;
  }
  if (target.matches("select[data-inline-filter]")) {
    _handlers.onInlineFilter?.(target.dataset.inlineFilter, target.value);
    return;
  }
}
function _handleInput(e) {
  const target = e.target;
  if (!target) return;
  if (target.matches('[data-filter="search"]')) {
    if (_searchTimeout) clearTimeout(_searchTimeout);
    _searchTimeout = setTimeout(() => {
      _handlers.onFilterChange?.("search", target.value);
    }, 300);
    return;
  }
  if (target.matches("input[data-inline-filter]")) {
    if (_searchTimeout) clearTimeout(_searchTimeout);
    _searchTimeout = setTimeout(() => {
      _handlers.onInlineFilter?.(target.dataset.inlineFilter, target.value);
    }, 300);
    return;
  }
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  return { status: _abortController ? "HEALTHY" : "UNHEALTHY", moduleId: MODULE_ID, version: VERSION, p22Compliant: true, abortControllerActive: !!_abortController, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p22Compliant: true, hasContainer: !!_container, abortControllerActive: !!_abortController, timestamp: Date.now() };
}
var events_default = { VERSION, MODULE_ID, init, destroy, getVersion, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  events_default as default,
  destroy,
  getVersion,
  healthCheck,
  info,
  init
};
