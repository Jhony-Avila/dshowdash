// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:render-footer
// PURPOSE: Panel-05 Table Render - Footer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ./constants.js
//
// PROVIDES:
//   updateFooter() — exported function
//   renderPagination() — exported function
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

type TableCtx = { _state: { refs: Record<string, unknown>; getDisplayData: () => Array<Record<string, unknown>>; scrollMode: string; infiniteHasMore: boolean; getTotalPages: () => number; page: number; [key: string]: unknown }; [key: string]: unknown };

export function updateFooter(ctx: TableCtx) {
  const footer = ctx._state.refs.footer as HTMLElement | null;
  if (!footer) return;

  const displayData = ctx._state.getDisplayData();

  if (ctx._state.scrollMode === 'virtual') {
    footer.innerHTML = `<div class="p05-virtual-info"><span>${displayData.length} registros</span><span class="p05-scroll-mode-label">Virtual Scroll</span></div>`;
  } else if (ctx._state.scrollMode === 'infinite') {
    footer.innerHTML = `<div class="p05-infinite-info">${displayData.length} registros carregados${ctx._state.infiniteHasMore ? '' : ' (todos)'}</div>`;
  } else {
    const totalPages = ctx._state.getTotalPages();
    footer.innerHTML = renderPagination(ctx._state.page, totalPages, displayData.length);
  }
}

export function renderPagination(page: number, total: number, count: number) {
  if (total <= 1) {
    return `<div class="p05-pagination"><span class="p05-pagination-info">${count} registros</span></div>`;
  }

  const pages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(total, page + 2); i++) {
    pages.push(i);
  }

  return `
    <nav class="p05-pagination">
      <span class="p05-pagination-info">${count} registros</span>
      <div class="p05-pagination-controls">
        <button class="p05-btn-page" data-action="page" data-page="1" ${page === 1 ? 'disabled' : ''}>Primeira</button>
        <button class="p05-btn-page" data-action="page" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>${ICONS.chevronLeft}</button>
        ${pages.map(p => `<button class="p05-btn-page ${p === page ? 'p05-active' : ''}" data-action="page" data-page="${p}">${p}</button>`).join('')}
        <button class="p05-btn-page" data-action="page" data-page="${page + 1}" ${page === total ? 'disabled' : ''}>${ICONS.chevronRight}</button>
        <button class="p05-btn-page" data-action="page" data-page="${total}" ${page === total ? 'disabled' : ''}>Última</button>
      </div>
    </nav>
  `;
}

export default { updateFooter, renderPagination };

export const MODULE_ID = 'panel-05:table:render-footer';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { renderFooterReady: true } }; }
