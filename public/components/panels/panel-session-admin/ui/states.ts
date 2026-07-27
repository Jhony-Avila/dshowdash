// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P25-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-session-admin-ui-states
// PURPOSE: Panel Session Admin - States Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
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
//   setFilters() — exported function
//   setAutoRefresh() — exported function
//   setCountdown() — exported function
//   setTableDensity() — exported function
//   highlightRow() — exported function
//   setRowSelected() — exported function
//   updateSummary() — exported function
//   ... and 8 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Toast (via Ports fallback only)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels-panel-session-admin-ui-states';

let _container: HTMLElement | null = null;

function _getToast() {
  if (typeof window === 'undefined') return null;
  const strictMode = isStrict();
  if (window.Core?.windowAdapter?.get) {
    const wt = window.Core.windowAdapter.get('Toast');
    if (wt) return wt;
  }
  if (strictMode) return null;
  if (window.Toast) {
    recordViolation('WINDOW_TOAST_FALLBACK', { module: MODULE_ID });
    return window.Toast;
  }
  return null;
}

export function init(container: HTMLElement) { _container = container; }
export function destroy() { _container = null; }

export function showLoading() {
  if (!_container) return;
  const content = _container.querySelector('.psa__content');
  if (content) content.classList.add('psa__content--loading');
  const spinner = _container.querySelector('.psa__loading') as HTMLElement | null;
  if (spinner) spinner.style.display = 'flex';
}

export function hideLoading() {
  if (!_container) return;
  const content = _container.querySelector('.psa__content');
  if (content) content.classList.remove('psa__content--loading');
  const spinner = _container.querySelector('.psa__loading') as HTMLElement | null;
  if (spinner) spinner.style.display = 'none';
}

export function showError(message: string) {
  if (!_container) return;
  const alert = _container.querySelector('.psa__alert--error') as HTMLElement | null;
  if (alert) {
    alert.style.display = 'flex';
    const textEl = alert.querySelector('span') || alert;
    if (textEl) textEl.textContent = message;
  }
}

export function hideError() {
  if (!_container) return;
  const alert = _container.querySelector('.psa__alert--error') as HTMLElement | null;
  if (alert) alert.style.display = 'none';
}

export function setFilters(filters: Record<string, string>) {
  if (!_container || !filters) return;
  const statusSelect = _container.querySelector('[data-filter="status"]') as HTMLSelectElement | null;
  if (statusSelect && filters.status) statusSelect.value = filters.status;
  const searchInput = _container.querySelector('[data-filter="search"]') as HTMLInputElement | null;
  if (searchInput && filters.search !== undefined) searchInput.value = filters.search;
}

export function setAutoRefresh(enabled: boolean) {
  if (!_container) return;
  const btn = _container.querySelector('[data-action="toggle-auto-refresh"]');
  if (btn) {
    btn.classList.toggle('psa__btn--active', enabled);
    btn.setAttribute('aria-pressed', String(enabled));
  }
}

export function setCountdown(seconds: number) {
  if (!_container) return;
  const countdown = _container.querySelector('[data-countdown]');
  if (countdown) countdown.textContent = `${seconds}s`;
}

export function setTableDensity(density: string) {
  if (!_container) return;
  const table = _container.querySelector('.psa__table');
  if (table) {
    table.classList.remove('psa__table--compact', 'psa__table--comfortable');
    if (density === 'compact') table.classList.add('psa__table--compact');
    if (density === 'comfortable') table.classList.add('psa__table--comfortable');
  }
}

interface _HighlightElement extends Element {
  _highlightTimer?: ReturnType<typeof setTimeout> | null;
}

export function highlightRow(sessionToken: string) {
  if (!_container || !sessionToken) return;
  const row = _container.querySelector(`[data-session-token="${sessionToken}"]`) as _HighlightElement | null;
  if (row) {
    if (row._highlightTimer) clearTimeout(row._highlightTimer);
    row.classList.add('psa__row--highlight');
    row._highlightTimer = setTimeout(() => { row.classList.remove('psa__row--highlight'); row._highlightTimer = null; }, 2000);
  }
}

export function setRowSelected(sessionToken: string, selected: boolean) {
  if (!_container || !sessionToken) return;
  const row = _container.querySelector(`[data-session-token="${sessionToken}"]`);
  if (row) {
    row.classList.toggle('psa__row--selected', selected);
    const checkbox = row.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    if (checkbox) checkbox.checked = selected;
  }
}

export function updateSummary(total: number, active: number, filtered: number | null | undefined) {
  if (!_container) return;
  const totalEl = _container.querySelector('[data-summary="total"]');
  if (totalEl) totalEl.textContent = String(total);
  const activeEl = _container.querySelector('[data-summary="active"]');
  if (activeEl) activeEl.textContent = String(active);
  const filteredEl = _container.querySelector('[data-summary="filtered"]');
  if (filteredEl) {
    if (filtered !== null && filtered !== undefined && filtered !== total) {
      filteredEl.textContent = String(filtered);
      const parent = filteredEl.closest('.psa__summary-item');
      if (parent) parent.classList.remove('hidden');
    } else {
      const parent2 = filteredEl.closest('.psa__summary-item');
      if (parent2) parent2.classList.add('hidden');
    }
  }
}

export function setLastUpdate(timestamp: number) {
  if (!_container || !timestamp) return;
  const el = _container.querySelector('[data-last-update]') as HTMLElement | null;
  if (el) {
    const date = new Date(timestamp);
    el.textContent = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    el.title = date.toLocaleString('pt-BR');
  }
}

export function setButtonLoading(action: string, loading: boolean) {
  if (!_container) return;
  const btn = _container.querySelector(`[data-action="${action}"]`) as HTMLButtonElement | null;
  if (btn) {
    btn.disabled = loading;
    btn.classList.toggle('psa__btn--loading', loading);
    const icon = btn.querySelector('svg, .psa__spin');
    if (icon) icon.classList.toggle('psa__spin', loading);
  }
}

export function setButtonDisabled(action: string, disabled: boolean) {
  if (!_container) return;
  const btn = _container.querySelector(`[data-action="${action}"]`) as HTMLButtonElement | null;
  if (btn) btn.disabled = disabled;
}

export function toast(message: string, type?: string) {
  if (!type) type = 'info';
  const toastService = _getToast();
  if (toastService?.show) toastService.show(message, type);
}

export function setFullscreen(active: boolean) {
  if (!_container) return false;
  const panel = _container.querySelector('.psa');
  if (panel) {
    panel.classList.toggle('psa--fullscreen', active);
    return active;
  }
  return false;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasContainer: !!_container, p25Compliant: true }; }

export function healthCheck() { return { status: _container ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, hasContainer: !!_container, p25Compliant: true, timestamp: Date.now() }; }

export function getVersion() { return VERSION; }

export default { VERSION, MODULE_ID, init, destroy, showLoading, hideLoading, showError, hideError, setFilters, setAutoRefresh, setCountdown, setTableDensity, highlightRow, setRowSelected, updateSummary, setLastUpdate, setButtonLoading, setButtonDisabled, toast, setFullscreen, info, healthCheck, getVersion };
