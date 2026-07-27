// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/ui/events
// PURPOSE: Panel-02 UI Events
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   handleBulkAction, handleInlineAction from ./actions.js
//   toggleSelectAll, toggleSelection, updateSelectionUI, updateBulkBar from ./sel...
//
// PROVIDES:
//   setupFilterListeners() — exported function
//   setupRowClickListener() — exported function
//   setupContextMenuListener() — exported function
//   setupExportListener() — exported function
//   setupSelectionListeners() — exported function
//   setupInlineActionListeners() — exported function
//   removeFilterListeners() — exported function
//   removeExportListener() — exported function
//   removeContainerListeners() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
//   'contextmenu'
//   'input'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { handleBulkAction, handleInlineAction } from './actions.js';
import { toggleSelectAll, toggleSelection, updateSelectionUI, updateBulkBar } from './selection.js';

export function setupFilterListeners(rootContainer: HTMLElement | null, state: Record<string, unknown>, handlers: Record<string, unknown>) {
  const filtersEl = rootContainer?.querySelector('[data-filters]');
  if (!filtersEl) return null;

  const filterHandler = (e: Event) => {
    const target = e.target as HTMLElement & { dataset: DOMStringMap; value: string };
    if (target.matches('[data-filter]')) {
      const filterKey = target.dataset.filter as string;
      (state.filters as Record<string, string>)[filterKey] = (target as HTMLInputElement).value;
      (handlers.applyFilters as () => void)();
      (handlers.persistFilters as () => void)();
    }
    if (target.matches('[data-action="clear-filters"]')) {
      (handlers.clearFilters as () => void)();
    }
  };

  filtersEl.addEventListener('change', filterHandler);
  filtersEl.addEventListener('input', filterHandler);
  filtersEl.addEventListener('click', filterHandler);

  return filterHandler;
}

export function setupRowClickListener(container: HTMLElement, state: Record<string, unknown>, handlers: Record<string, unknown>) {
  const rowClickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.p02-row-checkbox') || target.closest('.p02-inline-btn') || target.closest('.p02-expand-btn')) return;

    const row = target.closest('tr[data-job-id]') as HTMLElement | null;
    if (!row) return;

    const jobId = row.dataset.jobId;
    if (!jobId) return;

    const job = (state.allJobs as Record<string, unknown>[]).find((j: Record<string, unknown>) => String(j.id) === String(jobId));
    if (job) {
      const drawer = handlers.drawerComponent as { open?: (j: Record<string, unknown>) => void } | null | undefined;
      drawer?.open?.(job);
    }
  };

  container.addEventListener('click', rowClickHandler);
  return rowClickHandler;
}

export function setupContextMenuListener(container: HTMLElement, state: Record<string, unknown>, handlers: Record<string, unknown>) {
  const contextHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const row = target.closest('tr[data-job-id]') as HTMLElement | null;
    if (!row) return;

    e.preventDefault();
    const jobId = row.dataset.jobId;
    const job = (state.allJobs as Record<string, unknown>[]).find((j: Record<string, unknown>) => String(j.id) === String(jobId));
    if (job) {
      const contextMenu = handlers.contextMenu as { show: (x: number, y: number, job: Record<string, unknown>) => void };
      contextMenu.show(e.clientX, e.clientY, job);
    }
  };

  container.addEventListener('contextmenu', contextHandler);
  return contextHandler;
}

export function setupExportListener(rootContainer: HTMLElement | null, state: Record<string, unknown>, handlers: Record<string, unknown>) {
  const exportBtn = rootContainer?.querySelector('[data-action="export"]');
  if (!exportBtn) return null;

  const exportHandler = () => {
    const selectedJobs = state.selectedJobs as Set<string>;
    const filteredJobs = state.filteredJobs as Record<string, unknown>[];
    const allJobs = state.allJobs as Record<string, unknown>[];

    const dataToExport: Record<string, unknown>[] = selectedJobs.size > 0
      ? filteredJobs.filter((j: Record<string, unknown>) => selectedJobs.has(String(j.id)))
      : filteredJobs.length > 0 ? filteredJobs : allJobs;

    const exportManager = handlers.exportManager as { exportCSV: (data: Record<string, unknown>[], name: string) => boolean };
    const toastManager = handlers.toastManager as { success: (msg: string) => void; error: (msg: string) => void };

    const success = exportManager.exportCSV(dataToExport, 'jobs-monitoramento');

    if (success) {
      toastManager.success(`${dataToExport.length} jobs exportados com sucesso`);
    } else {
      toastManager.error('Erro ao exportar dados');
    }
  };

  exportBtn.addEventListener('click', exportHandler);
  return exportHandler;
}

export function setupSelectionListeners(container: HTMLElement, state: Record<string, unknown>, handlers: Record<string, unknown>) {
  const selectHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    const selectedJobs = state.selectedJobs as Set<string>;
    const paginatedJobs = state.paginatedJobs as Record<string, unknown>[];
    const allJobs = state.allJobs as Record<string, unknown>[];
    const rootContainer = handlers.rootContainer as HTMLElement | null;

    const selectAll = target.closest('.p02-select-all') as HTMLInputElement | null;
    if (selectAll) {
      toggleSelectAll(selectedJobs, paginatedJobs, selectAll.checked);
      updateSelectionUI(container, paginatedJobs, selectedJobs);
      updateBulkBar(rootContainer, selectedJobs);
      return;
    }

    const rowCheckbox = target.closest('.p02-row-checkbox') as HTMLInputElement | null;
    if (rowCheckbox) {
      const jobId = rowCheckbox.dataset.jobId as string;
      toggleSelection(selectedJobs, jobId, rowCheckbox.checked);
      updateSelectionUI(container, paginatedJobs, selectedJobs);
      updateBulkBar(rootContainer, selectedJobs);
      return;
    }

    const bulkAction = target.closest('[data-bulk-action]') as HTMLElement | null;
    if (bulkAction) {
      handleBulkAction(bulkAction.dataset.bulkAction as string, selectedJobs, allJobs, handlers);
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

  container.addEventListener('change', selectHandler);
  container.addEventListener('click', selectHandler);
  return selectHandler;
}

export function setupInlineActionListeners(container: HTMLElement, state: Record<string, unknown>, handlers: Record<string, unknown>) {
  const inlineActionHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('.p02-inline-btn[data-action]') as HTMLElement | null;
    if (!btn) return;

    e.stopPropagation();
    const action = btn.dataset.action;
    const jobId = btn.dataset.jobId;
    const job = (state.allJobs as Record<string, unknown>[]).find((j: Record<string, unknown>) => String(j.id) === String(jobId));

    if (job) {
      handleInlineAction(action as string, job, handlers);
    }
  };

  container.addEventListener('click', inlineActionHandler);
  return inlineActionHandler;
}

export function removeFilterListeners(rootContainer: HTMLElement | null, filterHandler: EventListener | null) {
  const filtersEl = rootContainer?.querySelector('[data-filters]');
  if (filtersEl && filterHandler) {
    filtersEl.removeEventListener('change', filterHandler);
    filtersEl.removeEventListener('input', filterHandler);
    filtersEl.removeEventListener('click', filterHandler);
  }
}

export function removeExportListener(rootContainer: HTMLElement | null, exportHandler: EventListener | null) {
  const exportBtn = rootContainer?.querySelector('[data-action="export"]');
  if (exportBtn && exportHandler) {
    exportBtn.removeEventListener('click', exportHandler);
  }
}

export function removeContainerListeners(container: HTMLElement | null, handlers: Record<string, unknown>) {
  if (!container) return;
  if (handlers.rowClickHandler) container.removeEventListener('click', handlers.rowClickHandler as EventListener);
  if (handlers.contextHandler) container.removeEventListener('contextmenu', handlers.contextHandler as EventListener);
  if (handlers.selectHandler) {
    container.removeEventListener('change', handlers.selectHandler as EventListener);
    container.removeEventListener('click', handlers.selectHandler as EventListener);
  }
  if (handlers.inlineActionHandler) container.removeEventListener('click', handlers.inlineActionHandler as EventListener);
}

export default {
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

export const MODULE_ID = 'panel-02/ui/events';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true } }; }
