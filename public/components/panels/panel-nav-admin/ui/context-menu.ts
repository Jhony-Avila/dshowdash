// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE3)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.context-menu
// PURPOSE: Context Menu — Menu de contexto (right-click) para itens de navegação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID, injectPorts, getPorts
//   ContextMenu — exported class
//   createContextMenu() — factory
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/context-menu.js for nav-admin items
// @changelog
//   10.1.0-MIGRATION-PHASE3: Initial creation — FASE 3 B.4
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.1.0-MIGRATION-PHASE3';
export const MODULE_ID = 'panel-nav-admin.ui.context-menu';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

/**
 * Default menu items for nav-admin context menu.
 * @private
 */
const DEFAULT_ACTIONS = [
  { id: 'edit', label: 'Editar', icon: '✏️' },
  { id: 'duplicate', label: 'Duplicar', icon: '⧉' },
  { id: 'divider-1', divider: true },
  { id: 'move-section', label: 'Mover para seção...', icon: '↗' },
  { id: 'toggle-active', label: 'Ativar/Desativar', icon: '⊘' },
  { id: 'toggle-visible', label: 'Mostrar/Ocultar', icon: '👁' },
  { id: 'divider-2', divider: true },
  { id: 'copy-config', label: 'Copiar configuração', icon: '📋' },
  { id: 'copy-id', label: 'Copiar ID', icon: '#' },
  { id: 'divider-3', divider: true },
  { id: 'delete', label: 'Excluir', icon: '🗑', danger: true }
];

/**
 * ContextMenu — Menu de contexto posicional.
 */
export class ContextMenu {
  [key: string]: any;
  /**
   * @param {Object} [options]
   * @param {Function} [options.onAction] — (action: string, item: Object) => void
   * @param {Array} [options.actions] — Custom actions array
   */
  constructor(options: Record<string, unknown> = {}) {
    this.onAction = options.onAction || (() => {});
    this.actions = options.actions || DEFAULT_ACTIONS;
    this._el = null;
    this._currentItem = null;
    this._abortController = null;
  }

  /** @private Create the menu DOM element */
  _createEl() {
    if (this._el) return;
    if (typeof document === 'undefined') return;

    this._el = document.createElement('div');
    this._el.className = 'pna-context-menu';
    this._el.setAttribute('role', 'menu');
    this._el.style.display = 'none';
    document.body.appendChild(this._el);
  }

  /**
   * Show the context menu at a position.
   * @param {number} x — Pixel x coordinate
   * @param {number} y — Pixel y coordinate
   * @param {Object} item — Nav item data
   */
  show(x: number, y: number, item: Record<string, unknown>) {
    this._createEl();
    if (!this._el) return;

    this._currentItem = item;

    // Render menu items
    let html = '';
    for (const action of this.actions) {
      if (action.divider) {
        html += '<div class="pna-context-menu__divider"></div>';
        continue;
      }

      // Conditional label for toggle actions
      let label = action.label;
      if (action.id === 'toggle-active' && item) {
        label = item.isActive === false ? 'Ativar' : 'Desativar';
      }
      if (action.id === 'toggle-visible' && item) {
        label = item.isVisible === false ? 'Mostrar' : 'Ocultar';
      }

      const dangerClass = action.danger ? ' pna-context-menu__item--danger' : '';
      html += '<button class="pna-context-menu__item' + dangerClass + '" data-action="' + action.id + '" role="menuitem">' +
        '<span class="pna-context-menu__icon">' + (action.icon || '') + '</span>' +
        '<span class="pna-context-menu__label">' + label + '</span>' +
      '</button>';
    }

    this._el.innerHTML = html;
    this._el.style.display = 'block';

    // Position with boundary detection
    const menuRect = this._el.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    let posX = x;
    let posY = y;
    if (x + menuRect.width > winW) posX = winW - menuRect.width - 8;
    if (y + menuRect.height > winH) posY = winH - menuRect.height - 8;
    if (posX < 0) posX = 8;
    if (posY < 0) posY = 8;

    this._el.style.left = posX + 'px';
    this._el.style.top = posY + 'px';

    // Bind close handlers
    this._abortController = new AbortController();
    const signal = this._abortController.signal;

    this._el.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
      if (btn) {
        this.onAction(btn.dataset.action, this._currentItem);
        this.close();
      }
    }, { signal });

    document.addEventListener('click', (e) => {
      if (!this._el.contains(e.target)) this.close();
    }, { signal, capture: true });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    }, { signal });

    document.addEventListener('contextmenu', (e) => {
      if (!this._el.contains(e.target)) this.close();
    }, { signal });
  }

  /** Close and hide the menu. */
  close() {
    if (this._el) {
      this._el.style.display = 'none';
      this._el.innerHTML = '';
    }
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._currentItem = null;
  }

  /** @returns {boolean} Whether menu is currently visible */
  isOpen() {
    return this._el ? this._el.style.display !== 'none' : false;
  }

  /** Cleanup — remove from DOM */
  destroy() {
    this.close();
    if (this._el && this._el.parentNode) {
      this._el.remove();
    }
    this._el = null;
  }
}

/**
 * Factory to create a ContextMenu instance.
 * @param {Object} [options]
 * @returns {ContextMenu}
 */
export function createContextMenu(options: Record<string, unknown> = {}) {
  return new ContextMenu(options);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, defaultActions: DEFAULT_ACTIONS.filter(a => !a.divider).length };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default { ContextMenu, createContextMenu, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
