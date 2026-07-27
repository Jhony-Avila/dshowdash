// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/ui/table/sorting
// PURPOSE: Panel-02 Table Sorting
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STATUS_ORDER from ./constants.js
//
// PROVIDES:
//   getSortValue() — exported function
//   sortJobs() — exported function
//   getSortInfo() — exported function
//   handleSortClick() — exported function
//   updateSortIndicators() — exported function
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

import { STATUS_ORDER } from './constants.js';

export function getSortValue(job: Record<string, unknown>, column: string) {
  switch (column) {
    case 'job_name': return job.job_name || job.name || '';
    case 'job_type': return job.job_type || job.type || '';
    case 'health_status': return (STATUS_ORDER as Record<string, number>)[job.health_status as string] ?? 4;
    case 'last_execution': return job.last_execution ? new Date(job.last_execution as string).getTime() : 0;
    case 'total_executions': return parseInt(String(job.total_executions || 0));
    case 'success_rate': return parseFloat(String(job.success_rate || 0));
    case 'avg_execution_time': return parseFloat(String(job.avg_execution_time || 0));
    case 'error_count': return parseInt(String(job.error_count || 0));
    default: return '';
  }
}

export function sortJobs(jobs: Record<string, unknown>[], sortColumns: Array<{ column: string; direction: string }>) {
  return [...jobs].sort((a, b) => {
    for (const { column, direction } of sortColumns) {
      let valA = getSortValue(a, column);
      let valB = getSortValue(b, column);
      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';
      let result = 0;
      if (typeof valA === 'number' && typeof valB === 'number') result = valA - valB;
      else result = String(valA).localeCompare(String(valB), 'pt-BR', { numeric: true });
      if (result !== 0) return direction === 'desc' ? -result : result;
    }
    return 0;
  });
}

export function getSortInfo(sortColumns: Array<{ column: string; direction: string }>, columnId: string) {
  const idx = sortColumns.findIndex((s: { column: string; direction: string }) => s.column === columnId);
  if (idx === -1) return { sorted: false, direction: null, index: 0 };
  return { sorted: true, direction: sortColumns[idx].direction, index: idx + 1 };
}

export function handleSortClick(sortColumns: Array<{ column: string; direction: string }>, column: string, isMulti: boolean) {
  const newSortColumns = [...sortColumns];
  
  if (isMulti) {
    const existingIdx = newSortColumns.findIndex(s => s.column === column);
    if (existingIdx >= 0) {
      if (newSortColumns[existingIdx].direction === 'asc') newSortColumns[existingIdx].direction = 'desc';
      else newSortColumns.splice(existingIdx, 1);
    } else {
      newSortColumns.push({ column, direction: 'asc' });
    }
  } else {
    const existing = newSortColumns.find(s => s.column === column);
    if (existing) {
      if (existing.direction === 'asc') return [{ column, direction: 'desc' }];
      else return [];
    } else {
      return [{ column, direction: 'asc' }];
    }
  }
  
  return newSortColumns;
}

export function updateSortIndicators(element: HTMLElement | null, sortColumns: Array<{ column: string; direction: string }>) {
  if (!element) return;
  const headers = element.querySelectorAll('th[data-sort]');
  headers.forEach((th: Element) => {
    const col = (th as HTMLElement).dataset.sort || '';
    const sortInfo = getSortInfo(sortColumns, col);
    th.classList.remove('sorted', 'sorted-asc', 'sorted-desc');
    th.setAttribute('aria-sort', 'none');
    const badge = th.querySelector('.p02-sort-badge');
    if (badge) badge.remove();
    if (sortInfo.sorted) {
      th.classList.add('sorted', `sorted-${sortInfo.direction}`);
      th.setAttribute('aria-sort', sortInfo.direction === 'asc' ? 'ascending' : 'descending');
      if (sortColumns.length > 1) {
        const newBadge = document.createElement('span');
        newBadge.className = 'p02-sort-badge';
        newBadge.textContent = String(sortInfo.index);
        th.querySelector('.p02-sort-icon')?.after(newBadge);
      }
    }
  });
}

export default { getSortValue, sortJobs, getSortInfo, handleSortClick, updateSortIndicators };

export const MODULE_ID = 'panel-02/ui/table/sorting';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { sortingReady: true } }; }
