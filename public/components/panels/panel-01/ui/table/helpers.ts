// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/helpers
// PURPOSE: Panel-01 Table Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getRowById() — exported function
//   getAllRows() — exported function
//   getSelectedRows() — exported function
//   getVisibleRows() — exported function
//   highlightRow() — exported function
//   scrollToRow() — exported function
//   focusRow() — exported function
//   getNextRow() — exported function
//   getPrevRow() — exported function
//   getFirstRow() — exported function
//   getLastRow() — exported function
//   setRowState() — exported function
//   info() — exported function
//   ... and 1 more exports
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
export const MODULE_ID = 'panel-01/ui/table/helpers';

export function getRowById(container: HTMLElement | null | undefined, id: string | number) {
  return container?.querySelector(`.p01-row[data-id="${id}"]`);
}

export function getAllRows(container: HTMLElement | null | undefined): NodeListOf<Element> | Element[] {
  return container?.querySelectorAll('.p01-row') || [];
}

export function getSelectedRows(container: HTMLElement | null | undefined): NodeListOf<Element> | Element[] {
  return container?.querySelectorAll('.p01-row--selected') || [];
}

export function getVisibleRows(container: HTMLElement | null | undefined): NodeListOf<Element> | Element[] {
  return container?.querySelectorAll('.p01-row:not([hidden])') || [];
}

export function highlightRow(container: HTMLElement | null | undefined, id: string | number, duration = 2000) {
  const row = getRowById(container, id);
  if (!row) return;
  row.classList.add('p01-row--highlight');
  setTimeout(() => row.classList.remove('p01-row--highlight'), duration);
}

export function scrollToRow(container: HTMLElement | null | undefined, id: string | number, behavior: ScrollBehavior = 'smooth') {
  const row = getRowById(container, id);
  if (row) {
    row.scrollIntoView({ behavior, block: 'center' });
  }
}

export function focusRow(container: HTMLElement | null | undefined, id: string | number) {
  const row = getRowById(container, id);
  if (row) (row as HTMLElement).focus();
}

export function getNextRow(container: HTMLElement | null | undefined, currentId: string | number) {
  const rows = Array.from(getAllRows(container)) as HTMLElement[];
  const idx = rows.findIndex((r: HTMLElement) => r.dataset.id === String(currentId));

  return rows[idx + 1]?.dataset.id || null;
}

export function getPrevRow(container: HTMLElement | null | undefined, currentId: string | number) {
  const rows = Array.from(getAllRows(container)) as HTMLElement[];
  const idx = rows.findIndex((r: HTMLElement) => r.dataset.id === String(currentId));
  return rows[idx - 1]?.dataset.id || null;
}

export function getFirstRow(container: HTMLElement | null | undefined) {
  const row = container?.querySelector('.p01-row') as HTMLElement | null | undefined;
  return row?.dataset.id || null;
}

export function getLastRow(container: HTMLElement | null | undefined) {
  const rows = Array.from(getAllRows(container)) as HTMLElement[];
  return rows[rows.length - 1]?.dataset.id || null;
}

export function setRowState(container: HTMLElement | null | undefined, id: string | number, state: Record<string, boolean>) {
  const row = getRowById(container, id);
  if (!row) return;
  
  Object.entries(state).forEach(([key, value]) => {
    if (value) {
      row.classList.add(`p01-row--${key}`);
    } else {
      row.classList.remove(`p01-row--${key}`);
    }
  });
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { getRowById, getAllRows, getSelectedRows, getVisibleRows, highlightRow, scrollToRow, focusRow, getNextRow, getPrevRow, getFirstRow, getLastRow, setRowState };
