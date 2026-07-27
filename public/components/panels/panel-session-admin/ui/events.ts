

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-session-admin-events
// PURPOSE: Panel Session Admin - Events Enterprise AAA Ultimate
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   showConfirmModal from /components/overlay-layer/adapters/modal-adapter.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setup() — exported function
//   init() — exported function
//   destroy() — exported function
//   announce() — exported function
//   setupEventHandlers() — exported function
//   cleanupEventHandlers() — exported function
//   getVersion() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
//   'input'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { showConfirmModal } from '/components/overlay-layer/adapters/modal-adapter.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-session-admin-events';

let _container: HTMLElement | null = null;
let _handlers: Record<string, ((...args: unknown[]) => unknown) | undefined> = {};
let _config: Record<string, any> = {};
let _boundListeners: Array<{ element: Element; event: string; handler: EventListener }> = [];
let _exportMenuOpen = false;
let _columnsMenuOpen = false;
let _abortController: AbortController | null = null;

export function setup(container: HTMLElement, state: Record<string, unknown>, handlers: Record<string, ((...args: unknown[]) => unknown) | undefined>, config: Record<string, unknown> = {}) {
  if (!container) return;

  _container = container;
  _handlers = handlers;
  _config = config;

  destroy();

  _setupRefreshButton();
  _setupTerminateOthersButton();
  _setupTerminateButtons();
  _setupFilters();
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

export function init(container: HTMLElement, handlers: Record<string, ((...args: unknown[]) => unknown) | undefined>) {
  setup(container, {}, handlers, {});
}

export function destroy() {
  _boundListeners.forEach(item => {
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
  const btn = _container!.querySelector('[data-action="refresh"]');
  if (!btn) return;

  const handler = (e: Event) => {
    e.preventDefault();
    if (_handlers.refresh) _handlers.refresh();
  };

  btn.addEventListener('click', handler);
  _boundListeners.push({ element: btn, event: 'click', handler });
}

function _setupTerminateOthersButton() {
  const btn = _container!.querySelector('[data-action="terminate-others"]');
  if (!btn) return;

  const handler = (e: Event) => {
    e.preventDefault();

    showConfirmModal({
      id: 'psa-confirm-terminate-all',
      title: _config.i18n?.confirmTerminateTitle || 'Confirmar Encerramento',
      message: _config.i18n?.confirmTerminateOthers || 'Deseja encerrar todas as outras sessões?',
      confirmText: _config.i18n?.confirm || 'Confirmar',
      cancelText: _config.i18n?.cancel || 'Cancelar',
      danger: true,
      scope: MODULE_ID
    }).then(confirmed => {
      if (confirmed && _handlers.terminateAllOthers) {
        _handlers.terminateAllOthers();
      }
    });
  };

  btn.addEventListener('click', handler);
  _boundListeners.push({ element: btn, event: 'click', handler });
}

function _setupTerminateButtons() {
  const buttons = _container!.querySelectorAll('[data-action="terminate"]');

  buttons.forEach(btn => {
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      const sessionToken = (btn as HTMLElement).dataset.sessionToken;
      if (!sessionToken) return;

      showConfirmModal({
        id: 'psa-confirm-terminate-one',
        title: 'Confirmar Encerramento',
        message: 'Deseja encerrar esta sessão?',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        danger: true,
        scope: MODULE_ID
      }).then(confirmed => {
        if (confirmed && _handlers.terminateSession) {
          _handlers.terminateSession(sessionToken);
        }
      });
    };

    btn.addEventListener('click', handler);
    _boundListeners.push({ element: btn, event: 'click', handler });
  });
}

function _setupFilters() {
  const statusSelect = _container!.querySelector('[data-filter="status"]');
  if (statusSelect) {
    const handler = (e: Event) => {
      if (_handlers.setFilter) _handlers.setFilter('status', (e.target as HTMLInputElement).value);
    };
    statusSelect.addEventListener('change', handler);
    _boundListeners.push({ element: statusSelect, event: 'change', handler });
  }

  const searchInput = _container!.querySelector('[data-filter="search"]');
  if (searchInput) {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handler = (e: Event) => {
      // @ts-expect-error strict migration — TS2769
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (_handlers.setFilter) _handlers.setFilter('search', (e.target as HTMLInputElement).value);
      }, 300);
    };
    searchInput.addEventListener('input', handler);
    _boundListeners.push({ element: searchInput, event: 'input', handler });
  }
}

function _setupAutoRefreshToggle() {
  const btn = _container!.querySelector('[data-action="toggle-auto-refresh"]');
  if (!btn) return;

  const handler = (e: Event) => {
    e.preventDefault();
    if (_handlers.toggleAutoRefresh) _handlers.toggleAutoRefresh();
  };

  btn.addEventListener('click', handler);
  _boundListeners.push({ element: btn, event: 'click', handler });
}

function _setupExportMenu() {
  const toggleBtn = _container!.querySelector('[data-action="toggle-export-menu"]');
  const menu = _container!.querySelector('[data-export-menu]');

  if (toggleBtn && menu) {
    const toggleHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      _exportMenuOpen = !_exportMenuOpen;
      _columnsMenuOpen = false;
      menu.classList.toggle('psa__export-menu--open', _exportMenuOpen);
      const colMenu = _container!.querySelector('[data-columns-menu]');
      if (colMenu) colMenu.classList.remove('psa__columns-menu--open');
    };
    toggleBtn.addEventListener('click', toggleHandler);
    _boundListeners.push({ element: toggleBtn, event: 'click', handler: toggleHandler });
  }

  const actions = { 'export-csv': 'exportCSV', 'export-json': 'exportJSON', 'copy-clipboard': 'copyToClipboard', 'print': 'printSessions' };
  Object.entries(actions).forEach(([action, method]) => {
    const btn = _container!.querySelector(`[data-action="${action}"]`);
    if (btn) {
      const handler = (e: Event) => {
        e.preventDefault();
        _closeMenus();
        if (_handlers[method]) _handlers[method]();
      };
      btn.addEventListener('click', handler);
      _boundListeners.push({ element: btn, event: 'click', handler });
    }
  });
}

function _setupColumnsMenu() {
  const toggleBtn = _container!.querySelector('[data-action="toggle-columns-menu"]');
  const menu = _container!.querySelector('[data-columns-menu]');

  if (toggleBtn && menu) {
    const toggleHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      _columnsMenuOpen = !_columnsMenuOpen;
      _exportMenuOpen = false;
      menu.classList.toggle('psa__columns-menu--open', _columnsMenuOpen);
      const expMenu = _container!.querySelector('[data-export-menu]');
      if (expMenu) expMenu.classList.remove('psa__export-menu--open');
    };
    toggleBtn.addEventListener('click', toggleHandler);
    _boundListeners.push({ element: toggleBtn, event: 'click', handler: toggleHandler });
  }

  const checkboxes = _container!.querySelectorAll('[data-action="toggle-column"]');
  checkboxes.forEach(cb => {
    const handler = (e: Event) => {
      const col = (cb as HTMLElement).dataset.column;
      if (_handlers.toggleColumn) _handlers.toggleColumn(col, (e.target as HTMLInputElement).checked);
    };
    cb.addEventListener('change', handler);
    _boundListeners.push({ element: cb, event: 'change', handler });
  });

  const showAllBtn = _container!.querySelector('[data-action="show-all-columns"]');
  if (showAllBtn) {
    const handler = (e: Event) => {
      e.preventDefault();
      if (_handlers.showAllColumns) _handlers.showAllColumns();
    };
    showAllBtn.addEventListener('click', handler);
    _boundListeners.push({ element: showAllBtn, event: 'click', handler });
  }

  const resetBtn = _container!.querySelector('[data-action="reset-columns"]');
  if (resetBtn) {
    const handler = (e: Event) => {
      e.preventDefault();
      if (_handlers.resetColumns) _handlers.resetColumns();
    };
    resetBtn.addEventListener('click', handler);
    _boundListeners.push({ element: resetBtn, event: 'click', handler });
  }
}

function _setupInlineFilters() {
  const toggleBtn = _container!.querySelector('[data-action="toggle-inline-filters"]');
  if (toggleBtn) {
    const handler = (e: Event) => {
      e.preventDefault();
      if (_handlers.toggleInlineFilters) _handlers.toggleInlineFilters();
    };
    toggleBtn.addEventListener('click', handler);
    _boundListeners.push({ element: toggleBtn, event: 'click', handler });
  }

  const inputs = _container!.querySelectorAll('[data-inline-filter]');
  inputs.forEach(input => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handler = (e: Event) => {
      // @ts-expect-error strict migration — TS2769
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (_handlers.setInlineFilter) _handlers.setInlineFilter((input as HTMLElement).dataset.inlineFilter, (e.target as HTMLInputElement).value);
      }, 300);
    };
    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
    _boundListeners.push({ element: input, event: 'input', handler });
    _boundListeners.push({ element: input, event: 'change', handler });
  });
}

function _setupFullscreenToggle() {
  const btn = _container!.querySelector('[data-action="toggle-fullscreen"]');
  if (!btn) return;

  const handler = (e: Event) => {
    e.preventDefault();
    if (_handlers.toggleFullscreen) _handlers.toggleFullscreen();
  };
  btn.addEventListener('click', handler);
  _boundListeners.push({ element: btn, event: 'click', handler });
}

function _setupSelectionHandlers() {
  const selectAllCheckbox = _container!.querySelector('[data-action="select-all"]');
  if (selectAllCheckbox) {
    const handler = (e: Event) => {
      if ((e.target as HTMLInputElement).checked) {
        if (_handlers.selectAll) _handlers.selectAll();
      } else {
        if (_handlers.deselectAll) _handlers.deselectAll();
      }
    };
    selectAllCheckbox.addEventListener('change', handler);
    _boundListeners.push({ element: selectAllCheckbox, event: 'change', handler });
  }

  const rowCheckboxes = _container!.querySelectorAll('[data-action="select-row"]');
  rowCheckboxes.forEach(cb => {
    const handler = () => {
      if (_handlers.toggleRowSelection) _handlers.toggleRowSelection((cb as HTMLElement).dataset.sessionToken);
    };
    cb.addEventListener('change', handler);
    _boundListeners.push({ element: cb, event: 'change', handler });
  });

  const deselectBtn = _container!.querySelector('[data-action="deselect-all"]');
  if (deselectBtn) {
    const handler = (e: Event) => {
      e.preventDefault();
      if (_handlers.deselectAll) _handlers.deselectAll();
    };
    deselectBtn.addEventListener('click', handler);
    _boundListeners.push({ element: deselectBtn, event: 'click', handler });
  }
}

function _setupTerminateSelected() {
  const btn = _container!.querySelector('[data-action="terminate-selected"]');
  if (!btn) return;

  const handler = (e: Event) => {
    e.preventDefault();
    const count = _handlers.getSelectedCount ? _handlers.getSelectedCount() : 0;
    if (count === 0) return;

    showConfirmModal({
      id: 'psa-confirm-terminate-selected',
      title: 'Confirmar Encerramento',
      message: `Deseja encerrar ${count} sessão(ões)?`,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      danger: true,
      scope: MODULE_ID
    }).then(confirmed => {
      if (confirmed && _handlers.terminateSelected) {
        _handlers.terminateSelected();
      }
    });
  };

  btn.addEventListener('click', handler);
  _boundListeners.push({ element: btn, event: 'click', handler });
}

function _setupRowExpansion() {
  const triggers = _container!.querySelectorAll('[data-action="toggle-expand"]');

  triggers.forEach(trigger => {
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const token = (trigger as HTMLElement).dataset.sessionToken;
      if (_handlers.toggleRowExpansion) _handlers.toggleRowExpansion(token);
    };
    trigger.addEventListener('click', handler);
    _boundListeners.push({ element: trigger, event: 'click', handler });
  });
}

function _setupDetailsButtons() {
  const buttons = _container!.querySelectorAll('[data-action="show-details"]');

  buttons.forEach(btn => {
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const token = (btn as HTMLElement).dataset.sessionToken;
      if (_handlers.showDetails) _handlers.showDetails(token);
    };
    btn.addEventListener('click', handler);
    _boundListeners.push({ element: btn, event: 'click', handler });
  });
}

function _setupCopySession() {
  const buttons = _container!.querySelectorAll('[data-action="copy-session"]');

  buttons.forEach(btn => {
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const token = (btn as HTMLElement).dataset.sessionToken;
      if (_handlers.copySessionToken) _handlers.copySessionToken(token);
    };
    btn.addEventListener('click', handler);
    _boundListeners.push({ element: btn, event: 'click', handler });
  });
}

function _setupClickOutside() {
  if (_abortController) {
    _abortController.abort();
  }
  _abortController = new AbortController();

  const handler = (e: Event) => {
    const exportDropdown = _container?.querySelector('[data-dropdown="export"]');
    const columnsDropdown = _container?.querySelector('[data-dropdown="columns"]');

    if (exportDropdown && !exportDropdown.contains(e.target as Node)) {
      _exportMenuOpen = false;
      const expMenu = _container!.querySelector('[data-export-menu]');
      if (expMenu) expMenu.classList.remove('psa__export-menu--open');
    }
    if (columnsDropdown && !columnsDropdown.contains(e.target as Node)) {
      _columnsMenuOpen = false;
      const colMenu = _container!.querySelector('[data-columns-menu]');
      if (colMenu) colMenu.classList.remove('psa__columns-menu--open');
    }
  };

  document.addEventListener('click', handler, { signal: _abortController.signal });
}

function _closeMenus() {
  _exportMenuOpen = false;
  _columnsMenuOpen = false;
  if (_container) {
    const expMenu = _container.querySelector('[data-export-menu]');
    if (expMenu) expMenu.classList.remove('psa__export-menu--open');
    const colMenu = _container.querySelector('[data-columns-menu]');
    if (colMenu) colMenu.classList.remove('psa__columns-menu--open');
  }
}

export function announce(container: HTMLElement, message: string) {
  if (!container) return;
  const liveRegion = container.querySelector('.psa__live-region');
  if (liveRegion) {
    liveRegion.textContent = message;
    setTimeout(() => { liveRegion.textContent = ''; }, 3000);
  }
}

export function setupEventHandlers(container: HTMLElement, state: Record<string, unknown>, handlers: Record<string, ((...args: unknown[]) => unknown) | undefined>, config: Record<string, unknown>) {
  setup(container, state, handlers, config);
}

export function cleanupEventHandlers() {
  destroy();
}

export function getVersion() {
  return VERSION;
}

export function info() {
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

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      containerBound: _container !== null,
      handlersReady: Object.keys(_handlers).length > 0,
      listenersActive: _boundListeners.length > 0
    }
  };
}

export default {
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
