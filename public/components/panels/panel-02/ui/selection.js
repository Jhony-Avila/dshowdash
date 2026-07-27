function toggleSelectAll(selectedJobs, paginatedJobs, checked) {
  paginatedJobs.forEach((job) => {
    const jobId = String(job.id);
    if (checked) {
      selectedJobs.add(jobId);
    } else {
      selectedJobs.delete(jobId);
    }
  });
}
function toggleSelection(selectedJobs, jobId, checked) {
  if (checked) {
    selectedJobs.add(String(jobId));
  } else {
    selectedJobs.delete(String(jobId));
  }
}
function updateSelectionUI(container, paginatedJobs, selectedJobs) {
  const rows = container.querySelectorAll("tr[data-job-id]");
  rows.forEach((row) => {
    const htmlRow = row;
    const jobId = htmlRow.dataset.jobId;
    const checkbox = row.querySelector(".p02-row-checkbox");
    const isSelected = jobId ? selectedJobs.has(jobId) : false;
    row.classList.toggle("selected", isSelected);
    if (checkbox) checkbox.checked = isSelected;
  });
  const selectAll = container.querySelector(".p02-select-all");
  if (selectAll) {
    const allSelected = paginatedJobs.length > 0 && paginatedJobs.every((j) => selectedJobs.has(String(j.id)));
    const someSelected = paginatedJobs.some((j) => selectedJobs.has(String(j.id)));
    selectAll.checked = allSelected;
    selectAll.indeterminate = someSelected && !allSelected;
  }
}
function updateBulkBar(rootContainer, selectedJobs) {
  let bulkBar = rootContainer?.querySelector(".p02-bulk-bar");
  if (selectedJobs.size > 0) {
    if (!bulkBar) {
      bulkBar = document.createElement("div");
      bulkBar.className = "p02-bulk-bar";
      bulkBar.setAttribute("role", "toolbar");
      bulkBar.setAttribute("aria-label", "Acoes em massa");
      bulkBar.innerHTML = `
        <span class="p02-bulk-count"><span data-selected-count>0</span> selecionados</span>
        <div class="p02-bulk-actions">
          <button class="p02-bulk-btn" data-bulk-action="run">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Executar
          </button>
          <button class="p02-bulk-btn" data-bulk-action="pause">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            Pausar
          </button>
          <button class="p02-bulk-btn" data-bulk-action="export">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar
          </button>
        </div>
        <button class="p02-bulk-clear" data-action="clear-selection">Limpar selecao</button>
      `;
      const content = rootContainer?.querySelector(".p02-content");
      content?.parentNode?.insertBefore(bulkBar, content);
    }
    bulkBar.classList.add("visible");
    const countEl = bulkBar.querySelector("[data-selected-count]");
    if (countEl) countEl.textContent = String(selectedJobs.size);
  } else {
    bulkBar?.classList.remove("visible");
  }
}
var selection_default = { toggleSelectAll, toggleSelection, updateSelectionUI, updateBulkBar };
const MODULE_ID = "panel-02/ui/selection";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { selectionReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  selection_default as default,
  healthCheck,
  info,
  toggleSelectAll,
  toggleSelection,
  updateBulkBar,
  updateSelectionUI
};
