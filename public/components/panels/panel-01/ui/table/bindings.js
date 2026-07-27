const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/bindings";
function createClickHandler(ctx, callbacks) {
  return (e) => {
    const target = e.target;
    const groupRow = target.closest(".p01-group-row");
    if (groupRow && ctx.grouping) {
      const groupKey = groupRow.dataset.group;
      ctx.grouping.toggleGroup(groupKey);
      ctx.triggerRerender();
      return;
    }
    const th = target.closest("[data-sort]");
    if (th) {
      if (ctx.multiSort && ctx.features.multiSort) {
        ctx.multiSort.addSort(th.dataset.sort, "DESC", e.shiftKey);
      } else {
        ctx.sorting.toggle(th.dataset.sort);
      }
      return;
    }
    const selectAll = target.closest(".p01-select-all");
    if (selectAll) {
      callbacks.onSelectAll(selectAll.checked);
      return;
    }
    const checkbox = target.closest(".p01-row-checkbox");
    if (checkbox) {
      callbacks.onSelect(checkbox.dataset.id, checkbox.checked);
      return;
    }
    const actionBtn = target.closest("[data-action]");
    if (actionBtn) {
      callbacks.onRowClick(actionBtn.dataset.action, actionBtn.dataset.id);
      return;
    }
    const cell = target.closest('td[data-field][data-editable="true"]');
    if (cell && e.detail === 2 && ctx.inlineEditor && ctx.features.inlineEdit) {
      ctx.inlineEditor.startEdit(cell);
      return;
    }
    const row = target.closest(".p01-row");
    if (row && !target.closest("button, input, a")) {
      callbacks.onRowClick("view", row.dataset.id);
    }
  };
}
function createContextHandler(callbacks) {
  return (e) => {
    const row = e.target.closest(".p01-row");
    if (row) {
      e.preventDefault();
      callbacks.onRowContext(e, row.dataset.id);
    }
  };
}
function bindEvents(ctx, callbacks) {
  const container = ctx.container;
  if (ctx.clickListener) container.removeEventListener("click", ctx.clickListener);
  if (ctx.contextListener) container.removeEventListener("contextmenu", ctx.contextListener);
  ctx.clickListener = createClickHandler(ctx, callbacks);
  ctx.contextListener = createContextHandler(callbacks);
  container.addEventListener("click", ctx.clickListener);
  container.addEventListener("contextmenu", ctx.contextListener);
}
function unbindEvents(ctx) {
  const container = ctx.container;
  if (ctx.clickListener) container.removeEventListener("click", ctx.clickListener);
  if (ctx.contextListener) container.removeEventListener("contextmenu", ctx.contextListener);
  if (ctx.retryListener) {
    const btn = container?.querySelector('[data-action="retry"]');
    if (btn) btn.removeEventListener("click", ctx.retryListener);
  }
  ctx.clickListener = null;
  ctx.contextListener = null;
  ctx.retryListener = null;
}
function bindRetry(ctx, callback) {
  const container = ctx.container;
  if (ctx.retryListener) {
    const oldBtn = container.querySelector('[data-action="retry"]');
    if (oldBtn) oldBtn.removeEventListener("click", ctx.retryListener);
  }
  const btn = container.querySelector('[data-action="retry"]');
  if (btn) {
    ctx.retryListener = callback;
    btn.addEventListener("click", callback);
  }
}
export {
  MODULE_ID,
  VERSION,
  bindEvents,
  bindRetry,
  createClickHandler,
  createContextHandler,
  unbindEvents
};
