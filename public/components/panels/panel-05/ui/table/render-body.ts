// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:render-body
// PURPOSE: Panel-05 Table Render - Body
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ./constants.js
//   escapeHtml from ./utils.js
//   createRowElement, updateRowElement from ./render-rows.js
//
// PROVIDES:
//   updateTableBody() — exported function
//   diffUpdateRows() — exported function
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
import { createRowElement, updateRowElement } from './render-rows.js';

type TableCtxState = { refs: Record<string, unknown>; getDisplayData: () => Array<Record<string, unknown>>; searchQuery: string; scrollMode: string; page: number; perPage: number; isSelected: (id: string) => boolean; isFavorito: (id: string) => boolean; isExpanded: (id: string) => boolean; getColumnPin: (colId: string) => string | null; [key: string]: unknown };
type TableCtx = { _state: TableCtxState; _container: HTMLElement; _getOrderedColumns: () => Array<Record<string, unknown>>; _updateVirtualRows: () => void; _updateRowSelection: () => void; _updateCheckboxes: () => void; [key: string]: unknown };

export function updateTableBody(ctx: TableCtx) {
  const tbody = ctx._state.refs.tbody as HTMLElement | null;
  if (!tbody) return;

  const displayData = ctx._state.getDisplayData();
  const orderedCols = ctx._getOrderedColumns();

  if (!displayData?.length) {
    if (ctx._state.searchQuery) {
      tbody.innerHTML = `<tr><td colspan="${orderedCols.length}" class="p05-no-results"><span class="p05-no-results-icon">${ICONS.search}</span><span>Nenhum resultado para "${escapeHtml(ctx._state.searchQuery)}"</span></td></tr>`;
    } else {
      tbody.innerHTML = `<tr><td colspan="${orderedCols.length}" class="p05-table-empty-row"><span class="p05-empty-icon">${ICONS.inbox}</span><span>Nenhum cliente encontrado</span></td></tr>`;
    }
    return;
  }

  if (ctx._state.scrollMode === 'virtual') {
    ctx._updateVirtualRows();
    return;
  }

  let dataToRender;
  if (ctx._state.scrollMode === 'infinite') {
    dataToRender = displayData;
  } else {
    const start = (ctx._state.page - 1) * ctx._state.perPage;
    dataToRender = displayData.slice(start, start + ctx._state.perPage);
  }

  diffUpdateRows(ctx, tbody, dataToRender, 0, orderedCols, null, null);
  ctx._updateRowSelection();
  ctx._updateCheckboxes();
}

export function diffUpdateRows(ctx: TableCtx, tbody: HTMLElement, newData: Array<Record<string, unknown>>, startIdx: number, orderedCols: Array<Record<string, unknown>>, topRow: HTMLElement | null, bottomRow: HTMLElement | null) {
  const currentRows = Array.from(tbody.querySelectorAll('tr[data-cliente-id]'));

  const currentIds = new Set(currentRows.map(r => (r as HTMLElement).dataset.clienteId));
  const newIds = new Set(newData.map(c => String(c.id)));

  currentRows.forEach(row => {
    const rowEl = row as HTMLElement;
    // @ts-expect-error strict migration — TS2345
    if (!newIds.has(rowEl.dataset.clienteId)) {
      const expRow = tbody.querySelector(`tr.p05-tr-expansion[data-expand-id="${rowEl.dataset.clienteId}"]`);
      if (expRow) expRow.remove();

      rowEl.remove();
    }
  });

  let insertBefore: ChildNode | null = bottomRow;
  newData.forEach((item: Record<string, unknown>, i: number) => {
    const id = String(item.id);
    let row: HTMLElement | null = tbody.querySelector(`tr[data-cliente-id="${id}"]`);

    if (!row) {
      row = createRowElement(ctx, item, startIdx + i, orderedCols);
      tbody.insertBefore(row, insertBefore);
    } else {
      updateRowElement(ctx, row as HTMLElement, item, startIdx + i, orderedCols);
    }

    const expRow = tbody.querySelector(`tr.p05-tr-expansion[data-expand-id="${id}"]`);
    if (expRow && expRow.previousSibling !== row) row.after(expRow);

    insertBefore = row.nextSibling;
    if ((insertBefore as HTMLElement)?.classList?.contains('p05-tr-expansion')) insertBefore = insertBefore!.nextSibling;
  });
}

export default { updateTableBody, diffUpdateRows };

export const MODULE_ID = 'panel-05:table:render-body';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
