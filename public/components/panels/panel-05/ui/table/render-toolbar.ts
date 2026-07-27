// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:render-toolbar
// PURPOSE: Panel-05 Table Render - Toolbar
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ./constants.js
//   escapeHtml from ./utils.js
//
// PROVIDES:
//   renderSearchBox() — exported function
//   renderExportButton() — exported function
//   renderBulkActionsBar() — exported function
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
import { escapeHtml } from './utils.js';

type TableCtx = { _state: { searchQuery: string; selectedIds: Set<unknown>; [key: string]: unknown }; [key: string]: unknown };

export function renderSearchBox(ctx: TableCtx) {
  return `
    <div class="p05-search-box">
      <span class="p05-search-icon">${ICONS.search}</span>
      <input type="text" class="p05-search-input" placeholder="Buscar cliente... (Ctrl+F)" value="${escapeHtml(ctx._state.searchQuery)}">
      <span class="p05-search-info"></span>
      ${ctx._state.searchQuery ? `<button class="p05-search-clear" data-action="clear-search" title="Limpar busca">${ICONS.x}</button>` : ''}
    </div>
  `;
}

export function renderExportButton(ctx: TableCtx) {
  return `
    <div class="p05-export-dropdown">
      <button class="p05-export-btn" title="Exportar CSV">${ICONS.download}<span>Exportar</span></button>
      <div class="p05-export-menu">
        <button class="p05-export-item" data-action="export-all">${ICONS.fileText} Exportar todos</button>
        <button class="p05-export-item" data-action="export-selected" ${!ctx._state.selectedIds.size ? 'disabled' : ''}>${ICONS.checkSquare} Exportar selecionados (${ctx._state.selectedIds.size})</button>
      </div>
    </div>
  `;
}

export function renderBulkActionsBar(ctx: TableCtx) {
  const count = ctx._state.selectedIds.size;
  return `
    <div class="p05-bulk-bar ${count > 0 ? 'p05-visible' : ''}">
      <div class="p05-bulk-left">
        <span class="p05-bulk-count">${count} selecionado${count > 1 ? 's' : ''}</span>
        <button class="p05-bulk-btn" data-action="select-all-page" title="Selecionar página">${ICONS.checkSquare} Página</button>
        <button class="p05-bulk-btn" data-action="clear-selection" title="Limpar seleção">${ICONS.x} Limpar</button>
      </div>
      <div class="p05-bulk-right">
        <button class="p05-bulk-btn p05-bulk-export" data-action="bulk-export" title="Exportar selecionados">${ICONS.download} Exportar</button>
        <button class="p05-bulk-btn p05-bulk-delete" data-action="bulk-delete" title="Excluir selecionados">${ICONS.trash} Excluir</button>
      </div>
    </div>
  `;
}

export default { renderSearchBox, renderExportButton, renderBulkActionsBar };

export const MODULE_ID = 'panel-05:table:render-toolbar';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { renderToolbarReady: true } }; }
