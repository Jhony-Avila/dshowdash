// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.1.1-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-12
// PURPOSE: Painel 12 - CRUD de Jobs/Cron - Orchestrator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_ID from ./core/constants.js
//   renderHeader from ./core/header-template.js
//   state, loadCSS, getRefreshInterval, getStatus, getVersion, healthCheck...
//   loadData from ./handlers/data.js
//   handleToggleJob, handleDeleteJob from ./handlers/crud.js
//   handleSort, handleSearchChange, handleSearchClear, handleFilterChange, cleanup...
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   mount() — exported function
//   unmount() — exported function
//   destroy() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getStatus — exported value
//   getVersion — exported value
//   PANEL_ID — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
//   'input'
//   'keydown'
//   'visibilitychange'
// WINDOW ACCESS:
//   (window as any).Panel12
//   window.SessionManager (via windowAdapter ou fallback com recordViolation)
//   window.__dev
// ───────────────────────────────────────────────────────────────
// @changelog v9.2.0-STRICT-MODE: Migração para strict mode (NR-FULL)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import * as store from './state/store.js';
import * as persist from './state/persist.js';
import * as tooltip from './ui/tooltip.js';
import * as modals from './ui/modals.js';
import * as panelHeader from './ui/header.js';
import * as logger from './utils/logger.js';
import { PANEL_ID } from './core/constants.js';
import { renderHeader } from './core/header-template.js';
import { state, loadCSS, getRefreshInterval, getStatus, getVersion, healthCheck as lifecycleHealthCheck, info as lifecycleInfo, _log } from './core/lifecycle.js';
import { loadData } from './handlers/data.js';
import { handleToggleJob, handleDeleteJob } from './handlers/crud.js';
import { handleSort, handleSearchChange, handleSearchClear, handleFilterChange, cleanup } from './handlers/ui.js';

export const MODULE_ID = 'panel-12';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _isAuthenticated = () => {
  const auth = _getPort('auth');
  if (auth?.isAuthenticated?.()) return true;
  if (typeof window === 'undefined') return false;
  const strictMode = isStrict();
  if (window.Core?.windowAdapter?.get) {
    const sm = window.Core.windowAdapter.get('SessionManager');
    if (sm?.isAuthenticated?.()) return true;
  }
  if (strictMode) return false;
  if (window.SessionManager?.isAuthenticated?.()) {
    recordViolation('WINDOW_SESSIONMANAGER_FALLBACK', { module: MODULE_ID, method: '_isAuthenticated' });
    return true;
  }
  return false;
};

const _isDocumentVisible = () => typeof document !== 'undefined' && !document.hidden;

const _canRefresh = () => {
  if (!_isDocumentVisible()) return false;
  if (!_isAuthenticated()) return false;
  return true;
};

let _abortController: AbortController | null = null;

const callbacks = { handleSort: (c: HTMLElement, col: string, el: HTMLElement) => handleSort(c, col, el, callbacks), setupTooltipsWrapper: () => setupTooltipsWrapper(), setupDelegatedEventListeners: (c: HTMLElement) => setupDelegatedEventListeners(c) };

const setupTooltipsWrapper = () => (tooltip as any).setup();

const setupDelegatedEventListeners = (container: HTMLElement) => {
  container.addEventListener('click', (e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;
    const row = target.closest('tr[data-job-id]') as HTMLElement | null;
    const jobId = row?.dataset.jobId ?? null;
    const jobName = row?.dataset.jobName ?? null;
    if (action === 'toggle' && row && jobId) {
      if (!_isAuthenticated()) { _log('warn', 'toggle blocked - not authenticated'); return; }
      const isActive = target.dataset.active === 'true';
      handleToggleJob(container, target as HTMLButtonElement, row, jobId, !isActive);
    }
    else if (action === 'delete' && row && jobId && jobName) {
      if (!_isAuthenticated()) { _log('warn', 'delete blocked - not authenticated'); return; }
      (modals as any).confirmDelete(jobName).then((confirmed: boolean) => { if (confirmed) handleDeleteJob(container, target as HTMLButtonElement, row as HTMLElement, jobId, jobName); });
    }
    else if (action === 'edit' && jobId) {
      if (!_isAuthenticated()) { _log('warn', 'edit blocked - not authenticated'); return; }
      const job = (store as any).getJobById(jobId);
      if (job) (modals as any).showEdit(job);
    }
    else if (action === 'view' && jobId) { const job = (store as any).getJobById(jobId); if (job) (modals as any).showDetails(job); }
    else if (action === 'refresh') {
      if (!_isAuthenticated()) { _log('warn', 'refresh blocked - not authenticated'); return; }
      loadData(container, callbacks);
    }
  }, { signal: _abortController?.signal });
  const searchInput = container.querySelector('[data-search]');
  if (searchInput) { searchInput.addEventListener('input', (e: Event) => handleSearchChange((e.target as HTMLInputElement).value, callbacks), { signal: (_abortController as AbortController)?.signal }); searchInput.addEventListener('keydown', (e: Event) => { const ke = e as KeyboardEvent; if (ke.key === 'Escape') { (searchInput as HTMLInputElement).value = ''; handleSearchClear(callbacks); } }, { signal: (_abortController as AbortController)?.signal }); }
  const filters = container.querySelectorAll('[data-filter]');
  filters.forEach((select: Element) => { select.addEventListener('change', (e: Event) => { const filterType = (e.target as HTMLSelectElement).dataset.filter; handleFilterChange(filterType || '', (e.target as HTMLSelectElement).value, callbacks); }, { signal: (_abortController as AbortController)?.signal }); });
  const clearBtn = container.querySelector('[data-action="clear-filters"]');
  if (clearBtn) { clearBtn.addEventListener('click', () => { handleSearchClear(callbacks); container.querySelectorAll('[data-filter]').forEach((s: Element) => { (s as HTMLSelectElement).value = ''; }); store.resetFilters(); }, { signal: (_abortController as AbortController)?.signal }); }
};

const startPolling = (container: HTMLElement) => {
  if (state.intervalId) clearTimeout(state.intervalId);
  const poll = () => {
    if (_canRefresh()) {
      loadData(container, callbacks).then(() => {
        state.intervalId = setTimeout(poll, getRefreshInterval());
      });
    } else {
      state.intervalId = setTimeout(poll, getRefreshInterval());
    }
  };
  state.intervalId = setTimeout(poll, getRefreshInterval());
  _log('debug', 'Polling started', { interval: getRefreshInterval() });
};

const stopPolling = () => { if (state.intervalId) { clearTimeout(state.intervalId); state.intervalId = null; _log('debug', 'Polling stopped'); } };

export const mount = (container: HTMLElement) => { try {
  if (!container) { _log('error', 'Mount failed: container is null'); return Promise.resolve(false); }
  if (!_isAuthenticated()) {
    container.innerHTML = '<div style="padding:2rem;text-align:center;color:#F59E0B;">Faça login para acessar</div>';
    _log('warn', 'mount.blocked - not authenticated');
    return Promise.resolve(false);
  }
  _log('debug', 'Mounting panel-12...'); _initPorts(); loadCSS();
  _abortController = new AbortController();
  const savedSort = (persist as any).getSortState();
  if (savedSort) (store as any).setSort(savedSort);
  container.id = 'painel-12';
  container.innerHTML = (renderHeader as any)();
  (panelHeader as any).setup(container, { onSearchChange: (v: string) => handleSearchChange(v, callbacks), onSearchClear: () => handleSearchClear(callbacks), onFilterChange: (t: string, v: string) => handleFilterChange(t, v, callbacks), onRefresh: () => { if (_isAuthenticated()) loadData(container, callbacks); } });
  setupDelegatedEventListeners(container);
  return loadData(container, callbacks).then(() => {
    startPolling(container);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopPolling();
      } else if (_canRefresh()) {
        startPolling(container);
      }
    }, { signal: (_abortController as AbortController).signal });
    _log('debug', 'Panel-12 mounted successfully');
    return true;
  });
// @ts-expect-error strict migration — TS2339
} catch(err) { const _l = Ports.get('logger'); _l?.error?.(`[${"MODULE_ID"}] Mount failed`, err?.message); return false; }
};
export const unmount = () => {
  if (_abortController) { (_abortController as AbortController).abort(); _abortController = null; }

  stopPolling();
  const container = document.querySelector(`#${PANEL_ID}`) as HTMLElement | null;
  cleanup(container);
  _log('debug', 'Panel-12 unmounted');
  return true;
};

export const healthCheck = () => {
  const result: Record<string, unknown> = lifecycleHealthCheck();
  result.p22Compliant = true;
  result.isAuthenticated = _isAuthenticated();
  result.isDocumentVisible = _isDocumentVisible();
  return result;
};

export const info = () => {
  const result: Record<string, unknown> = lifecycleInfo();
  result.p22Compliant = true;
  result.isAuthenticated = _isAuthenticated();
  result.isDocumentVisible = _isDocumentVisible();
  return result;
};

export { getStatus, getVersion, PANEL_ID };

if (typeof window !== 'undefined') {
  if (!isStrict()) {
    (window as any).Panel12 = { mount, unmount, getStatus, getVersion, healthCheck, info, MODULE_ID, VERSION };
    window.__dev = window.__dev || {};
    window.__dev.panel12 = { mount, unmount, getStatus, getVersion, healthCheck, info };
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, property: '(window as any).Panel12' });
  }
}

export const destroy = () => unmount();
export default { mount, unmount, destroy, getStatus, getVersion, healthCheck, info, MODULE_ID, VERSION, injectPorts, getPorts };
