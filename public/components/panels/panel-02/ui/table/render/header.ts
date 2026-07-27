// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/ui/table/render/header
// PURPOSE: Panel-02 Table Render Header
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getSortInfo from ../sorting.js
//
// PROVIDES:
//   renderHeaderCells() — exported function
//   renderFilterCells() — exported function
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

import { getSortInfo } from '../sorting.js';

export function renderHeaderCells(columns: Record<string, unknown>[], sortColumns: Array<{ column: string; direction: string }>) {
  const visibleCols = columns.filter((c: Record<string, unknown>) => c.visible);

  return visibleCols.map((col: Record<string, unknown>) => {
    if (col.id === 'select') return '<th class="p02-checkbox-col"><input type="checkbox" class="p02-select-all" aria-label="Selecionar todos"></th>';
    if (col.id === 'expand') return '<th class="p02-expand-col" aria-hidden="true"></th>';
    if (col.id === 'actions') return '<th class="p02-actions-col"><span class="p02-sr-only">Acoes</span></th>';
    
    const sortInfo = getSortInfo(sortColumns, col.id as string);
    const widthStyle = col.width ? `style="width:${col.width}px"` : '';
    const alignClass = col.align ? col.align : '';
    const ariaSort = sortInfo.sorted ? (sortInfo.direction === 'asc' ? 'ascending' : 'descending') : 'none';
    
    return `<th data-sort="${col.id}" class="sortable ${alignClass} ${sortInfo.sorted ? `sorted sorted-${sortInfo.direction}` : ''}" ${widthStyle} aria-sort="${ariaSort}" role="columnheader" tabindex="0">
      ${col.label}<span class="p02-sort-icon" aria-hidden="true"></span>
      ${sortInfo.index > 0 ? `<span class="p02-sort-badge">${sortInfo.index}</span>` : ''}
      <div class="p02-col-resizer" data-col="${col.id}" aria-hidden="true"></div>
    </th>`;
  }).join('');
}

export function renderFilterCells(columns: Record<string, unknown>[]) {
  const visibleCols = columns.filter((c: Record<string, unknown>) => c.visible);

  return visibleCols.map((col: Record<string, unknown>) => {
    if (col.id === 'select' || col.id === 'expand' || col.id === 'actions' || !col.filterable) return '<th></th>';
    if (col.filterType === 'select') {
      const options = (col.options as string[]).map((o: string) => `<option value="${o}">${o}</option>`).join('');
      return `<th><select class="p02-inline-filter-select" data-inline-filter="${col.id}"><option value="">Todos</option>${options}</select></th>`;
    }
    return `<th><input type="text" class="p02-inline-filter" data-inline-filter="${col.id}" placeholder="Filtrar..."></th>`;
  }).join('');
}

export default { renderHeaderCells, renderFilterCells };

export const MODULE_ID = 'panel-02/ui/table/render/header';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { headerReady: true } }; }
