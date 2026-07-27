// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE4)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.hover-menu
// PURPOSE: Row Hover Menu — Menu de ações rápidas ao passar o mouse sobre item
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   HoverMenu — Factory function
//   DEFAULT_ACTIONS — Default action definitions
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/table/row-hover-menu.js for nav-admin domain
// @changelog
//   10.2.0-MIGRATION-PHASE4: Initial creation — FASE 4 K.3
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.2.0-MIGRATION-PHASE4';
export const MODULE_ID = 'panel-nav-admin.ui.hover-menu';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[HoverMenu]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Default actions for nav-admin items.
 * @type {Array<{id: string, label: string, icon: string, shortcut: string, danger: boolean}>}
 */
export const DEFAULT_ACTIONS = [
  { id: 'edit', label: 'Editar', icon: 'edit', shortcut: 'E', danger: false },
  { id: 'duplicate', label: 'Duplicar', icon: 'copy', shortcut: 'D', danger: false },
  { id: 'toggle', label: 'Ativar/Desativar', icon: 'toggle', shortcut: 'T', danger: false },
  { id: 'move', label: 'Mover p/ seção', icon: 'move', shortcut: 'M', danger: false },
  { id: 'delete', label: 'Excluir', icon: 'trash', shortcut: 'Del', danger: true }
];

/** @private SVG icons map (feather-style) */
const ICONS = {
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  toggle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3"/></svg>',
  move: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
};

/**
 * Factory: creates a hover menu for nav-admin table rows.
 *
 * @param {Object} options
 * @param {HTMLElement} options.tableContainer — Table element or scrollable container
 * @param {Function} options.onAction — Callback(actionId, itemId) when an action is clicked
 * @param {Array} [options.actions] — Custom actions array; defaults to DEFAULT_ACTIONS
 * @param {string} [options.rowSelector='tr[data-id]'] — CSS selector for hoverable rows
 * @param {number} [options.showDelay=0] — Delay in ms before showing menu
 * @param {number} [options.hideDelay=300] — Delay in ms before hiding menu
 * @returns {Object} HoverMenu instance
 */
export function HoverMenu(options: Record<string, unknown> = {}) {
  const tableContainer = options.tableContainer as HTMLElement | undefined;
  const onAction = options.onAction as ((actionId: string, itemId: string) => void) | undefined;
  const actions = (options.actions as typeof DEFAULT_ACTIONS) || DEFAULT_ACTIONS;
  const rowSelector = (options.rowSelector as string) || 'tr[data-id]';
  const showDelay = (options.showDelay as number) || 0;
  const hideDelay = (options.hideDelay as number) ?? 300;

  let _menuEl: HTMLElement | null = null;
  let _currentRowId: string | null = null;
  let _showTimer: ReturnType<typeof setTimeout> | null = null;
  let _hideTimer: ReturnType<typeof setTimeout> | null = null;
  let _abortController: AbortController | null = null;

  /**
   * Initialize: create menu DOM and bind events.
   */
  function init() {
    _createMenuElement();
    _bindTableEvents();
    _log('info', 'Initialized with', actions.length, 'actions');
  }

  /**
   * Create the floating menu element.
   * @private
   */
  function _createMenuElement() {
    _menuEl = document.createElement('div');
    _menuEl.className = 'pna-hover-menu';
    _menuEl.style.cssText = 'position:absolute;z-index:1000;display:none;';
    _menuEl.setAttribute('role', 'menu');
    _menuEl.setAttribute('aria-label', 'Ações do item');

    const buttonsHtml = actions.map((action: typeof DEFAULT_ACTIONS[0]) => {
      const dangerClass = action.danger ? ' pna-hover-menu__btn--danger' : '';
      const icon = (ICONS as Record<string, string>)[action.icon] || '';
      return `<button type="button" class="pna-hover-menu__btn${dangerClass}" data-hover-action="${action.id}" title="${action.label} ${action.shortcut ? '(' + action.shortcut + ')' : ''}" role="menuitem">${icon}<span class="pna-hover-menu__btn-label">${action.label}</span></button>`;
    }).join('');

    _menuEl.innerHTML = buttonsHtml;
    document.body.appendChild(_menuEl);

    // Bind action clicks
    _menuEl.addEventListener('click', (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('[data-hover-action]') as HTMLElement | null;
      if (!btn || !_currentRowId) return;
      const actionId = btn.dataset.hoverAction || '';
      if (typeof onAction === 'function') {
        onAction(actionId, _currentRowId);
      }
      hide();
    });

    // Keep menu visible when hovering over it
    _menuEl.addEventListener('mouseenter', () => {
      _clearHideTimer();
    });

    _menuEl.addEventListener('mouseleave', () => {
      _scheduleHide();
    });
  }

  /**
   * Bind hover events on table rows.
   * @private
   */
  function _bindTableEvents() {
    if (!tableContainer) return;

    _abortController = new AbortController();
    const signal = _abortController.signal;

    tableContainer.addEventListener('mouseenter', (e: Event) => {
      const row = (e.target as HTMLElement).closest(rowSelector) as HTMLElement | null;
      if (!row) return;
      const id = row.dataset.id;
      if (!id) return;

      _clearHideTimer();

      if (showDelay > 0) {
        _showTimer = setTimeout(() => _show(row, id), showDelay);
      } else {
        _show(row, id);
      }
    }, { capture: true, signal });

    tableContainer.addEventListener('mouseleave', (e: Event) => {
      const row = (e.target as HTMLElement).closest(rowSelector);
      if (!row) return;
      _clearShowTimer();
      _scheduleHide();
    }, { capture: true, signal });
  }

  /**
   * Show menu next to a row.
   * @private
   * @param {HTMLElement} row
   * @param {string} id
   */
  function _show(row: HTMLElement, id: string) {
    _currentRowId = id;

    const rowRect = row.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = _menuEl!.offsetHeight || 36;

    let top = rowRect.top + (rowRect.height / 2) - (menuHeight / 2);
    let left = rowRect.right - menuWidth - 8;

    // Viewport boundary checks
    if (top < 0) top = 4;
    if (top + menuHeight > window.innerHeight) top = window.innerHeight - menuHeight - 4;
    if (left < 0) left = rowRect.left + 8;

    _menuEl!.style.top = `${top + window.scrollY}px`;
    _menuEl!.style.left = `${left + window.scrollX}px`;
    _menuEl!.style.display = 'flex';

    row.classList.add('pna-row--hover-active');
  }

  /**
   * Hide the menu.
   */
  function hide() {
    if (_menuEl) _menuEl.style.display = 'none';
    _clearAllTimers();

    if (_currentRowId && tableContainer) {
      const activeRow = tableContainer.querySelector('.pna-row--hover-active');
      if (activeRow) activeRow.classList.remove('pna-row--hover-active');
    }
    _currentRowId = null;
  }

  /** @private */
  function _scheduleHide() {
    _hideTimer = setTimeout(() => hide(), hideDelay);
  }

  /** @private */
  function _clearShowTimer() {
    if (_showTimer) { clearTimeout(_showTimer); _showTimer = null; }
  }

  /** @private */
  function _clearHideTimer() {
    if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }
  }

  /** @private */
  function _clearAllTimers() {
    _clearShowTimer();
    _clearHideTimer();
  }

  /**
   * Update actions dynamically (e.g. per-row context).
   * @param {Array} newActions
   */
  function setActions(newActions: typeof DEFAULT_ACTIONS) {
    if (!_menuEl) return;
    const buttonsHtml = newActions.map((action: typeof DEFAULT_ACTIONS[0]) => {
      const dangerClass = action.danger ? ' pna-hover-menu__btn--danger' : '';
      const icon = (ICONS as Record<string, string>)[action.icon] || '';
      return `<button type="button" class="pna-hover-menu__btn${dangerClass}" data-hover-action="${action.id}" title="${action.label}" role="menuitem">${icon}<span class="pna-hover-menu__btn-label">${action.label}</span></button>`;
    }).join('');
    _menuEl.innerHTML = buttonsHtml;
  }

  /** Destroy menu DOM and remove listeners. */
  function destroy() {
    _clearAllTimers();
    if (_abortController) _abortController.abort();
    if (_menuEl && _menuEl.parentNode) _menuEl.parentNode.removeChild(_menuEl);
    _menuEl = null;
    _currentRowId = null;
  }

  return { init, hide, setActions, destroy };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, defaultActionsCount: DEFAULT_ACTIONS.length };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { HoverMenu, DEFAULT_ACTIONS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
