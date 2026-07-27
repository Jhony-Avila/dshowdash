import { handleSortClick, updateSortIndicators } from "./sorting.js";
let _abortController = null;
let _listenerCount = 0;
function _ensureAbortController() {
  if (!_abortController) {
    _abortController = new AbortController();
    _listenerCount = 0;
  }
  return _abortController.signal;
}
function setupSortListeners(element, state, handlers) {
  const headerClickHandler = (e) => {
    const th = e.target.closest("th[data-sort]");
    if (!th || e.target.closest(".p02-col-resizer")) return;
    const column = th.dataset.sort || "";
    const isMulti = e.shiftKey;
    state.sortColumns = handleSortClick(state.sortColumns, column, isMulti);
    updateSortIndicators(element, state.sortColumns);
    handlers.sortAndRender();
    const sortDesc = state.sortColumns.map((s) => `${s.column} ${s.direction}`).join(", ");
    handlers.announce(sortDesc ? `Ordenado por ${sortDesc}` : "Ordenacao removida");
  };
  const signal = _ensureAbortController();
  const thead = element?.querySelector("thead");
  if (thead) {
    thead.addEventListener("click", headerClickHandler, { signal });
    thead.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const th = e.target.closest("th[data-sort]");
        if (th) {
          e.preventDefault();
          th.click();
        }
      }
    }, { signal });
    _listenerCount += 2;
  }
  return headerClickHandler;
}
function setupResizeListeners(element, columns) {
  let startX, startWidth, resizingCol = null;
  const onMouseMove = (e) => {
    if (!resizingCol) return;
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff);
    const col = columns.find((c) => c.id === resizingCol);
    if (col) col.width = newWidth;
    const th = element?.querySelector(`th[data-sort="${resizingCol}"]`);
    if (th) th.style.width = `${newWidth}px`;
  };
  const onMouseUp = () => {
    if (resizingCol) {
      document.querySelectorAll(".p02-col-resizer").forEach((r) => r.classList.remove("resizing"));
      resizingCol = null;
    }
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };
  const resizeHandler = (e) => {
    const resizer = e.target.closest(".p02-col-resizer");
    if (!resizer) return;
    e.preventDefault();
    resizingCol = resizer.dataset.col || null;
    resizer.classList.add("resizing");
    const th = resizer.closest("th");
    startX = e.clientX;
    startWidth = th?.offsetWidth || 0;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };
  const signal = _ensureAbortController();
  element?.addEventListener("mousedown", resizeHandler, { signal });
  _listenerCount++;
  return resizeHandler;
}
function setupInlineFilterListeners(element, state, handlers) {
  const inlineFilterHandler = (e) => {
    const filter = e.target.closest("[data-inline-filter]");
    if (!filter) return;
    state.inlineFilters[filter.dataset.inlineFilter] = filter.value;
    handlers.onInlineFilter?.(state.inlineFilters);
  };
  const signal = _ensureAbortController();
  element?.addEventListener("input", inlineFilterHandler, { signal });
  element?.addEventListener("change", inlineFilterHandler, { signal });
  _listenerCount += 2;
  return inlineFilterHandler;
}
function setupExpandListeners(element, state, handlers) {
  const expandHandler = (e) => {
    const expandBtn = e.target.closest(".p02-expand-btn");
    if (!expandBtn) return;
    const row = expandBtn.closest("tr");
    const jobId = row?.dataset.jobId;
    if (!jobId) return;
    const isExpanded = state.expandedRows.has(jobId);
    if (isExpanded) {
      state.expandedRows.delete(jobId);
      expandBtn.classList.remove("expanded");
      expandBtn.setAttribute("aria-expanded", "false");
    } else {
      state.expandedRows.add(jobId);
      expandBtn.classList.add("expanded");
      expandBtn.setAttribute("aria-expanded", "true");
    }
    const expandedRow = row.nextElementSibling;
    if (expandedRow?.classList.contains("p02-expanded-row")) {
      expandedRow.classList.toggle("open", !isExpanded);
    }
    handlers.announce(isExpanded ? "Linha recolhida" : "Linha expandida");
  };
  const signal = _ensureAbortController();
  element?.addEventListener("click", expandHandler, { signal });
  _listenerCount++;
  return expandHandler;
}
function setupGroupToggleListeners(element, state, handlers) {
  const groupToggleHandler = (e) => {
    const toggle = e.target.closest(".p02-group-toggle");
    if (!toggle) return;
    const groupKey = toggle?.dataset.group || "";
    const isCollapsed = state.collapsedGroups.has(groupKey);
    if (isCollapsed) {
      state.collapsedGroups.delete(groupKey);
      toggle?.classList.remove("collapsed");
    } else {
      state.collapsedGroups.add(groupKey);
      toggle.classList.add("collapsed");
    }
    const tbody = element?.querySelector(".p02-tbody");
    const rows = tbody?.querySelectorAll(`tr[data-group="${groupKey}"]`);
    rows?.forEach((row) => row.classList.toggle("hidden", !isCollapsed));
    handlers.announce(isCollapsed ? `Grupo ${groupKey} expandido` : `Grupo ${groupKey} recolhido`);
  };
  const signal = _ensureAbortController();
  element?.addEventListener("click", groupToggleHandler, { signal });
  _listenerCount++;
  return groupToggleHandler;
}
function removeListeners(element, handlers) {
  const thead = element?.querySelector("thead");
  if (thead && handlers.headerClickHandler) {
    thead.removeEventListener("click", handlers.headerClickHandler);
  }
  if (handlers.resizeHandler) element?.removeEventListener("mousedown", handlers.resizeHandler);
  if (handlers.inlineFilterHandler) {
    element?.removeEventListener("input", handlers.inlineFilterHandler);
    element?.removeEventListener("change", handlers.inlineFilterHandler);
  }
  if (handlers.expandHandler) element?.removeEventListener("click", handlers.expandHandler);
  if (handlers.groupToggleHandler) element?.removeEventListener("click", handlers.groupToggleHandler);
}
function teardownAll() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    _listenerCount = 0;
  }
}
var events_default = {
  setupSortListeners,
  setupResizeListeners,
  setupInlineFilterListeners,
  setupExpandListeners,
  setupGroupToggleListeners,
  removeListeners,
  teardownAll
};
const MODULE_ID = "panel-02/ui/table/events";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION, listenersBound: _listenerCount, hasAbortController: _abortController !== null };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true, cleanupAvailable: true, listenersTracked: _abortController !== null || _listenerCount === 0 } };
}
export {
  MODULE_ID,
  VERSION,
  events_default as default,
  healthCheck,
  info,
  removeListeners,
  setupExpandListeners,
  setupGroupToggleListeners,
  setupInlineFilterListeners,
  setupResizeListeners,
  setupSortListeners,
  teardownAll
};
