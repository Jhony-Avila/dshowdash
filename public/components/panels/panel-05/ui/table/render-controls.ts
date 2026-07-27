// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:render-controls
// PURPOSE: Panel-05 Table Render - Controls
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS, TABLE_COLUMNS, DEFAULT_COLUMN_ORDER from ./constants.js
//
// PROVIDES:
//   renderDensityToggle() — exported function
//   renderScrollModeToggle() — exported function
//   renderColumnToggle() — exported function
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

import { ICONS, TABLE_COLUMNS, DEFAULT_COLUMN_ORDER } from './constants.js';

type TableCtx = { _state: { density: string; scrollMode: string; columnOrder: string[]; columnMenuOpen: boolean; columnWidths: Record<string, unknown>; sortColumns: Array<Record<string, unknown>>; isColumnHidden: (id: string) => boolean; getColumnPin: (id: string) => string | null; [key: string]: unknown }; _container: HTMLElement; [key: string]: unknown };

export function renderDensityToggle(ctx: TableCtx) {
  const d = ctx._state.density;
  return `
    <div class="p05-density-toggle" title="Densidade">
      <button class="p05-density-btn ${d === 'compact' ? 'p05-active' : ''}" data-action="set-density" data-density="compact" title="Compacto">${ICONS.minimize}</button>
      <button class="p05-density-btn ${d === 'comfortable' ? 'p05-active' : ''}" data-action="set-density" data-density="comfortable" title="Confortável">${ICONS.menu}</button>
      <button class="p05-density-btn ${d === 'expanded' ? 'p05-active' : ''}" data-action="set-density" data-density="expanded" title="Expandido">${ICONS.alignJustify}</button>
    </div>
  `;
}

export function renderScrollModeToggle(ctx: TableCtx) {
  const m = ctx._state.scrollMode;
  return `
    <div class="p05-scroll-mode-toggle" title="Modo de Scroll">
      <button class="p05-scroll-mode-btn ${m === 'pagination' ? 'p05-active' : ''}" data-action="set-scroll-mode" data-mode="pagination" title="Paginação">Páginas</button>
      <button class="p05-scroll-mode-btn ${m === 'virtual' ? 'p05-active' : ''}" data-action="set-scroll-mode" data-mode="virtual" title="Virtual Scroll">Virtual</button>
      <button class="p05-scroll-mode-btn ${m === 'infinite' ? 'p05-active' : ''}" data-action="set-scroll-mode" data-mode="infinite" title="Infinite Scroll">Infinito</button>
    </div>
  `;
}

export function renderColumnToggle(ctx: TableCtx) {
  const cols = TABLE_COLUMNS.filter(c => c.hideable || c.pinnable || c.reorderable);
  const hasCustomOrder = JSON.stringify(ctx._state.columnOrder) !== JSON.stringify(DEFAULT_COLUMN_ORDER);

  return `
    <div class="p05-column-toggle ${ctx._state.columnMenuOpen ? 'p05-open' : ''}">
      <button class="p05-column-toggle-btn" data-action="toggle-columns" title="Colunas">${ICONS.columns}</button>
      <div class="p05-column-menu">
        <div class="p05-column-menu-title">Colunas Visíveis</div>
        ${cols.filter(c => c.hideable).map(c => `
          <label class="p05-column-item">
            <input type="checkbox" data-column-toggle="${c.id}" ${!ctx._state.isColumnHidden(c.id) ? 'checked' : ''}>
            <span>${c.label}</span>
          </label>
        `).join('')}
        <div class="p05-column-menu-title" style="margin-top:8px;">Fixar Colunas</div>
        ${cols.filter(c => c.pinnable).map(c => {
          const pin = ctx._state.getColumnPin(c.id);
          return `
            <div class="p05-column-pin-toggle">
              <span style="flex:1;font-size:12px;">${c.label}</span>
              <button class="p05-pin-btn ${pin === 'left' ? 'p05-active' : ''}" data-action="pin-left" data-col="${c.id}" title="Fixar esquerda">${ICONS.arrowLeftToLine}</button>
              <button class="p05-pin-btn ${pin === 'right' ? 'p05-active' : ''}" data-action="pin-right" data-col="${c.id}" title="Fixar direita">${ICONS.arrowRightToLine}</button>
              ${pin ? `<button class="p05-pin-btn" data-action="unpin" data-col="${c.id}" title="Desafixar">${ICONS.x}</button>` : ''}
            </div>
          `;
        }).join('')}
        ${hasCustomOrder ? `
          <div class="p05-column-menu-title" style="margin-top:8px;">Ordem</div>
          <button class="p05-reset-order-btn" data-action="reset-order">Restaurar ordem padrão</button>
        ` : ''}
      </div>
    </div>
  `;
}

export default { renderDensityToggle, renderScrollModeToggle, renderColumnToggle };

export const MODULE_ID = 'panel-05:table:render-controls';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { renderControlsReady: true } }; }
