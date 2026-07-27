const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/event-bindings";
function bindTableEvents(table) {
  const container = table.container;
  if (table._listener && container) {
    container.removeEventListener("click", table._listener);
  }
  if (table._contextListener && container) {
    container.removeEventListener("contextmenu", table._contextListener);
  }
  table._listener = createClickHandler(table);
  table._contextListener = createContextHandler(table);
  container.addEventListener("click", table._listener);
  container.addEventListener("contextmenu", table._contextListener);
}
function createClickHandler(table) {
  return (e) => {
    const target = e.target;
    const groupRow = target.closest(".p01-group-row");
    if (groupRow && table._grouping) {
      const groupKey = groupRow.dataset.group;
      table._grouping.toggleGroup(groupKey);
      table.render({
        items: table._currentItems,
        selectedIds: /* @__PURE__ */ new Set(),
        sort: table._sorting.get()
      });
      return;
    }
    const th = target.closest("[data-sort]");
    if (th) {
      if (table._multiSort && table._features.multiSort) {
        table._multiSort.addSort(th.dataset.sort, "DESC", e.shiftKey);
      } else {
        table._sorting.toggle(th.dataset.sort);
      }
      return;
    }
    const selectAll = target.closest(".p01-select-all");
    if (selectAll) {
      table.onSelectAll(selectAll.checked);
      return;
    }
    const checkbox = target.closest(".p01-row-checkbox");
    if (checkbox) {
      table.onSelect(checkbox.dataset.id, checkbox.checked);
      return;
    }
    const actionBtn = target.closest("[data-action]");
    if (actionBtn) {
      table.onRowClick(actionBtn.dataset.action, actionBtn.dataset.id);
      return;
    }
    const cell = target.closest('td[data-field][data-editable="true"]');
    if (cell && e.detail === 2 && table._inlineEditor && table._features.inlineEdit) {
      table._inlineEditor.startEdit(cell);
      return;
    }
    const row = target.closest(".p01-row");
    if (row && !target.closest("button, input, a")) {
      table.onRowClick("view", row.dataset.id);
    }
  };
}
function createContextHandler(table) {
  return (e) => {
    const row = e.target.closest(".p01-row");
    if (row) {
      e.preventDefault();
      table.onRowContext(e, row.dataset.id);
    }
  };
}
function bindRetryEvent(table) {
  const btn = table.container.querySelector('[data-action="retry"]');
  if (btn) btn.addEventListener("click", () => {
    table.onSort(null);
  });
}
function unbindTableEvents(table) {
  const container = table.container;
  if (table._listener && container) {
    container.removeEventListener("click", table._listener);
  }
  if (table._contextListener && container) {
    container.removeEventListener("contextmenu", table._contextListener);
  }
  table._listener = null;
  table._contextListener = null;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var event_bindings_default = { bindTableEvents, bindRetryEvent, unbindTableEvents };
export {
  MODULE_ID,
  VERSION,
  bindRetryEvent,
  bindTableEvents,
  event_bindings_default as default,
  info,
  unbindTableEvents
};
