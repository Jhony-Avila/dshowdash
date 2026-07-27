// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:render-shell
// PURPOSE: Panel-05 Table Render - Shell
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ./constants.js
//   renderSearchBox, renderExportButton, renderBulkActionsBar from ./render-toolb...
//   renderDensityToggle, renderScrollModeToggle, renderColumnToggle from ./render...
//   renderTableHeaderByCol from ./render-header.js
//
// PROVIDES:
//   renderShell() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ICONS } from './constants.js';
import { renderSearchBox, renderExportButton, renderBulkActionsBar } from './render-toolbar.js';
import { renderDensityToggle, renderScrollModeToggle, renderColumnToggle } from './render-controls.js';
import { renderTableHeaderByCol } from './render-header.js';

type TableCtx = { _state: { shellRendered: boolean; refs: Record<string, unknown>; scrollMode: string; density: string; searchQuery: string; selectedIds: Set<unknown>; columnOrder: string[]; columnMenuOpen: boolean; isColumnHidden: (id: string) => boolean; getColumnPin: (id: string) => string | null; columnWidths: Record<string, unknown>; sortColumns: Array<Record<string, unknown>>; getDisplayData?: () => Array<Record<string, unknown>>; [key: string]: unknown }; _container: HTMLElement; _getOrderedColumns: () => Array<Record<string, unknown>>; [key: string]: unknown };

export function renderShell(ctx: TableCtx) {
  if (ctx._state.shellRendered && ctx._state.refs.tbody) return;

  const orderedCols = ctx._getOrderedColumns();
  const scrollMode = ctx._state.scrollMode;

  const containerClass = scrollMode === 'virtual'
    ? 'p05-table-container p05-virtual-scroll p05-sticky-header'
    : scrollMode === 'infinite'
      ? 'p05-table-container p05-infinite-scroll p05-sticky-header'
      : 'p05-table-container p05-sticky-header';

  ctx._container.innerHTML = `
    ${renderBulkActionsBar(ctx)}
    <div class="p05-table-toolbar">
      ${renderSearchBox(ctx)}
      <div class="p05-toolbar-right">
        <button class="p05-shortcuts-btn" data-action="show-shortcuts" title="Atalhos de teclado (?)">${ICONS.keyboard}</button>
        ${renderExportButton(ctx)}
        ${renderDensityToggle(ctx)}
        ${renderScrollModeToggle(ctx)}
        ${renderColumnToggle(ctx)}
      </div>
    </div>
    <div class="${containerClass}">
      <table class="p05-table p05-density-${ctx._state.density}" role="grid">
        <thead>
          <tr role="row">
            ${orderedCols.map((col: Record<string, unknown>) => renderTableHeaderByCol(ctx, col)).join('')}
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <div class="p05-table-footer" data-region="footer"></div>
  `;

  ctx._state.refs = {
    tbody: ctx._container.querySelector('.p05-table tbody'),
    thead: ctx._container.querySelector('.p05-table thead'),
    table: ctx._container.querySelector('.p05-table'),
    container: ctx._container.querySelector('.p05-table-container'),
    footer: ctx._container.querySelector('[data-region="footer"]'),
    bulkBar: ctx._container.querySelector('.p05-bulk-bar'),
    searchInput: ctx._container.querySelector('.p05-search-input'),
    searchInfo: ctx._container.querySelector('.p05-search-info')
  };

  ctx._state.shellRendered = true;
}

export default { renderShell };

export const MODULE_ID = 'panel-05:table:render-shell';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { renderShellReady: true } }; }
