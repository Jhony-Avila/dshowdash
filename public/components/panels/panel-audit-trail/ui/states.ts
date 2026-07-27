// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail-states
// PURPOSE: Panel Audit Trail - UI States Enterprise AAA Ultimate+
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CSS_PREFIX, updateHealthSummary, updateCountdown, setAutoRefreshState, setDen...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   init() — exported function
//   destroy() — exported function
//   showLoading() — exported function
//   hideLoading() — exported function
//   showError() — exported function
//   hideError() — exported function
//   setActiveTab() — exported function
//   setActivePreset() — exported function
//   updatePagination() — exported function
//   setLastUpdate() — exported function
//   setFilters() — exported function
//   clearFilterInputs() — exported function
//   setRefreshLoading() — exported function
//   ... and 28 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CSS_PREFIX, updateHealthSummary, updateCountdown, setAutoRefreshState, setDensity, showToast, toggleFullscreen, updateBulkActions, buildColumnsMenu, toggleExportMenu } from './template.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-audit-trail-states';

let _container: Element | null = null;

export function init(container: Element | null) { _container = container; return { ok: true }; }
export function destroy() { _container = null; }

export function showLoading() {
  const el = _container ? _container.querySelector('[data-loading]') as HTMLElement | null : null;
  if (el) {
    el.style.display = 'flex';
    el.innerHTML = `<div class="${CSS_PREFIX}-loading-spinner"></div><span>Carregando...</span>`;
  }
}

export function hideLoading() {
  const el = _container ? _container.querySelector('[data-loading]') as HTMLElement | null : null;
  if (el) el.style.display = 'none';
}

export function showError(message: string) {
  const el = _container ? _container.querySelector('[data-error]') as HTMLElement | null : null;
  if (el) {
    el.innerHTML = `<svg class="${CSS_PREFIX}-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="40" height="40"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg><p class="${CSS_PREFIX}-error-message">${message}</p><button class="${CSS_PREFIX}-retry-btn" data-action="refresh" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>Tentar novamente</button>`;
    el.style.display = 'flex';
  }
}

export function hideError() {
  const el = _container ? _container.querySelector('[data-error]') as HTMLElement | null : null;
  if (el) el.style.display = 'none';
}

export function setActiveTab(tab: string) {
  if (!_container) return;
  _container.querySelectorAll('[data-tab]').forEach(t => {
    t.classList.toggle(`${CSS_PREFIX}-tab-active`, (t as HTMLElement).dataset.tab === tab);
  });
}

export function setActivePreset(preset: string) {
  if (!_container) return;
  _container.querySelectorAll('[data-preset]').forEach(p => {
    p.classList.toggle(`${CSS_PREFIX}-preset-active`, (p as HTMLElement).dataset.preset === preset);
  });
}

export function updatePagination(offset: number, limit: number, total: number) {
  if (!_container) return;
  const start = total > 0 ? offset + 1 : 0;
  const end = Math.min(offset + limit, total);
  const text = `${start} - ${end}`;
  const infoEl = _container.querySelector('[data-pagination-info]');
  const textEl = _container.querySelector('[data-pagination-text]');
  const totalEl = _container.querySelector('[data-total-count]');
  const totalFooterEl = _container.querySelector('[data-total-count-footer]');
  const filteredEl = _container.querySelector('[data-filtered-count]');
  const prevBtn = _container.querySelector('[data-action="prev"]');
  const nextBtn = _container.querySelector('[data-action="next"]');
  if (infoEl) infoEl.textContent = text;
  if (textEl) textEl.textContent = `${text} de ${total}`;
  if (totalEl) totalEl.textContent = String(total);
  if (totalFooterEl) totalFooterEl.textContent = String(total);
  if (filteredEl) filteredEl.textContent = String(total);
  if (prevBtn) (prevBtn as HTMLButtonElement).disabled = offset === 0;
  if (nextBtn) (nextBtn as HTMLButtonElement).disabled = offset + limit >= total;
}

export function setLastUpdate(timestamp: number | string | null | undefined) {
  const el = _container ? _container.querySelector('[data-last-update] span') : null;
  if (el && timestamp) el.textContent = new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function setFilters(filters: Record<string, string>) {
  if (!_container) return;
  Object.keys(filters).forEach(key => {
    const el = _container!.querySelector(`[data-filter="${key}"]`) as HTMLInputElement | null;
    if (el) el.value = filters[key] || '';
  });
  if (filters.timePreset) setActivePreset(filters.timePreset);
}

export function clearFilterInputs() {
  if (!_container) return;
  _container.querySelectorAll('[data-filter]').forEach(input => { (input as HTMLInputElement).value = ''; });
  _container.querySelectorAll('[data-inline-filter]').forEach(input => { (input as HTMLInputElement).value = ''; });
  _container.querySelectorAll('[data-preset]').forEach(p => { p.classList.remove(`${CSS_PREFIX}-preset-active`); });
  const defaultPreset = _container.querySelector('[data-preset="LAST_30_DAYS"]');
  if (defaultPreset) defaultPreset.classList.add(`${CSS_PREFIX}-preset-active`);
}

export function setRefreshLoading(loading: boolean) {
  const btn = _container ? _container.querySelector('[data-action="refresh"]') as HTMLButtonElement | null : null;
  if (btn) { btn.classList.toggle(`${CSS_PREFIX}-action-btn--loading`, loading); btn.disabled = loading; }
}

export function setHealthSummary(stats: Record<string, number | null | undefined>) { updateHealthSummary(_container, stats); }
export function setCountdown(seconds: number | string) { updateCountdown(_container, seconds); }
export function setAutoRefresh(active: boolean) { setAutoRefreshState(_container, active); }
export function setTableDensity(density: string) { setDensity(_container, density); }

export function setSortColumn(key: string, direction: string) {
  if (!_container) return;
  _container.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if ((th as HTMLElement).dataset.sortKey === key) th.classList.add(direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
  });
}

export function toast(message: string, type: string) {
  if (!type) type = 'info';
  showToast(_container, message, type);
}

export function setFullscreen(active: boolean) {
  if (active) { if (_container) _container.classList.add('fullscreen'); }
  else { if (_container) _container.classList.remove('fullscreen'); }
  return toggleFullscreen(_container);
}

export function toggleFullscreenMode() { return toggleFullscreen(_container); }

export function setSelectedCount(count: number) { updateBulkActions(_container, count); }

export function setRowSelected(logId: string | number, selected: boolean) {
  const row = _container ? _container.querySelector(`[data-log-id="${logId}"]`) : null;
  const checkbox = _container ? _container.querySelector(`[data-row-select="${logId}"]`) as HTMLInputElement | null : null;
  if (row) row.classList.toggle('selected', selected);
  if (checkbox) checkbox.checked = selected;
}

export function setAllRowsSelected(selected: boolean) {
  if (_container) {
    _container.querySelectorAll('[data-row-select]').forEach(cb => { (cb as HTMLInputElement).checked = selected; });
    _container.querySelectorAll('[data-log-id]').forEach(row => { row.classList.toggle('selected', selected); });
  }
  const selectAll = _container ? _container.querySelector('[data-action="select-all"]') as HTMLInputElement | null : null;
  if (selectAll) selectAll.checked = selected;
}

export function updateSelectAllState(allSelected: boolean, someSelected: boolean) {
  const selectAll = _container ? _container.querySelector('[data-action="select-all"]') as HTMLInputElement | null : null;
  if (selectAll) { selectAll.checked = allSelected; selectAll.indeterminate = someSelected && !allSelected; }
}

export function updateColumnsMenu(tab: string, visibleColumns: string[]) {
  const menu = _container ? _container.querySelector('[data-columns-menu]') : null;
  if (menu) {
    menu.innerHTML = `<div class="${CSS_PREFIX}-columns-menu-header">Colunas Visíveis</div>${buildColumnsMenu(tab, visibleColumns)}`;
  }
}

export function setColumnVisibility(colKey: string, visible: boolean) {
  if (_container) {
    _container.querySelectorAll(`[data-col="${colKey}"]`).forEach(cell => { cell.classList.toggle('col-hidden', !visible); });
  }
}

export function setInlineFiltersActive(active: boolean) {
  const table = _container ? _container.querySelector(`.${CSS_PREFIX}-table`) : null;
  const btn = _container ? _container.querySelector('[data-action="toggle-inline-filters"]') : null;
  if (table) table.classList.toggle('inline-filters-active', active);
  if (btn) btn.classList.toggle('active', active);
}

export function setInlineFilterValue(colKey: string, value: string) {
  const input = _container ? _container.querySelector(`[data-inline-filter="${colKey}"]`) as HTMLInputElement | null : null;
  if (input) input.value = value || '';
}

export function clearInlineFilters() {
  if (_container) {
    _container.querySelectorAll('[data-inline-filter]').forEach(input => {
      if (input.tagName === 'SELECT') (input as HTMLSelectElement).selectedIndex = 0;
      else (input as HTMLInputElement).value = '';
    });
  }
}

export function toggleRowExpanded(logId: string | number, expanded: boolean) {
  const row = _container ? _container.querySelector(`tr[data-log-id="${logId}"]`) : null;
  const expandedRow = _container ? _container.querySelector(`tr[data-expanded-id="${logId}"]`) : null;
  const trigger = row ? row.querySelector('.pat-expand-trigger') : null;
  if (row) row.classList.toggle('expanded', expanded);
  if (expandedRow) expandedRow.classList.toggle('open', expanded);
  if (trigger) trigger.classList.toggle('rotated', expanded);
}

export function collapseAllRows() {
  if (_container) {
    _container.querySelectorAll('.pat-row-expandable.expanded').forEach((row: Element) => { row.classList.remove('expanded'); });
    _container.querySelectorAll('.pat-row-expanded.open').forEach((row: Element) => { row.classList.remove('open'); });
    _container.querySelectorAll('.pat-expand-trigger.rotated').forEach((t: Element) => { t.classList.remove('rotated'); });
  }
}

export function setGroupBy(groupKey: string) {
  const select = _container ? _container.querySelector('[data-action="group-by"]') as HTMLSelectElement | null : null;
  if (select) select.value = groupKey || '';
}

export function toggleGroupCollapsed(groupId: string, collapsed: boolean) {
  const header = _container ? _container.querySelector(`[data-group="${groupId}"]`) : null;
  if (header) header.classList.toggle('collapsed', collapsed);
}

export function collapseAllGroups() {
  if (_container) _container.querySelectorAll('.pat-group-header').forEach((header: Element) => { header.classList.add('collapsed'); });
}

export function expandAllGroups() {
  if (_container) _container.querySelectorAll('.pat-group-header').forEach((header: Element) => { header.classList.remove('collapsed'); });
}

export function toggleExportMenuState() { toggleExportMenu(_container); }

export function showExportProgress(show: boolean, progress?: number, text?: string) {
  if (progress === undefined) progress = 0;
  if (text === undefined) text = 'Exportando...';
  let progressEl = _container ? _container.querySelector('.pat-export-progress') as HTMLElement | null : null;
  if (show) {
    if (!progressEl) {
      progressEl = document.createElement('div');
      progressEl.className = 'pat-export-progress';
      progressEl.innerHTML = `<div class="pat-export-progress-spinner"></div><span class="pat-export-progress-text">${text}</span><div class="pat-export-progress-bar"><div class="pat-export-progress-fill" style="width:${progress}%"></div></div>`;
      if (_container) _container.appendChild(progressEl);
    } else {
      const textEl = progressEl.querySelector('.pat-export-progress-text');
      const fillEl = progressEl.querySelector('.pat-export-progress-fill');
      if (textEl) textEl.textContent = text;
      if (fillEl) (fillEl as HTMLElement).style.width = `${progress}%`;
    }
  } else {
    if (progressEl) progressEl.remove();
  }
}

export function getVersion() { return VERSION; }

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, containerMounted: !!_container };
}

export function healthCheck() {
  return { status: _container ? 'HEALTHY' : 'IDLE', moduleId: MODULE_ID, version: VERSION, checks: { containerReady: !!_container, showLoadingReady: typeof showLoading === 'function', updatePaginationReady: typeof updatePagination === 'function' } };
}

export default { VERSION, MODULE_ID, init, destroy, showLoading, hideLoading, showError, hideError, setActiveTab, setActivePreset, updatePagination, setLastUpdate, setFilters, clearFilterInputs, setRefreshLoading, setHealthSummary, setCountdown, setAutoRefresh, setTableDensity, setSortColumn, toast, setFullscreen, toggleFullscreenMode, setSelectedCount, setRowSelected, setAllRowsSelected, updateSelectAllState, updateColumnsMenu, setColumnVisibility, setInlineFiltersActive, setInlineFilterValue, clearInlineFilters, toggleRowExpanded, collapseAllRows, setGroupBy, toggleGroupCollapsed, collapseAllGroups, expandAllGroups, toggleExportMenuState, showExportProgress, getVersion, info, healthCheck };
