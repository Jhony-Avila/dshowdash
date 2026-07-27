// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P24)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:context-menu
// PURPOSE: Table Engine - Context Menu Mixin
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABLE_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ContextMenuMixin — exported value
//   getEmitMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TABLE_EVENTS } from '/core/runtime/events/catalog/table.events.js';

export const VERSION = '1.2.0-P24';
export const MODULE_ID = 'table-engine:context-menu';

// P24: Métricas de emissão
const _emitMetrics: { total: number; byEvent: Record<string, number>; lastEmitAt: number | null } = { total: 0, byEvent: {}, lastEmitAt: null };
function _trackEmit(eventName: string) { _emitMetrics.total++; _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1; _emitMetrics.lastEmitAt = Date.now(); }

export const ContextMenuMixin = {
  // @ts-expect-error strict migration — TS2339, TS2551
  _initContextMenu() { this._contextMenuTarget = null; this._contextMenuOpen = false; },

  _onContextMenu(e: MouseEvent) {
    const row = (e.target as HTMLElement).closest('tr[data-row-id]') as HTMLElement | null;
    if (!row) return;
    e.preventDefault();
    // @ts-expect-error strict migration — TS2339
    this._contextMenuTarget = row.dataset.rowId;
    // @ts-expect-error strict migration — TS2339
    if (this._selectRow) this._selectRow(this._contextMenuTarget);
    this._showContextMenu(e.clientX, e.clientY);
  },

  _showContextMenu(x: number, y: number) {
    this._closeContextMenu();
    // @ts-expect-error strict migration — TS2551
    this._contextMenuOpen = true;
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const menuItems = this._options.contextMenuItems || [
      { action: 'ctx-view', label: 'Ver detalhes', icon: '👁', key: 'V' },
      { action: 'ctx-edit', label: 'Editar', icon: '✏️', key: 'E' },
      { action: 'ctx-expand', label: 'Expandir', icon: '⬇', key: 'X' },
      { divider: true },
      { action: 'ctx-copy', label: 'Copiar ID', icon: '📋' },
      { divider: true },
      { action: 'ctx-delete', label: 'Excluir', icon: '🗑', key: 'D', danger: true }
    ];
    const menu = document.createElement('div');
    menu.className = `${p}context-menu`;
    menu.innerHTML = menuItems.map((item: Record<string, unknown>) => {
      if (item.divider) return `<div class="${p}ctx-divider"></div>`;
      const dangerClass = item.danger ? ` ${p}ctx-danger` : '';
      return `<button class="${p}ctx-item${dangerClass}" data-action="${item.action}"><span class="${p}ctx-icon">${item.icon || ''}</span><span>${item.label}</span>${item.key ? `<kbd>${item.key}</kbd>` : ''}</button>`;
    }).join('');
    // @ts-expect-error strict migration — TS2339
    const rect = this._container.getBoundingClientRect();
    let posX = x - rect.left;
    let posY = y - rect.top;
    const menuWidth = 200, menuHeight = 250;
    if (posX + menuWidth > rect.width) posX = rect.width - menuWidth - 10;
    if (posY + menuHeight > rect.height) posY = rect.height - menuHeight - 10;
    if (posX < 0) posX = 10;
    if (posY < 0) posY = 10;
    menu.style.left = `${posX}px`;
    menu.style.top = `${posY}px`;
    // @ts-expect-error strict migration — TS2339
    this._container.appendChild(menu);
    requestAnimationFrame(() => { menu.classList.add(`${p}visible`); });
  },

  _closeContextMenu() {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const menu = this._container.querySelector(`.${p}context-menu`);
    if (menu) {
      menu.classList.remove(`${p}visible`);
      setTimeout(() => { menu.remove(); }, 150);
    }
    // @ts-expect-error strict migration — TS2551
    this._contextMenuOpen = false;
    // @ts-expect-error strict migration — TS2339
    this._contextMenuTarget = null;
  },

  _handleContextMenuAction(action: string) {
    // @ts-expect-error strict migration — TS2339
    const id = this._contextMenuTarget;
    switch (action) {
      // @ts-expect-error strict migration — TS2339
      case 'ctx-view': _trackEmit('VIEW'); this.emit(TABLE_EVENTS.VIEW, { id, source: MODULE_ID, timestamp: Date.now() }); break;
      // @ts-expect-error strict migration — TS2339
      case 'ctx-edit': _trackEmit('EDIT'); this.emit(TABLE_EVENTS.EDIT, { id, source: MODULE_ID, timestamp: Date.now() }); break;
      // @ts-expect-error strict migration — TS2339
      case 'ctx-expand': if (this._toggleRowExpand) this._toggleRowExpand(id); break;
      case 'ctx-copy':
        // @ts-expect-error strict migration — TS2339
        const data = this._state.getFilteredData();
        const item = data.find((c: Record<string, unknown>) => String(c.id) === id);
        if (item && item.id && this._copyToClipboard) this._copyToClipboard(String(item.id));
        break;
      // @ts-expect-error strict migration — TS2339
      case 'ctx-delete': _trackEmit('DELETE'); this.emit(TABLE_EVENTS.DELETE, { id, source: MODULE_ID, timestamp: Date.now() }); break;
      // @ts-expect-error strict migration — TS2339
      default: _trackEmit('CONTEXT_ACTION'); this.emit(TABLE_EVENTS.CONTEXT_ACTION, { action, id, source: MODULE_ID, timestamp: Date.now() }); break;
    }
    this._closeContextMenu();
  },

  _copyToClipboard(text: string) {
    const self = this;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        _trackEmit('TOAST');
        // @ts-expect-error strict migration — TS2339
        self.emit(TABLE_EVENTS.TOAST, { type: 'success', message: 'Copiado!', source: MODULE_ID, timestamp: Date.now() });
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      _trackEmit('TOAST');
      // @ts-expect-error strict migration — TS2339
      self.emit(TABLE_EVENTS.TOAST, { type: 'success', message: 'Copiado!', source: MODULE_ID, timestamp: Date.now() });
    }
  }
};

export function getEmitMetrics() { return Object.assign({}, _emitMetrics); }
export default ContextMenuMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION, emitMetrics: getEmitMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, emitMetrics: getEmitMetrics(), p24Instrumented: true, timestamp: Date.now() }; }
