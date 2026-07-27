// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/event-bindings
// PURPOSE: Panel-01 Table - Event Bindings
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   bindTableEvents() — exported function
//   bindRetryEvent() — exported function
//   unbindTableEvents() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'contextmenu'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/event-bindings';

export function bindTableEvents(table: Record<string, unknown>) {
  const container = table.container as HTMLElement;
  if (table._listener && container) {
    container.removeEventListener('click', table._listener as EventListenerOrEventListenerObject);
  }
  if (table._contextListener && container) {
    container.removeEventListener('contextmenu', table._contextListener as EventListenerOrEventListenerObject);
  }

  table._listener = createClickHandler(table);
  table._contextListener = createContextHandler(table);

  container.addEventListener('click', table._listener as EventListenerOrEventListenerObject);
  container.addEventListener('contextmenu', table._contextListener as EventListenerOrEventListenerObject);
}

function createClickHandler(table: Record<string, unknown>) {
  return (e: MouseEvent) => {
    const target = e.target as Element;
    // Group toggle
    const groupRow = target.closest('.p01-group-row') as HTMLElement | null;
    if (groupRow && table._grouping) {
      const groupKey = groupRow.dataset.group;
      (table._grouping as Record<string, (...args: unknown[]) => void>).toggleGroup(groupKey);
      (table.render as (state: Record<string, unknown>) => void)({
        items: table._currentItems,
        selectedIds: new Set(),
        sort: (table._sorting as Record<string, () => unknown>).get()
      });
      return;
    }

    // Sort click
    const th = target.closest('[data-sort]') as HTMLElement | null;
    if (th) {
      if (table._multiSort && (table._features as Record<string, unknown>).multiSort) {
        (table._multiSort as Record<string, (...args: unknown[]) => void>).addSort(th.dataset.sort, 'DESC', e.shiftKey);
      } else {
        (table._sorting as Record<string, (...args: unknown[]) => void>).toggle(th.dataset.sort);
      }
      return;
    }

    // Select all
    const selectAll = target.closest('.p01-select-all') as HTMLInputElement | null;
    if (selectAll) {
      (table.onSelectAll as (...args: unknown[]) => void)(selectAll.checked);
      return;
    }

    // Row checkbox
    const checkbox = target.closest('.p01-row-checkbox') as HTMLInputElement | null;
    if (checkbox) {
      (table.onSelect as (...args: unknown[]) => void)((checkbox as HTMLElement).dataset.id, checkbox.checked);
      return;
    }

    // Action button
    const actionBtn = target.closest('[data-action]') as HTMLElement | null;
    if (actionBtn) {
      (table.onRowClick as (...args: unknown[]) => void)(actionBtn.dataset.action, actionBtn.dataset.id);
      return;
    }

    // Inline edit (double-click)
    const cell = target.closest('td[data-field][data-editable="true"]') as HTMLElement | null;
    if (cell && e.detail === 2 && table._inlineEditor && (table._features as Record<string, unknown>).inlineEdit) {
      (table._inlineEditor as Record<string, (cell: HTMLElement) => void>).startEdit(cell);
      return;
    }

    // Row click
    const row = target.closest('.p01-row') as HTMLElement | null;
    if (row && !target.closest('button, input, a')) {
      (table.onRowClick as (...args: unknown[]) => void)('view', row.dataset.id);
    }
  };
}

function createContextHandler(table: Record<string, unknown>) {
  return (e: MouseEvent) => {
    const row = (e.target as Element).closest('.p01-row') as HTMLElement | null;
    if (row) {
      e.preventDefault();
      (table.onRowContext as (...args: unknown[]) => void)(e, row.dataset.id);
    }
  };
}

export function bindRetryEvent(table: Record<string, unknown>) {
  const btn = (table.container as HTMLElement).querySelector('[data-action="retry"]');
  if (btn) btn.addEventListener('click', () => { (table.onSort as (...args: unknown[]) => void)(null); });
}

export function unbindTableEvents(table: Record<string, unknown>) {
  const container = table.container as HTMLElement;
  if (table._listener && container) {
    container.removeEventListener('click', table._listener as EventListenerOrEventListenerObject);
  }
  if (table._contextListener && container) {
    container.removeEventListener('contextmenu', table._contextListener as EventListenerOrEventListenerObject);
  }
  table._listener = null;
  table._contextListener = null;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { bindTableEvents, bindRetryEvent, unbindTableEvents };
