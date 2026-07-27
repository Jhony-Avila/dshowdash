import { createUiPorts } from "/core/runtime/ports-profiles.js";
import * as store from "../state/store.js";
import * as persist from "../state/persist.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels-panel-12-ui-table";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => _getPort("config")?.app?.debug ?? false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    logger?.error?.(prefix, ...args);
    return;
  }
  if (level === "warn") {
    logger?.warn?.(prefix, ...args);
    return;
  }
  if (_debug()) logger?.debug?.(prefix, ...args);
};
const escapeHtml = (text) => {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
};
const ICONS = { power: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>', trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>', warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', sortAsc: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-left:4px;"><polyline points="18 15 12 9 6 15"/></svg>', sortDesc: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-left:4px;"><polyline points="6 9 12 15 18 9"/></svg>' };
const render = (container, jobs, allColumns, onSort, setupTooltips, setupEventListeners, applyDensityFn, id) => {
  _initPorts();
  const renderStart = performance.now();
  const content = container.querySelector(`#jobs-content-${id}`);
  if (!content) return;
  if (!jobs?.length) {
    const hasFilters = store.getSearchTerm() || store.getFilters().status !== "" || store.getFilters().type !== "";
    renderEmpty(container, hasFilters, id, () => store.resetSearch(), () => store.resetFilters(), () => store.getFilteredAndSorted(), render);
    return;
  }
  const visibleColumns = persist.getVisibleColumns();
  const columns = visibleColumns.map((key) => allColumns[key]).filter(Boolean);
  const currentSort = store.getSort();
  const getSortIndicator = (colKey) => currentSort.column === colKey ? currentSort.direction === "asc" ? ` ${ICONS.sortAsc}` : ` ${ICONS.sortDesc}` : "";
  const getSortTooltip = (colKey, colLabel) => currentSort.column === colKey ? `Ordenado por: ${colLabel} (${currentSort.direction === "asc" ? "crescente" : "decrescente"})` : `Clique ou pressione Enter para ordenar por ${colLabel}`;
  const headerHtml = columns.map((col) => {
    const sortable = col.sortable;
    const sortIndicator = sortable ? getSortIndicator(col.key) : "";
    const isActiveSort = currentSort.column === col.key;
    const ariaSort = isActiveSort ? ` aria-sort="${currentSort.direction === "asc" ? "ascending" : "descending"}"` : "";
    return `<th scope="col" role="columnheader" data-column="${col.key}" ${sortable ? 'data-sortable="true"' : ""} ${sortable ? 'tabindex="0"' : ""} ${isActiveSort ? 'class="painel-12-active-sort"' : ""}${ariaSort} ${sortable ? 'style="cursor: pointer; user-select: none;"' : ""} ${sortable ? `title="${getSortTooltip(col.key, col.label)}"` : ""}>${col.label}${sortIndicator}</th>`;
  }).join("");
  const bodyHtml = jobs.map((job) => {
    const isActive = parseInt(job.is_active) === 1;
    const jobName = escapeHtml(job.job_name || job.nome || "N/A");
    const jobId = store.normalizeId(job.id);
    const cellsHtml = columns.map((col) => {
      const cellContent = col.render(job);
      const isHeader = col.key === "id";
      return isHeader ? `<th scope="row" class="${col.className}" role="rowheader">${cellContent}</th>` : `<td class="${col.className}" role="cell">${cellContent}</td>`;
    }).join("");
    return `<tr class="painel-12-job-row" data-job-id="${jobId}" role="row" tabindex="0">${cellsHtml}<td class="painel-12-col-actions" role="cell"><div class="painel-12-actions-wrapper"><button class="painel-12-btn-icon painel-12-btn-toggle ${isActive ? "active" : "inactive"}" data-id="${jobId}" data-active="${isActive ? 1 : 0}" data-name="${jobName}" aria-pressed="${isActive ? "true" : "false"}" aria-label="${isActive ? "Desativar" : "Ativar"} job ${jobName}" title="${isActive ? "Desativar" : "Ativar"}">${ICONS.power}</button><button class="painel-12-btn-icon painel-12-btn-delete" data-id="${jobId}" data-name="${jobName}" aria-label="Excluir job ${jobName}" title="Excluir">${ICONS.trash}</button></div></td></tr>`;
  }).join("");
  content.innerHTML = `<div class="painel-12-table-container"><table class="painel-12-table" role="table" aria-label="Tabela de jobs"><caption class="sr-only">Tabela de gerenciamento de ${jobs.length} ${jobs.length === 1 ? "job" : "jobs"}</caption><thead><tr role="row">${headerHtml}<th scope="col" role="columnheader">A\xE7\xF5es</th></tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
  setupEventListeners?.(container);
  if (onSort) attachSortListeners(container, onSort);
  setupScrollDetection(container);
  setupTooltips?.(container, id);
  applyDensityFn?.(container, persist.getDensity());
  _log("debug", "Render completo", { jobCount: jobs.length, columnCount: columns.length, duration: (performance.now() - renderStart).toFixed(2) });
};
const attachSortListeners = (container, onSort) => {
  container.querySelectorAll('th[data-sortable="true"]').forEach((header) => {
    header.addEventListener("click", () => onSort(container, header.getAttribute("data-column") || "", header));
    header.addEventListener("keydown", (e) => {
      const ke = e;
      if (ke.key === "Enter" || ke.key === " ") {
        ke.preventDefault();
        onSort(container, header.getAttribute("data-column") || "", header);
      }
    });
  });
};
const setupScrollDetection = (container) => {
  const contentEl = container.querySelector(".painel-12-content");
  const tableContainer = contentEl?.querySelector(".painel-12-table-container");
  if (!contentEl || !tableContainer) return;
  if (contentEl._p12ScrollHandler) {
    contentEl.removeEventListener("scroll", contentEl._p12ScrollHandler);
  }
  contentEl._p12ScrollHandler = () => tableContainer.classList.toggle("scrolled", contentEl.scrollTop > 10);
  contentEl.addEventListener("scroll", contentEl._p12ScrollHandler);
  _log("debug", "Scroll detection configurado");
};
const renderSkeleton = (container, id) => {
  const content = container.querySelector(`#jobs-content-${id}`);
  if (!content) return;
  content.innerHTML = `<div class="painel-12-skeleton" role="status" aria-live="polite" aria-label="Carregando jobs">${Array(8).fill('<div class="painel-12-skeleton-row"><div class="painel-12-skeleton-cell small"></div><div class="painel-12-skeleton-cell large"></div><div class="painel-12-skeleton-cell badge"></div><div class="painel-12-skeleton-cell badge"></div><div class="painel-12-skeleton-cell medium"></div><div class="painel-12-skeleton-cell badge"></div><div class="painel-12-skeleton-cell actions"></div></div>').join("")}</div>`;
};
const renderEmpty = (container, hasFilters, id, resetSearch, resetFilters, getFilteredAndSorted, renderCallback) => {
  const content = container.querySelector(`#jobs-content-${id}`);
  if (!content) return;
  const message = hasFilters ? "Nenhum resultado encontrado" : "Nenhum job cadastrado";
  const hint = hasFilters ? "Tente ajustar os filtros ou a busca" : "Adicione um novo job para come\xE7ar";
  const searchTerm = store.getSearchTerm();
  const filters = store.getFilters();
  let ctaLabel = "";
  if (searchTerm && (filters.status !== "" || filters.type !== "")) ctaLabel = "Limpar Busca e Filtros";
  else if (searchTerm) ctaLabel = "Limpar Busca";
  else ctaLabel = "Limpar Filtros";
  const ctaButton = hasFilters ? `<button class="painel-12-btn painel-12-btn-secondary" id="btn-clear-all" style="margin-top: 1rem;">${ctaLabel}</button>` : "";
  content.innerHTML = `<div class="painel-12-empty" role="status" aria-live="polite"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><div style="font-weight: 600; margin-bottom: 0.5rem;">${message}</div><div style="color: rgba(255,255,255,0.6); font-size: 0.875rem;">${hint}</div>${ctaButton}</div>`;
  if (hasFilters && renderCallback) {
    content.querySelector("#btn-clear-all")?.addEventListener("click", () => {
      const searchInput = container.querySelector(`#search-input-${id}`);
      if (searchInput) searchInput.value = "";
      resetSearch();
      resetFilters();
      container.querySelectorAll(".painel-12-filter-btn").forEach((btn) => {
        const isAllFilter = btn.getAttribute("data-filter-value") === "";
        btn.classList.toggle("active", isAllFilter);
        btn.setAttribute("aria-pressed", isAllFilter ? "true" : "false");
      });
      _log("debug", "Filtros limpos", { resultCount: getFilteredAndSorted().length });
    });
  }
};
const renderError = (container, message, id) => {
  const content = container.querySelector(`#jobs-content-${id}`);
  if (content) content.innerHTML = `<div class="painel-12-error" role="alert" aria-live="assertive">${ICONS.warning} ${message || "Erro ao carregar jobs"}</div>`;
};
const updateJobRow = (container, jobId, updates, allColumns) => {
  const normJobId = store.normalizeId(jobId);
  const row = container.querySelector(`tr[data-job-id="${normJobId}"]`);
  if (!row) return false;
  store.updateJob(jobId, updates);
  const job = store.getJobs().find((j) => store.normalizeId(j.id) === normJobId);
  if (!job) return false;
  const visibleColumns = persist.getVisibleColumns();
  Object.keys(updates).forEach((key) => {
    if (!visibleColumns.includes(key)) return;
    const col = allColumns[key];
    if (!col) return;
    const cell = row.querySelector(`.${col.className}`);
    if (cell) cell.innerHTML = col.render(job);
  });
  if ("is_active" in updates) {
    const isActive = parseInt(updates.is_active) === 1;
    const toggleBtn = row.querySelector(".painel-12-btn-toggle");
    if (toggleBtn) {
      toggleBtn.className = `painel-12-btn-icon painel-12-btn-toggle ${isActive ? "active" : "inactive"}`;
      toggleBtn.innerHTML = ICONS.power;
      toggleBtn.setAttribute("aria-pressed", isActive ? "true" : "false");
      toggleBtn.setAttribute("aria-label", `${isActive ? "Desativar" : "Ativar"} job ${job.job_name || job.nome}`);
      toggleBtn.setAttribute("title", isActive ? "Desativar" : "Ativar");
      toggleBtn.setAttribute("data-active", isActive ? "1" : "0");
    }
  }
  return true;
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
const healthCheck = () => ({ status: Ports.snapshot()._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { tableReady: true, loggerReady: !!_getPort("logger"), portsInitialized: Ports.snapshot()._initialized } });
export {
  MODULE_ID,
  VERSION,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  render,
  renderEmpty,
  renderError,
  renderSkeleton,
  updateJobRow
};
