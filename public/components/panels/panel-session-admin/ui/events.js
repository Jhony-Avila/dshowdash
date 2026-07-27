import { showConfirmModal } from "/components/overlay-layer/adapters/modal-adapter.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-session-admin-events";
let _container = null;
let _handlers = {};
let _config = {};
let _boundListeners = [];
let _exportMenuOpen = false;
let _columnsMenuOpen = false;
let _abortController = null;
function setup(container, state, handlers, config = {}) {
  if (!container) return;
  _container = container;
  _handlers = handlers;
  _config = config;
  destroy();
  _setupRefreshButton();
  _setupTerminateOthersButton();
  _setupTerminateButtons();
  _setupFilters();
  _setupSortHeaders();
  _setupAutoRefreshToggle();
  _setupExportMenu();
  _setupColumnsMenu();
  _setupInlineFilters();
  _setupFullscreenToggle();
  _setupSelectionHandlers();
  _setupTerminateSelected();
  _setupRowExpansion();
  _setupDetailsButtons();
  _setupCopySession();
  _setupClickOutside();
}
function init(container, handlers) {
  setup(container, {}, handlers, {});
}
function destroy() {
  _boundListeners.forEach((item) => {
    if (item.element) {
      item.element.removeEventListener(item.event, item.handler);
    }
  });
  _boundListeners = [];
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
  _exportMenuOpen = false;
  _columnsMenuOpen = false;
}
function _setupRefreshButton() {
  const btn = _container.querySelector('[data-action="refresh"]');
  if (!btn) return;
  const handler = (e) => {
    e.preventDefault();
    if (_handlers.refresh) _handlers.refresh();
  };
  btn.addEventListener("click", handler);
  _boundListeners.push({ element: btn, event: "click", handler });
}
function _setupTerminateOthersButton() {
  const btn = _container.querySelector('[data-action="terminate-others"]');
  if (!btn) return;
  const handler = (e) => {
    e.preventDefault();
    showConfirmModal({
      id: "psa-confirm-terminate-all",
      title: _config.i18n?.confirmTerminateTitle || "Confirmar Encerramento",
      message: _config.i18n?.confirmTerminateOthers || "Deseja encerrar todas as outras sess\xF5es?",
      confirmText: _config.i18n?.confirm || "Confirmar",
      cancelText: _config.i18n?.cancel || "Cancelar",
      danger: true,
      scope: MODULE_ID
    }).then((confirmed) => {
      if (confirmed && _handlers.terminateAllOthers) {
        _handlers.terminateAllOthers();
      }
    });
  };
  btn.addEventListener("click", handler);
  _boundListeners.push({ element: btn, event: "click", handler });
}
function _setupTerminateButtons() {
  const buttons = _container.querySelectorAll('[data-action="terminate"]');
  buttons.forEach((btn) => {
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const sessionToken = btn.dataset.sessionToken;
      if (!sessionToken) return;
      showConfirmModal({
        id: "psa-confirm-terminate-one",
        title: "Confirmar Encerramento",
        message: "Deseja encerrar esta sess\xE3o?",
        confirmText: "Confirmar",
        cancelText: "Cancelar",
        danger: true,
        scope: MODULE_ID
      }).then((confirmed) => {
        if (confirmed && _handlers.terminateSession) {
          _handlers.terminateSession(sessionToken);
        }
      });
    };
    btn.addEventListener("click", handler);
    _boundListeners.push({ element: btn, event: "click", handler });
  });
}
function _setupFilters() {
  const statusSelect = _container.querySelector('[data-filter="status"]');
  if (statusSelect) {
    const handler = (e) => {
      if (_handlers.setFilter) _handlers.setFilter("status", e.target.value);
    };
    statusSelect.addEventListener("change", handler);
    _boundListeners.push({ element: statusSelect, event: "change", handler });
  }
  const searchInput = _container.querySelector('[data-filter="search"]');
  if (searchInput) {
    let debounceTimer = null;
    const handler = (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (_handlers.setFilter) _handlers.setFilter("search", e.target.value);
      }, 300);
    };
    searchInput.addEventListener("input", handler);
    _boundListeners.push({ element: searchInput, event: "input", handler });
  }
}
function _setupSortHeaders() {
  const headers = _container.querySelectorAll("[data-sort]");
  headers.forEach((th) => {
    const handler = (e) => {
      e.preventDefault();
      const field = th.dataset.sort;
      if (field && _handlers.setSort) _handlers.setSort(field, e.shiftKey);
    };
    th.addEventListener("click", handler);
    _boundListeners.push({ element: th, event: "click", handler });
  });
}
function _setupAutoRefreshToggle() {
  const btn = _container.querySelector('[data-action="toggle-auto-refresh"]');
  if (!btn) return;
  const handler = (e) => {
    e.preventDefault();
    if (_handlers.toggleAutoRefresh) _handlers.toggleAutoRefresh();
  };
  btn.addEventListener("click", handler);
  _boundListeners.push({ element: btn, event: "click", handler });
}
function _setupExportMenu() {
  const toggleBtn = _container.querySelector('[data-action="toggle-export-menu"]');
  const menu = _container.querySelector("[data-export-menu]");
  if (toggleBtn && menu) {
    const toggleHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      _exportMenuOpen = !_exportMenuOpen;
      _columnsMenuOpen = false;
      menu.classList.toggle("psa__export-menu--open", _exportMenuOpen);
      const colMenu = _container.querySelector("[data-columns-menu]");
      if (colMenu) colMenu.classList.remove("psa__columns-menu--open");
    };
    toggleBtn.addEventListener("click", toggleHandler);
    _boundListeners.push({ element: toggleBtn, event: "click", handler: toggleHandler });
  }
  const actions = { "export-csv": "exportCSV", "export-json": "exportJSON", "copy-clipboard": "copyToClipboard", "print": "printSessions" };
  Object.entries(actions).forEach(([action, method]) => {
    const btn = _container.querySelector(`[data-action="${action}"]`);
    if (btn) {
      const handler = (e) => {
        e.preventDefault();
        _closeMenus();
        if (_handlers[method]) _handlers[method]();
      };
      btn.addEventListener("click", handler);
      _boundListeners.push({ element: btn, event: "click", handler });
    }
  });
}
function _setupColumnsMenu() {
  const toggleBtn = _container.querySelector('[data-action="toggle-columns-menu"]');
  const menu = _container.querySelector("[data-columns-menu]");
  if (toggleBtn && menu) {
    const toggleHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      _columnsMenuOpen = !_columnsMenuOpen;
      _exportMenuOpen = false;
      menu.classList.toggle("psa__columns-menu--open", _columnsMenuOpen);
      const expMenu = _container.querySelector("[data-export-menu]");
      if (expMenu) expMenu.classList.remove("psa__export-menu--open");
    };
    toggleBtn.addEventListener("click", toggleHandler);
    _boundListeners.push({ element: toggleBtn, event: "click", handler: toggleHandler });
  }
  const checkboxes = _container.querySelectorAll('[data-action="toggle-column"]');
  checkboxes.forEach((cb) => {
    const handler = (e) => {
      const col = cb.dataset.column;
      if (_handlers.toggleColumn) _handlers.toggleColumn(col, e.target.checked);
    };
    cb.addEventListener("change", handler);
    _boundListeners.push({ element: cb, event: "change", handler });
  });
  const showAllBtn = _container.querySelector('[data-action="show-all-columns"]');
  if (showAllBtn) {
    const handler = (e) => {
      e.preventDefault();
      if (_handlers.showAllColumns) _handlers.showAllColumns();
    };
    showAllBtn.addEventListener("click", handler);
    _boundListeners.push({ element: showAllBtn, event: "click", handler });
  }
  const resetBtn = _container.querySelector('[data-action="reset-columns"]');
  if (resetBtn) {
    const handler = (e) => {
      e.preventDefault();
      if (_handlers.resetColumns) _handlers.resetColumns();
    };
    resetBtn.addEventListener("click", handler);
    _boundListeners.push({ element: resetBtn, event: "click", handler });
  }
}
function _setupInlineFilters() {
  const toggleBtn = _container.querySelector('[data-action="toggle-inline-filters"]');
  if (toggleBtn) {
    const handler = (e) => {
      e.preventDefault();
      if (_handlers.toggleInlineFilters) _handlers.toggleInlineFilters();
    };
    toggleBtn.addEventListener("click", handler);
    _boundListeners.push({ element: toggleBtn, event: "click", handler });
  }
  const inputs = _container.querySelectorAll("[data-inline-filter]");
  inputs.forEach((input) => {
    let debounceTimer = null;
    const handler = (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (_handlers.setInlineFilter) _handlers.setInlineFilter(input.dataset.inlineFilter, e.target.value);
      }, 300);
    };
    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
    _boundListeners.push({ element: input, event: "input", handler });
    _boundListeners.push({ element: input, event: "change", handler });
  });
}
function _setupFullscreenToggle() {
  const btn = _container.querySelector('[data-action="toggle-fullscreen"]');
  if (!btn) return;
  const handler = (e) => {
    e.preventDefault();
    if (_handlers.toggleFullscreen) _handlers.toggleFullscreen();
  };
  btn.addEventListener("click", handler);
  _boundListeners.push({ element: btn, event: "click", handler });
}
function _setupSelectionHandlers() {
  const selectAllCheckbox = _container.querySelector('[data-action="select-all"]');
  if (selectAllCheckbox) {
    const handler = (e) => {
      if (e.target.checked) {
        if (_handlers.selectAll) _handlers.selectAll();
      } else {
        if (_handlers.deselectAll) _handlers.deselectAll();
      }
    };
    selectAllCheckbox.addEventListener("change", handler);
    _boundListeners.push({ element: selectAllCheckbox, event: "change", handler });
  }
  const rowCheckboxes = _container.querySelectorAll('[data-action="select-row"]');
  rowCheckboxes.forEach((cb) => {
    const handler = () => {
      if (_handlers.toggleRowSelection) _handlers.toggleRowSelection(cb.dataset.sessionToken);
    };
    cb.addEventListener("change", handler);
    _boundListeners.push({ element: cb, event: "change", handler });
  });
  const deselectBtn = _container.querySelector('[data-action="deselect-all"]');
  if (deselectBtn) {
    const handler = (e) => {
      e.preventDefault();
      if (_handlers.deselectAll) _handlers.deselectAll();
    };
    deselectBtn.addEventListener("click", handler);
    _boundListeners.push({ element: deselectBtn, event: "click", handler });
  }
}
function _setupTerminateSelected() {
  const btn = _container.querySelector('[data-action="terminate-selected"]');
  if (!btn) return;
  const handler = (e) => {
    e.preventDefault();
    const count = _handlers.getSelectedCount ? _handlers.getSelectedCount() : 0;
    if (count === 0) return;
    showConfirmModal({
      id: "psa-confirm-terminate-selected",
      title: "Confirmar Encerramento",
      message: `Deseja encerrar ${count} sess\xE3o(\xF5es)?`,
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      danger: true,
      scope: MODULE_ID
    }).then((confirmed) => {
      if (confirmed && _handlers.terminateSelected) {
        _handlers.terminateSelected();
      }
    });
  };
  btn.addEventListener("click", handler);
  _boundListeners.push({ element: btn, event: "click", handler });
}
function _setupRowExpansion() {
  const triggers = _container.querySelectorAll('[data-action="toggle-expand"]');
  triggers.forEach((trigger) => {
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const token = trigger.dataset.sessionToken;
      if (_handlers.toggleRowExpansion) _handlers.toggleRowExpansion(token);
    };
    trigger.addEventListener("click", handler);
    _boundListeners.push({ element: trigger, event: "click", handler });
  });
}
function _setupDetailsButtons() {
  const buttons = _container.querySelectorAll('[data-action="show-details"]');
  buttons.forEach((btn) => {
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const token = btn.dataset.sessionToken;
      if (_handlers.showDetails) _handlers.showDetails(token);
    };
    btn.addEventListener("click", handler);
    _boundListeners.push({ element: btn, event: "click", handler });
  });
}
function _setupCopySession() {
  const buttons = _container.querySelectorAll('[data-action="copy-session"]');
  buttons.forEach((btn) => {
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const token = btn.dataset.sessionToken;
      if (_handlers.copySessionToken) _handlers.copySessionToken(token);
    };
    btn.addEventListener("click", handler);
    _boundListeners.push({ element: btn, event: "click", handler });
  });
}
function _setupClickOutside() {
  if (_abortController) {
    _abortController.abort();
  }
  _abortController = new AbortController();
  const handler = (e) => {
    const exportDropdown = _container?.querySelector('[data-dropdown="export"]');
    const columnsDropdown = _container?.querySelector('[data-dropdown="columns"]');
    if (exportDropdown && !exportDropdown.contains(e.target)) {
      _exportMenuOpen = false;
      const expMenu = _container.querySelector("[data-export-menu]");
      if (expMenu) expMenu.classList.remove("psa__export-menu--open");
    }
    if (columnsDropdown && !columnsDropdown.contains(e.target)) {
      _columnsMenuOpen = false;
      const colMenu = _container.querySelector("[data-columns-menu]");
      if (colMenu) colMenu.classList.remove("psa__columns-menu--open");
    }
  };
  document.addEventListener("click", handler, { signal: _abortController.signal });
}
function _closeMenus() {
  _exportMenuOpen = false;
  _columnsMenuOpen = false;
  if (_container) {
    const expMenu = _container.querySelector("[data-export-menu]");
    if (expMenu) expMenu.classList.remove("psa__export-menu--open");
    const colMenu = _container.querySelector("[data-columns-menu]");
    if (colMenu) colMenu.classList.remove("psa__columns-menu--open");
  }
}
function announce(container, message) {
  if (!container) return;
  const liveRegion = container.querySelector(".psa__live-region");
  if (liveRegion) {
    liveRegion.textContent = message;
    setTimeout(() => {
      liveRegion.textContent = "";
    }, 3e3);
  }
}
function setupEventHandlers(container, state, handlers, config) {
  setup(container, state, handlers, config);
}
function cleanupEventHandlers() {
  destroy();
}
function getVersion() {
  return VERSION;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    listenersCount: _boundListeners.length,
    menuState: {
      exportOpen: _exportMenuOpen,
      columnsOpen: _columnsMenuOpen
    }
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
var events_default = {
  VERSION,
  MODULE_ID,
  setup,
  init,
  destroy,
  announce,
  setupEventHandlers,
  cleanupEventHandlers,
  getVersion,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  announce,
  cleanupEventHandlers,
  events_default as default,
  destroy,
  getVersion,
  healthCheck,
  info,
  init,
  setup,
  setupEventHandlers
};
