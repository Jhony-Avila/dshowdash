import { handleBulkAction, handleInlineAction } from "./actions.js";
import { toggleSelectAll, toggleSelection, updateSelectionUI, updateBulkBar } from "./selection.js";
function setupFilterListeners(rootContainer, state, handlers) {
  const filtersEl = rootContainer?.querySelector("[data-filters]");
  if (!filtersEl) return null;
  const filterHandler = (e) => {
    const target = e.target;
    if (target.matches("[data-filter]")) {
      const filterKey = target.dataset.filter;
      state.filters[filterKey] = target.value;
      handlers.applyFilters();
      handlers.persistFilters();
    }
    if (target.matches('[data-action="clear-filters"]')) {
      handlers.clearFilters();
    }
  };
  filtersEl.addEventListener("change", filterHandler);
  filtersEl.addEventListener("input", filterHandler);
  filtersEl.addEventListener("click", filterHandler);
  return filterHandler;
}
function setupRowClickListener(container, state, handlers) {
  const rowClickHandler = (e) => {
    const target = e.target;
    if (target.closest(".p02-row-checkbox") || target.closest(".p02-inline-btn") || target.closest(".p02-expand-btn")) return;
    const row = target.closest("tr[data-job-id]");
    if (!row) return;
    const jobId = row.dataset.jobId;
    if (!jobId) return;
    const job = state.allJobs.find((j) => String(j.id) === String(jobId));
    if (job) {
      const drawer = handlers.drawerComponent;
      drawer?.open?.(job);
    }
  };
  container.addEventListener("click", rowClickHandler);
  return rowClickHandler;
}
function setupContextMenuListener(container, state, handlers) {
  const contextHandler = (e) => {
    const target = e.target;
    const row = target.closest("tr[data-job-id]");
    if (!row) return;
    e.preventDefault();
    const jobId = row.dataset.jobId;
    const job = state.allJobs.find((j) => String(j.id) === String(jobId));
    if (job) {
      const contextMenu = handlers.contextMenu;
      contextMenu.show(e.clientX, e.clientY, job);
    }
  };
  container.addEventListener("contextmenu", contextHandler);
  return contextHandler;
}
function setupExportListener(rootContainer, state, handlers) {
  const exportBtn = rootContainer?.querySelector('[data-action="export"]');
  if (!exportBtn) return null;
  const exportHandler = () => {
    const selectedJobs = state.selectedJobs;
    const filteredJobs = state.filteredJobs;
    const allJobs = state.allJobs;
    const dataToExport = selectedJobs.size > 0 ? filteredJobs.filter((j) => selectedJobs.has(String(j.id))) : filteredJobs.length > 0 ? filteredJobs : allJobs;
    const exportManager = handlers.exportManager;
    const toastManager = handlers.toastManager;
    const success = exportManager.exportCSV(dataToExport, "jobs-monitoramento");
    if (success) {
      toastManager.success(`${dataToExport.length} jobs exportados com sucesso`);
    } else {
      toastManager.error("Erro ao exportar dados");
    }
  };
  exportBtn.addEventListener("click", exportHandler);
  return exportHandler;
}
function setupSelectionListeners(container, state, handlers) {
  const selectHandler = (e) => {
    const target = e.target;
    const selectedJobs = state.selectedJobs;
    const paginatedJobs = state.paginatedJobs;
    const allJobs = state.allJobs;
    const rootContainer = handlers.rootContainer;
    const selectAll = target.closest(".p02-select-all");
    if (selectAll) {
      toggleSelectAll(selectedJobs, paginatedJobs, selectAll.checked);
      updateSelectionUI(container, paginatedJobs, selectedJobs);
      updateBulkBar(rootContainer, selectedJobs);
      return;
    }
    const rowCheckbox = target.closest(".p02-row-checkbox");
    if (rowCheckbox) {
      const jobId = rowCheckbox.dataset.jobId;
      toggleSelection(selectedJobs, jobId, rowCheckbox.checked);
      updateSelectionUI(container, paginatedJobs, selectedJobs);
      updateBulkBar(rootContainer, selectedJobs);
      return;
    }
    const bulkAction = target.closest("[data-bulk-action]");
    if (bulkAction) {
      handleBulkAction(bulkAction.dataset.bulkAction, selectedJobs, allJobs, handlers);
      return;
    }
    const clearSelection = target.closest('[data-action="clear-selection"]');
    if (clearSelection) {
      selectedJobs.clear();
      updateSelectionUI(container, paginatedJobs, selectedJobs);
      updateBulkBar(rootContainer, selectedJobs);
      return;
    }
  };
  container.addEventListener("change", selectHandler);
  container.addEventListener("click", selectHandler);
  return selectHandler;
}
function setupInlineActionListeners(container, state, handlers) {
  const inlineActionHandler = (e) => {
    const target = e.target;
    const btn = target.closest(".p02-inline-btn[data-action]");
    if (!btn) return;
    e.stopPropagation();
    const action = btn.dataset.action;
    const jobId = btn.dataset.jobId;
    const job = state.allJobs.find((j) => String(j.id) === String(jobId));
    if (job) {
      handleInlineAction(action, job, handlers);
    }
  };
  container.addEventListener("click", inlineActionHandler);
  return inlineActionHandler;
}
function removeFilterListeners(rootContainer, filterHandler) {
  const filtersEl = rootContainer?.querySelector("[data-filters]");
  if (filtersEl && filterHandler) {
    filtersEl.removeEventListener("change", filterHandler);
    filtersEl.removeEventListener("input", filterHandler);
    filtersEl.removeEventListener("click", filterHandler);
  }
}
function removeExportListener(rootContainer, exportHandler) {
  const exportBtn = rootContainer?.querySelector('[data-action="export"]');
  if (exportBtn && exportHandler) {
    exportBtn.removeEventListener("click", exportHandler);
  }
}
function removeContainerListeners(container, handlers) {
  if (!container) return;
  if (handlers.rowClickHandler) container.removeEventListener("click", handlers.rowClickHandler);
  if (handlers.contextHandler) container.removeEventListener("contextmenu", handlers.contextHandler);
  if (handlers.selectHandler) {
    container.removeEventListener("change", handlers.selectHandler);
    container.removeEventListener("click", handlers.selectHandler);
  }
  if (handlers.inlineActionHandler) container.removeEventListener("click", handlers.inlineActionHandler);
}
var events_default = {
  setupFilterListeners,
  setupRowClickListener,
  setupContextMenuListener,
  setupExportListener,
  setupSelectionListeners,
  setupInlineActionListeners,
  removeFilterListeners,
  removeExportListener,
  removeContainerListeners
};
const MODULE_ID = "panel-02/ui/events";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  events_default as default,
  healthCheck,
  info,
  removeContainerListeners,
  removeExportListener,
  removeFilterListeners,
  setupContextMenuListener,
  setupExportListener,
  setupFilterListeners,
  setupInlineActionListeners,
  setupRowClickListener,
  setupSelectionListeners
};
