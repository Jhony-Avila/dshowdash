// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-LIFECYCLE-CLEANUP)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/bindings
// PURPOSE: Panel-01 Table - Event Bindings
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createClickHandler() — exported function
//   createContextHandler() — exported function
//   bindEvents() — exported function
//   unbindEvents() — exported function
//   bindRetry() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'contextmenu'
// WINDOW ACCESS:
//   (none)
// @changelog v9.4.0-LIFECYCLE-CLEANUP: bindRetry cleanup via ctx.retryListener (BRF PARTE 3 compliance)
// @changelog v9.3.0-P2-ENTERPRISE: Enterprise P2 compliance
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/bindings';

export function createClickHandler(ctx: Record<string, unknown>, callbacks: Record<string, (...args: unknown[]) => void>) {
  return (e: MouseEvent) => {
    const target = e.target as Element;
    // Group toggle
    const groupRow = target.closest('.p01-group-row') as HTMLElement | null;
    if (groupRow && ctx.grouping) {
      const groupKey = groupRow.dataset.group;
      (ctx.grouping as Record<string, (...args: unknown[]) => void>).toggleGroup(groupKey);
      (ctx.triggerRerender as () => void)();
      return;
    }

    // Sort click
    const th = target.closest('[data-sort]') as HTMLElement | null;
    if (th) {
      if (ctx.multiSort && (ctx.features as Record<string, unknown>).multiSort) {
        (ctx.multiSort as Record<string, (...args: unknown[]) => void>).addSort(th.dataset.sort, 'DESC', e.shiftKey);
      } else {
        (ctx.sorting as Record<string, (...args: unknown[]) => void>).toggle(th.dataset.sort);
      }
      return;
    }

    // Select all
    const selectAll = target.closest('.p01-select-all') as HTMLInputElement | null;
    if (selectAll) {
      callbacks.onSelectAll(selectAll.checked);
      return;
    }

    // Row checkbox
    const checkbox = target.closest('.p01-row-checkbox') as HTMLInputElement | null;
    if (checkbox) {
      callbacks.onSelect((checkbox as HTMLElement).dataset.id, checkbox.checked);
      return;
    }

    // Action button
    const actionBtn = target.closest('[data-action]') as HTMLElement | null;
    if (actionBtn) {
      callbacks.onRowClick(actionBtn.dataset.action, actionBtn.dataset.id);
      return;
    }

    // Inline edit (double-click)
    const cell = target.closest('td[data-field][data-editable="true"]') as HTMLElement | null;
    if (cell && e.detail === 2 && ctx.inlineEditor && (ctx.features as Record<string, unknown>).inlineEdit) {
      (ctx.inlineEditor as Record<string, (cell: HTMLElement) => void>).startEdit(cell);
      return;
    }

    // Row click
    const row = target.closest('.p01-row') as HTMLElement | null;
    if (row && !target.closest('button, input, a')) {
      callbacks.onRowClick('view', row.dataset.id);
    }
  };
}

export function createContextHandler(callbacks: Record<string, (...args: unknown[]) => void>) {
  return (e: MouseEvent) => {
    const row = (e.target as Element).closest('.p01-row') as HTMLElement | null;
    if (row) {
      e.preventDefault();
      callbacks.onRowContext(e, row.dataset.id);
    }
  };
}

export function bindEvents(ctx: Record<string, unknown>, callbacks: Record<string, (...args: unknown[]) => void>) {
  const container = ctx.container as HTMLElement;
  if (ctx.clickListener) container.removeEventListener('click', ctx.clickListener as EventListenerOrEventListenerObject);
  if (ctx.contextListener) container.removeEventListener('contextmenu', ctx.contextListener as EventListenerOrEventListenerObject);

  ctx.clickListener = createClickHandler(ctx, callbacks);
  ctx.contextListener = createContextHandler(callbacks);

  container.addEventListener('click', ctx.clickListener as EventListenerOrEventListenerObject);
  container.addEventListener('contextmenu', ctx.contextListener as EventListenerOrEventListenerObject);
}

export function unbindEvents(ctx: Record<string, unknown>) {
  const container = ctx.container as HTMLElement;
  if (ctx.clickListener) container.removeEventListener('click', ctx.clickListener as EventListenerOrEventListenerObject);
  if (ctx.contextListener) container.removeEventListener('contextmenu', ctx.contextListener as EventListenerOrEventListenerObject);
  if (ctx.retryListener) {
    const btn = container?.querySelector('[data-action="retry"]');
    if (btn) btn.removeEventListener('click', ctx.retryListener as EventListenerOrEventListenerObject);
  }
  ctx.clickListener = null;
  ctx.contextListener = null;
  ctx.retryListener = null;
}

export function bindRetry(ctx: Record<string, unknown>, callback: (...args: unknown[]) => void) {
  const container = ctx.container as HTMLElement;
  if (ctx.retryListener) {
    const oldBtn = container.querySelector('[data-action="retry"]');
    if (oldBtn) oldBtn.removeEventListener('click', ctx.retryListener as EventListenerOrEventListenerObject);
  }
  const btn = container.querySelector('[data-action="retry"]');
  if (btn) {
    ctx.retryListener = callback;
    btn.addEventListener('click', callback as EventListenerOrEventListenerObject);
  }
}
