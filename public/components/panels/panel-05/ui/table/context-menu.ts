// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:context-menu
// PURPOSE: Panel-05 Table Context Menu
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ./constants.js
//   getRelativePosition, adjustMenuPosition from ./utils.js
//   TABLE_INTENTS from /core/runtime/events/catalog/table.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ContextMenuMixin — exported value
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TABLE_INTENTS.DELETE_ROW
//   TABLE_INTENTS.EDIT_ROW
//   TABLE_INTENTS.TOGGLE_FAVORITE
//   TABLE_INTENTS.VIEW_ROW
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ICONS } from './constants.js';
import { getRelativePosition, adjustMenuPosition } from './utils.js';
import { TABLE_INTENTS } from '/core/runtime/events/catalog/table.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:table:context-menu';

export const ContextMenuMixin = {
  _onContextMenu(e: MouseEvent) {
    const row = (e.target as Element).closest('tr[data-cliente-id]') as HTMLElement | null;
    if (!row) return;

    e.preventDefault();

    // @ts-expect-error strict migration — TS2339
    this._state.contextMenuTarget = row.dataset.clienteId;
    // @ts-expect-error strict migration — TS2339
    this._selectRow(this._state.contextMenuTarget);

    this._showContextMenu(e.clientX, e.clientY);
  },

  _showContextMenu(x: number, y: number) {
    this._closeContextMenu();
    // @ts-expect-error strict migration — TS2339
    this._state.contextMenuOpen = true;

    // @ts-expect-error strict migration — TS2339
    const isFav = this._state.isFavorito(this._state.contextMenuTarget);
    // @ts-expect-error strict migration — TS2339
    const isExpanded = this._state.isExpanded(this._state.contextMenuTarget);

    const menu = document.createElement('div');
    menu.className = 'p05-context-menu';
    menu.innerHTML = `
            <button class="p05-ctx-item" data-action="ctx-view">
                ${ICONS.eye}<span>Ver detalhes</span><kbd>V</kbd>
            </button>
            <button class="p05-ctx-item" data-action="ctx-edit">
                ${ICONS.edit}<span>Editar</span><kbd>E</kbd>
            </button>
            <button class="p05-ctx-item" data-action="ctx-expand">
                ${ICONS.chevronDown}<span>${isExpanded ? 'Colapsar' : 'Expandir'}</span><kbd>E</kbd>
            </button>
            <div class="p05-ctx-divider"></div>
            <button class="p05-ctx-item" data-action="ctx-fav">
                ${ICONS.star}<span>${isFav ? 'Desfavoritar' : 'Favoritar'}</span><kbd>F</kbd>
            </button>
            <button class="p05-ctx-item" data-action="ctx-copy">
                ${ICONS.copy}<span>Copiar CNPJ</span>
            </button>
            <div class="p05-ctx-divider"></div>
            <button class="p05-ctx-item p05-ctx-danger" data-action="ctx-delete">
                ${ICONS.trash}<span>Excluir</span><kbd>D</kbd>
            </button>
        `;

    // @ts-expect-error strict migration — TS2339
    const { containerWidth, containerHeight } = getRelativePosition({ clientX: x, clientY: y }, this._container);
    // @ts-expect-error strict migration — TS2339
    const rect = this._container.getBoundingClientRect();

    let posX = x - rect.left;
    let posY = y - rect.top;

    const menuWidth = 200;
    const menuHeight = 250;

    const adjusted = adjustMenuPosition(posX, posY, menuWidth, menuHeight, containerWidth, containerHeight);

    menu.style.left = `${adjusted.x}px`;
    menu.style.top = `${adjusted.y}px`;

    // @ts-expect-error strict migration — TS2339
    this._container.appendChild(menu);
    requestAnimationFrame(() => menu.classList.add('p05-visible'));
  },

  _closeContextMenu() {
    // @ts-expect-error strict migration — TS2339
    const menu = this._container.querySelector('.p05-context-menu');
    if (menu) {
      menu.classList.remove('p05-visible');
      setTimeout(() => menu.remove(), 150);
    }
    // @ts-expect-error strict migration — TS2339
    this._state.contextMenuOpen = false;
    // @ts-expect-error strict migration — TS2339
    this._state.contextMenuTarget = null;
  },

  _handleContextMenuAction(action: string) {
    // @ts-expect-error strict migration — TS2339
    const id = this._state.contextMenuTarget;

    switch (action) {
      case 'ctx-view':
        // @ts-expect-error strict migration — TS2339
        this.emit(TABLE_INTENTS.VIEW_ROW, { id });
        break;
      case 'ctx-edit':
        // @ts-expect-error strict migration — TS2339
        this.emit(TABLE_INTENTS.EDIT_ROW, { id });
        break;
      case 'ctx-expand':
        // @ts-expect-error strict migration — TS2339
        this._toggleRowExpand(id);
        break;
      case 'ctx-fav':
        // @ts-expect-error strict migration — TS2339
        this.emit(TABLE_INTENTS.TOGGLE_FAVORITE, { id });
        break;
      case 'ctx-copy':
        // @ts-expect-error strict migration — TS2339
        const cliente = this._state.getDisplayData().find((c: Record<string, unknown>) => String(c.id) === id);
        if (cliente?.cnpj) {
          // @ts-expect-error strict migration — TS2339
          this._copyToClipboard(cliente.cnpj);
        }
        break;
      case 'ctx-delete':
        // @ts-expect-error strict migration — TS2339
        this.emit(TABLE_INTENTS.DELETE_ROW, { id });
        break;
    }

    this._closeContextMenu();
  }
};

export default ContextMenuMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { contextMenuReady: true } }; }
