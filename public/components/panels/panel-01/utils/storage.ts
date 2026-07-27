// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/storage
// PURPOSE: Panel-01 Storage Utils
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   get() — exported function
//   set() — exported function
//   remove() — exported function
//   clear() — exported function
//   getFilters() — exported function
//   setFilters() — exported function
//   getSort() — exported function
//   setSort() — exported function
//   getDensity() — exported function
//   setDensity() — exported function
//   getColumns() — exported function
//   setColumns() — exported function
//   getColumnWidths() — exported function
//   ... and 13 more exports
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/utils/storage';

const PREFIX = 'p01_';

export function get(key: string, defaultValue?: unknown) {
  try {
    const item = localStorage.getItem(PREFIX + key);
    return item ? JSON.parse(item) : (defaultValue !== undefined ? defaultValue : null);
  } catch (e) { return defaultValue !== undefined ? defaultValue : null; }
}

export function set(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) { return false; }
}

export function remove(key: string) {
  try {
    localStorage.removeItem(PREFIX + key);
    return true;
  } catch (e) { return false; }
}

export function clear() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => { localStorage.removeItem(k); });
    return true;
  } catch (e) { return false; }
}

export function getFilters() { return get('filters', {}); }
export function setFilters(filters: Record<string, unknown>) { return set('filters', filters); }
export function getSort() { return get('sort', { field: 'Data_Requisicao', order: 'DESC' }); }
export function setSort(sort: Record<string, unknown>) { return set('sort', sort); }
export function getDensity() { return get('density', 'normal'); }
export function setDensity(density: string) { return set('density', density); }
export function getColumns() { return get('columns', null); }
export function setColumns(columns: unknown[]) { return set('columns', columns); }

export function getColumnWidths() { return get('columnWidths', {}); }
export function setColumnWidths(widths: Record<string, unknown>) { return set('columnWidths', widths); }
export function getColumnWidth(colId: string) {
  const widths = getColumnWidths();
  return widths[colId] || null;
}
export function setColumnWidth(colId: string, width: number) {
  const widths = getColumnWidths();
  widths[colId] = width;
  return setColumnWidths(widths);
}

export function getColumnOrder() { return get('columnOrder', null); }
export function setColumnOrder(order: string[]) { return set('columnOrder', order); }

export function getLastView() { return get('lastView', null); }
export function setLastView(viewId: string) { return set('lastView', viewId); }

export function getExpandedRows() { return get('expandedRows', []); }
export function setExpandedRows(rows: string[]) { return set('expandedRows', rows); }

export function getPageSize() { return get('pageSize', 25); }
export function setPageSize(size: number) { return set('pageSize', size); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default {
  get, set, remove, clear,
  getFilters, setFilters,
  getSort, setSort,
  getDensity, setDensity,
  getColumns, setColumns,
  getColumnWidths, setColumnWidths,
  getColumnWidth, setColumnWidth,
  getColumnOrder, setColumnOrder,
  getLastView, setLastView,
  getExpandedRows, setExpandedRows,
  getPageSize, setPageSize
};
