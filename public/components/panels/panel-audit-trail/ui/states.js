import { CSS_PREFIX, updateHealthSummary, updateCountdown, setAutoRefreshState, setDensity, showToast, toggleFullscreen, updateBulkActions, buildColumnsMenu, toggleExportMenu } from "./template.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-audit-trail-states";
let _container = null;
function init(container) {
  _container = container;
  return { ok: true };
}
function destroy() {
  _container = null;
}
function showLoading() {
  const el = _container ? _container.querySelector("[data-loading]") : null;
  if (el) {
    el.style.display = "flex";
    el.innerHTML = `<div class="${CSS_PREFIX}-loading-spinner"></div><span>Carregando...</span>`;
  }
}
function hideLoading() {
  const el = _container ? _container.querySelector("[data-loading]") : null;
  if (el) el.style.display = "none";
}
function showError(message) {
  const el = _container ? _container.querySelector("[data-error]") : null;
  if (el) {
    el.innerHTML = `<svg class="${CSS_PREFIX}-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="40" height="40"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg><p class="${CSS_PREFIX}-error-message">${message}</p><button class="${CSS_PREFIX}-retry-btn" data-action="refresh" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>Tentar novamente</button>`;
    el.style.display = "flex";
  }
}
function hideError() {
  const el = _container ? _container.querySelector("[data-error]") : null;
  if (el) el.style.display = "none";
}
function setActiveTab(tab) {
  if (!_container) return;
  _container.querySelectorAll("[data-tab]").forEach((t) => {
    t.classList.toggle(`${CSS_PREFIX}-tab-active`, t.dataset.tab === tab);
  });
}
function setActivePreset(preset) {
  if (!_container) return;
  _container.querySelectorAll("[data-preset]").forEach((p) => {
    p.classList.toggle(`${CSS_PREFIX}-preset-active`, p.dataset.preset === preset);
  });
}
function updatePagination(offset, limit, total) {
  if (!_container) return;
  const start = total > 0 ? offset + 1 : 0;
  const end = Math.min(offset + limit, total);
  const text = `${start} - ${end}`;
  const infoEl = _container.querySelector("[data-pagination-info]");
  const textEl = _container.querySelector("[data-pagination-text]");
  const totalEl = _container.querySelector("[data-total-count]");
  const totalFooterEl = _container.querySelector("[data-total-count-footer]");
  const filteredEl = _container.querySelector("[data-filtered-count]");
  const prevBtn = _container.querySelector('[data-action="prev"]');
  const nextBtn = _container.querySelector('[data-action="next"]');
  if (infoEl) infoEl.textContent = text;
  if (textEl) textEl.textContent = `${text} de ${total}`;
  if (totalEl) totalEl.textContent = String(total);
  if (totalFooterEl) totalFooterEl.textContent = String(total);
  if (filteredEl) filteredEl.textContent = String(total);
  if (prevBtn) prevBtn.disabled = offset === 0;
  if (nextBtn) nextBtn.disabled = offset + limit >= total;
}
function setLastUpdate(timestamp) {
  const el = _container ? _container.querySelector("[data-last-update] span") : null;
  if (el && timestamp) el.textContent = new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function setFilters(filters) {
  if (!_container) return;
  Object.keys(filters).forEach((key) => {
    const el = _container.querySelector(`[data-filter="${key}"]`);
    if (el) el.value = filters[key] || "";
  });
  if (filters.timePreset) setActivePreset(filters.timePreset);
}
function clearFilterInputs() {
  if (!_container) return;
  _container.querySelectorAll("[data-filter]").forEach((input) => {
    input.value = "";
  });
  _container.querySelectorAll("[data-inline-filter]").forEach((input) => {
    input.value = "";
  });
  _container.querySelectorAll("[data-preset]").forEach((p) => {
    p.classList.remove(`${CSS_PREFIX}-preset-active`);
  });
  const defaultPreset = _container.querySelector('[data-preset="LAST_30_DAYS"]');
  if (defaultPreset) defaultPreset.classList.add(`${CSS_PREFIX}-preset-active`);
}
function setRefreshLoading(loading) {
  const btn = _container ? _container.querySelector('[data-action="refresh"]') : null;
  if (btn) {
    btn.classList.toggle(`${CSS_PREFIX}-action-btn--loading`, loading);
    btn.disabled = loading;
  }
}
function setHealthSummary(stats) {
  updateHealthSummary(_container, stats);
}
function setCountdown(seconds) {
  updateCountdown(_container, seconds);
}
function setAutoRefresh(active) {
  setAutoRefreshState(_container, active);
}
function setTableDensity(density) {
  setDensity(_container, density);
}
function setSortColumn(key, direction) {
  if (!_container) return;
  _container.querySelectorAll("th.sortable").forEach((th) => {
    th.classList.remove("sorted-asc", "sorted-desc");
    if (th.dataset.sortKey === key) th.classList.add(direction === "asc" ? "sorted-asc" : "sorted-desc");
  });
}
function toast(message, type) {
  if (!type) type = "info";
  showToast(_container, message, type);
}
function setFullscreen(active) {
  if (active) {
    if (_container) _container.classList.add("fullscreen");
  } else {
    if (_container) _container.classList.remove("fullscreen");
  }
  return toggleFullscreen(_container);
}
function toggleFullscreenMode() {
  return toggleFullscreen(_container);
}
function setSelectedCount(count) {
  updateBulkActions(_container, count);
}
function setRowSelected(logId, selected) {
  const row = _container ? _container.querySelector(`[data-log-id="${logId}"]`) : null;
  const checkbox = _container ? _container.querySelector(`[data-row-select="${logId}"]`) : null;
  if (row) row.classList.toggle("selected", selected);
  if (checkbox) checkbox.checked = selected;
}
function setAllRowsSelected(selected) {
  if (_container) {
    _container.querySelectorAll("[data-row-select]").forEach((cb) => {
      cb.checked = selected;
    });
    _container.querySelectorAll("[data-log-id]").forEach((row) => {
      row.classList.toggle("selected", selected);
    });
  }
  const selectAll = _container ? _container.querySelector('[data-action="select-all"]') : null;
  if (selectAll) selectAll.checked = selected;
}
function updateSelectAllState(allSelected, someSelected) {
  const selectAll = _container ? _container.querySelector('[data-action="select-all"]') : null;
  if (selectAll) {
    selectAll.checked = allSelected;
    selectAll.indeterminate = someSelected && !allSelected;
  }
}
function updateColumnsMenu(tab, visibleColumns) {
  const menu = _container ? _container.querySelector("[data-columns-menu]") : null;
  if (menu) {
    menu.innerHTML = `<div class="${CSS_PREFIX}-columns-menu-header">Colunas Vis\xEDveis</div>${buildColumnsMenu(tab, visibleColumns)}`;
  }
}
function setColumnVisibility(colKey, visible) {
  if (_container) {
    _container.querySelectorAll(`[data-col="${colKey}"]`).forEach((cell) => {
      cell.classList.toggle("col-hidden", !visible);
    });
  }
}
function setInlineFiltersActive(active) {
  const table = _container ? _container.querySelector(`.${CSS_PREFIX}-table`) : null;
  const btn = _container ? _container.querySelector('[data-action="toggle-inline-filters"]') : null;
  if (table) table.classList.toggle("inline-filters-active", active);
  if (btn) btn.classList.toggle("active", active);
}
function setInlineFilterValue(colKey, value) {
  const input = _container ? _container.querySelector(`[data-inline-filter="${colKey}"]`) : null;
  if (input) input.value = value || "";
}
function clearInlineFilters() {
  if (_container) {
    _container.querySelectorAll("[data-inline-filter]").forEach((input) => {
      if (input.tagName === "SELECT") input.selectedIndex = 0;
      else input.value = "";
    });
  }
}
function toggleRowExpanded(logId, expanded) {
  const row = _container ? _container.querySelector(`tr[data-log-id="${logId}"]`) : null;
  const expandedRow = _container ? _container.querySelector(`tr[data-expanded-id="${logId}"]`) : null;
  const trigger = row ? row.querySelector(".pat-expand-trigger") : null;
  if (row) row.classList.toggle("expanded", expanded);
  if (expandedRow) expandedRow.classList.toggle("open", expanded);
  if (trigger) trigger.classList.toggle("rotated", expanded);
}
function collapseAllRows() {
  if (_container) {
    _container.querySelectorAll(".pat-row-expandable.expanded").forEach((row) => {
      row.classList.remove("expanded");
    });
    _container.querySelectorAll(".pat-row-expanded.open").forEach((row) => {
      row.classList.remove("open");
    });
    _container.querySelectorAll(".pat-expand-trigger.rotated").forEach((t) => {
      t.classList.remove("rotated");
    });
  }
}
function setGroupBy(groupKey) {
  const select = _container ? _container.querySelector('[data-action="group-by"]') : null;
  if (select) select.value = groupKey || "";
}
function toggleGroupCollapsed(groupId, collapsed) {
  const header = _container ? _container.querySelector(`[data-group="${groupId}"]`) : null;
  if (header) header.classList.toggle("collapsed", collapsed);
}
function collapseAllGroups() {
  if (_container) _container.querySelectorAll(".pat-group-header").forEach((header) => {
    header.classList.add("collapsed");
  });
}
function expandAllGroups() {
  if (_container) _container.querySelectorAll(".pat-group-header").forEach((header) => {
    header.classList.remove("collapsed");
  });
}
function toggleExportMenuState() {
  toggleExportMenu(_container);
}
function showExportProgress(show, progress, text) {
  if (progress === void 0) progress = 0;
  if (text === void 0) text = "Exportando...";
  let progressEl = _container ? _container.querySelector(".pat-export-progress") : null;
  if (show) {
    if (!progressEl) {
      progressEl = document.createElement("div");
      progressEl.className = "pat-export-progress";
      progressEl.innerHTML = `<div class="pat-export-progress-spinner"></div><span class="pat-export-progress-text">${text}</span><div class="pat-export-progress-bar"><div class="pat-export-progress-fill" style="width:${progress}%"></div></div>`;
      if (_container) _container.appendChild(progressEl);
    } else {
      const textEl = progressEl.querySelector(".pat-export-progress-text");
      const fillEl = progressEl.querySelector(".pat-export-progress-fill");
      if (textEl) textEl.textContent = text;
      if (fillEl) fillEl.style.width = `${progress}%`;
    }
  } else {
    if (progressEl) progressEl.remove();
  }
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, containerMounted: !!_container };
}
function healthCheck() {
  return { status: _container ? "HEALTHY" : "IDLE", moduleId: MODULE_ID, version: VERSION, checks: { containerReady: !!_container, showLoadingReady: typeof showLoading === "function", updatePaginationReady: typeof updatePagination === "function" } };
}
var states_default = { VERSION, MODULE_ID, init, destroy, showLoading, hideLoading, showError, hideError, setActiveTab, setActivePreset, updatePagination, setLastUpdate, setFilters, clearFilterInputs, setRefreshLoading, setHealthSummary, setCountdown, setAutoRefresh, setTableDensity, setSortColumn, toast, setFullscreen, toggleFullscreenMode, setSelectedCount, setRowSelected, setAllRowsSelected, updateSelectAllState, updateColumnsMenu, setColumnVisibility, setInlineFiltersActive, setInlineFilterValue, clearInlineFilters, toggleRowExpanded, collapseAllRows, setGroupBy, toggleGroupCollapsed, collapseAllGroups, expandAllGroups, toggleExportMenuState, showExportProgress, getVersion, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  clearFilterInputs,
  clearInlineFilters,
  collapseAllGroups,
  collapseAllRows,
  states_default as default,
  destroy,
  expandAllGroups,
  getVersion,
  healthCheck,
  hideError,
  hideLoading,
  info,
  init,
  setActivePreset,
  setActiveTab,
  setAllRowsSelected,
  setAutoRefresh,
  setColumnVisibility,
  setCountdown,
  setFilters,
  setFullscreen,
  setGroupBy,
  setHealthSummary,
  setInlineFilterValue,
  setInlineFiltersActive,
  setLastUpdate,
  setRefreshLoading,
  setRowSelected,
  setSelectedCount,
  setSortColumn,
  setTableDensity,
  showError,
  showExportProgress,
  showLoading,
  toast,
  toggleExportMenuState,
  toggleFullscreenMode,
  toggleGroupCollapsed,
  toggleRowExpanded,
  updateColumnsMenu,
  updatePagination,
  updateSelectAllState
};
