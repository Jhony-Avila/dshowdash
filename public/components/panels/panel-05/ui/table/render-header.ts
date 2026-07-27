// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:render-header
// PURPOSE: Panel-05 Table Render - Header
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ./constants.js
//
// PROVIDES:
//   renderTableHeaderByCol() — exported function
//   renderSkeleton() — exported function
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

type TableCtx = { _state: { columnWidths: Record<string, unknown>; isColumnHidden: (id: string) => boolean; getColumnPin: (id: string) => string | null; sortColumns: Array<Record<string, unknown>>; [key: string]: unknown }; [key: string]: unknown };

export function renderTableHeaderByCol(ctx: TableCtx, col: Record<string, unknown>) {
  const colId = String(col.id);
  const width = ctx._state.columnWidths[colId] || col.width || 'auto';
  const isHidden = ctx._state.isColumnHidden(colId);
  const pin = ctx._state.getColumnPin(colId);

  const sortInfo = ctx._state.sortColumns.find((s: Record<string, unknown>) => s.field === colId);
  const sortIdx = ctx._state.sortColumns.findIndex((s: Record<string, unknown>) => s.field === colId);
  const isActive = !!sortInfo;

  const sortIcon = isActive ? (sortInfo.dir === 'asc' ? ICONS.chevronUp : ICONS.chevronDown) : '';
  const sortBadge = sortIdx > -1 && ctx._state.sortColumns.length > 1 ? `<span class="p05-sort-badge">${sortIdx + 1}</span>` : '';
  const resizer = col.resizable ? '<div class="p05-th-resizer"></div>' : '';
  const pinCls = pin === 'left' ? 'p05-pinned-left' : pin === 'right' ? 'p05-pinned-right' : '';
  const pinIcon = pin ? `<span class="p05-pin-indicator">${ICONS.pin}</span>` : '';
  const grip = col.reorderable ? `<span class="p05-th-grip" draggable="true" title="Arrastar para reordenar">${ICONS.gripVertical}</span>` : '';

  if (colId === 'expand') return `<th class="p05-td-expand" data-col="expand"></th>`;
  if (colId === 'checkbox') return `<th class="p05-th-checkbox" data-col="checkbox"><input type="checkbox" class="p05-checkbox p05-checkbox-all" aria-label="Selecionar todos"></th>`;

  const isSortable = col.sortable;
  const label = col.label || '';
  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  return `
    <th class="p05-th-${colId} ${isSortable ? 'p05-th-sortable' : ''} ${isActive ? 'p05-th-active' : ''} ${isHidden ? 'p05-col-hidden' : ''} ${pinCls} ${col.reorderable ? 'p05-th-reorderable' : ''}"
        data-col="${colId}"
        ${isSortable ? `data-action="sort" data-sort="${colId}"` : ''}
        role="columnheader"
        style="width:${widthStyle}">
        ${grip}${label}${pinIcon}
        <span class="p05-sort-indicator">${sortIcon}${sortBadge}</span>
        ${resizer}
    </th>
  `;
}

export function renderSkeleton() {
  return `
    <div class="p05-skeleton-table">
      <div class="p05-skeleton-header"></div>
      ${Array(5).fill('<div class="p05-skeleton-row"></div>').join('')}
    </div>
  `;
}

export default { renderTableHeaderByCol, renderSkeleton };

export const MODULE_ID = 'panel-05:table:render-header';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { renderHeaderReady: true } }; }
