// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-16-ui-sorting
// PURPOSE: Panel-16 UI Sorting
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   COLUMN_TYPES from ./constants.js
//
// PROVIDES:
//   sortData() — exported function
//   handleSort() — exported function
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

import { COLUMN_TYPES } from './constants.js';

export function sortData(data: Array<Record<string, unknown>>, sortColumns: Array<Record<string, unknown>>) { if (!sortColumns || sortColumns.length === 0) return; data.sort((a: Record<string, unknown>, b: Record<string, unknown>) => { for (const { column, direction } of sortColumns) { const dir = direction === 'asc' ? 1 : -1; let va = a[column as string] ?? '', vb = b[column as string] ?? ''; const colType = (COLUMN_TYPES as Record<string, unknown>)[column as string]; if ((colType as Record<string, unknown>)?.type === 'currency' || (colType as Record<string, unknown>)?.type === 'number' || ['total_pago', 'qtd_requisicoes'].includes(column as string)) { const diff = (parseFloat(va as string) || 0) - (parseFloat(vb as string) || 0); if (diff !== 0) return diff * (dir as number); } else { const cmp = String(va).localeCompare(String(vb), 'pt-BR'); if (cmp !== 0) return cmp * (dir as number); } } return 0; }); }

export function handleSort(sortColumns: Array<Record<string, unknown>>, column: string, addToSort = false) { const existingIdx = sortColumns.findIndex((s: Record<string, unknown>) => s.column === column); if (addToSort) { if (existingIdx >= 0) { sortColumns[existingIdx].direction = sortColumns[existingIdx].direction === 'asc' ? 'desc' : 'asc'; } else if (sortColumns.length < 3) { sortColumns.push({ column, direction: 'asc' }); } } else { if (existingIdx >= 0 && sortColumns.length === 1) { sortColumns[0].direction = sortColumns[0].direction === 'asc' ? 'desc' : 'asc'; } else { sortColumns.length = 0; sortColumns.push({ column, direction: 'asc' }); } } return sortColumns; }

export default { sortData, handleSort };

export const MODULE_ID = 'panels-panel-16-ui-sorting';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { sortingReady: true } }; }
