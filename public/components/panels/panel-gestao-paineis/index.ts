/* ═══════════════════════════════════════════════════════════════
 * DEPENDENCY CONTRACT — panel-gestao-paineis/index.ts
 * @version 1.0.0
 *
 * IMPORTS (INTERNAL):
 *   ./core/constants.js           → { PANEL_ID, MODULE_ID, VERSION, CSS_PREFIX }
 *   ./core/config.js              → { CONFIG }
 *   ./state/store.js              → { store }
 *   ./state/filters.js            → { parseFiltersFromURL, syncFiltersToURL, hasActiveFilters }
 *   ./services/api-client.js      → (consumed via handlers)
 *   ./handlers/data.js            → { loadPanels, loadCategories, applyFilter }
 *   ./handlers/events.js          → { setupEventListeners, setupTagInput, cleanupEventListeners }
 *   ./handlers/screenshot.js      → (consumed via events)
 *   ./ui/grid/panel-grid.js       → { renderGrid }
 *   ./ui/filters/filter-bar.js    → { renderFilterBar }
 *   ./ui/modal/panel-detail-modal.js → { renderDetailModal }
 *   ./render/skeleton.js          → { renderSkeleton }
 *   ./render/empty-state.js       → { renderEmptyState, renderErrorState }
 *   ./init/lifecycle.js           → { loadCSS, healthCheck, info }
 *   ./init/performance.js         → { markMountStart, markMountEnd }
 *   ./telemetry/tracker.js        → { trackMount, trackUnmount }
 *
 * EXPORTS (PUBLIC API):
 *   VERSION, MODULE_ID
 *   PanelGestaoPaineis (IIFE singleton: mount, unmount, refresh, getStatus, healthCheck, info, destroy)
 *   default: PanelGestaoPaineis
 * ═══════════════════════════════════════════════════════════════ */
'use strict';

import { PANEL_ID, MODULE_ID, VERSION, CSS_PREFIX } from './core/constants.js';
import { CONFIG } from './core/config.js';
import { store } from './state/store.js';
import { parseFiltersFromURL, syncFiltersToURL, hasActiveFilters } from './state/filters.js';
import { loadPanels, loadCategories } from './handlers/data.js';
import { setupEventListeners, setupTagInput, cleanupEventListeners } from './handlers/events.js';
import { renderGrid } from './ui/grid/panel-grid.js';
import { renderFilterBar } from './ui/filters/filter-bar.js';
import { renderDetailModal } from './ui/modal/panel-detail-modal.js';
import { renderSkeleton } from './render/skeleton.js';
import { renderEmptyState, renderErrorState } from './render/empty-state.js';
import { loadCSS, healthCheck as buildHealthCheck, info as buildInfo } from './init/lifecycle.js';
import { markMountStart, markMountEnd } from './init/performance.js';
import { trackMount, trackUnmount } from './telemetry/tracker.js';

import type { PanelPorts, PanelStatus, PanelGestaoState } from './core/types.js';

declare const window: Window & Record<string, any>;

// ─── State ───
let _container: HTMLElement | null = null;
let _abortController: AbortController | null = null;
let _unsubscribes: Array<() => void> = [];
let _refreshTimer: ReturnType<typeof setInterval> | null = null;
let _isInitialized = false;
let _ports: PanelPorts = {};

// ─── KPI Rendering ───
function _renderKPIs(state: PanelGestaoState): string {
  const total = state.pagination.total || state.panels.length;
  const active = state.panels.filter(p => p.is_active).length;
  const inactive = state.panels.filter(p => !p.is_active).length;
  const noScreenshot = state.panels.filter(p => !p.thumbnail_url).length;

  return `
    <div class="${CSS_PREFIX}-kpi-bar">
      <div class="${CSS_PREFIX}-kpi">
        <span class="${CSS_PREFIX}-kpi__value">${total}</span>
        <span class="${CSS_PREFIX}-kpi__label">Total</span>
      </div>
      <div class="${CSS_PREFIX}-kpi ${CSS_PREFIX}-kpi--active">
        <span class="${CSS_PREFIX}-kpi__value">${active}</span>
        <span class="${CSS_PREFIX}-kpi__label">Ativos</span>
      </div>
      <div class="${CSS_PREFIX}-kpi ${CSS_PREFIX}-kpi--inactive">
        <span class="${CSS_PREFIX}-kpi__value">${inactive}</span>
        <span class="${CSS_PREFIX}-kpi__label">Inativos</span>
      </div>
      <div class="${CSS_PREFIX}-kpi ${CSS_PREFIX}-kpi--no-screenshot">
        <span class="${CSS_PREFIX}-kpi__value">${noScreenshot}</span>
        <span class="${CSS_PREFIX}-kpi__label">Sem Screenshot</span>
      </div>
    </div>`;
}

// ─── Full Render ───
function _renderPanel(state: PanelGestaoState): string {
  const header = `
    <div class="${CSS_PREFIX}-header">
      <h2 class="${CSS_PREFIX}-header__title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        Gestão de Painéis
      </h2>
      <p class="${CSS_PREFIX}-header__subtitle">Gerencie e monitore todos os painéis do sistema</p>
    </div>`;

  let content: string;
  if (state.loading && state.panels.length === 0) {
    content = renderSkeleton(8);
  } else if (state.error && state.panels.length === 0) {
    content = renderErrorState(state.error);
  } else if (state.panels.length === 0) {
    content = renderEmptyState(hasActiveFilters(state.filters));
  } else {
    content = renderGrid(state.panels, state.pendingScreenshots);
  }

  return `
    <div class="${CSS_PREFIX}-container" data-panel="${PANEL_ID}">
      ${header}
      ${_renderKPIs(state)}
      ${renderFilterBar(state.filters, state.categories, state.pagination.total || state.panels.length)}
      <div class="${CSS_PREFIX}-content" data-region="content">
        ${content}
      </div>
    </div>`;
}

// ─── Re-render on state change ───
function _onStateChange(state: PanelGestaoState): void {
  if (!_container) return;

  // Update KPIs
  const kpiBar = _container.querySelector(`.${CSS_PREFIX}-kpi-bar`);
  if (kpiBar) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = _renderKPIs(state);
    const newKpi = tempDiv.firstElementChild;
    if (newKpi) kpiBar.replaceWith(newKpi);
  }

  // Update filter bar
  const filterBar = _container.querySelector(`.${CSS_PREFIX}-filter-bar`);
  if (filterBar) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderFilterBar(state.filters, state.categories, state.pagination.total || state.panels.length);
    const newFilter = tempDiv.firstElementChild;
    if (newFilter) filterBar.replaceWith(newFilter);
  }

  // Update content area
  const contentRegion = _container.querySelector('[data-region="content"]');
  if (contentRegion) {
    if (state.loading && state.panels.length === 0) {
      contentRegion.innerHTML = renderSkeleton(8);
    } else if (state.error && state.panels.length === 0) {
      contentRegion.innerHTML = renderErrorState(state.error);
    } else if (state.panels.length === 0) {
      contentRegion.innerHTML = renderEmptyState(hasActiveFilters(state.filters));
    } else {
      contentRegion.innerHTML = renderGrid(state.panels, state.pendingScreenshots);
    }
  }

  // Modal
  _renderModalIfNeeded(state);
}

function _renderModalIfNeeded(state: PanelGestaoState): void {
  if (!_container) return;
  const existingOverlay = _container.querySelector(`.${CSS_PREFIX}-modal-overlay`);

  if (state.modalOpen && state.selectedPanel) {
    const isPending = state.pendingScreenshots.has(state.selectedPanel.panel_id);
    const modalHtml = renderDetailModal(state.selectedPanel, state.categories, isPending);
    if (existingOverlay) {
      existingOverlay.outerHTML = modalHtml;
    } else {
      _container.insertAdjacentHTML('beforeend', modalHtml);
    }
    // Setup tag input listener
    if (_abortController) {
      setupTagInput(_container, _abortController.signal);
    }
    // Auto-trigger screenshot history loading
    const historyEl = _container.querySelector<HTMLElement>(`.${CSS_PREFIX}-screenshot-history[data-action="load-screenshot-history"]`);
    if (historyEl && historyEl.getAttribute('data-loaded') !== 'true') {
      historyEl.click();
    }
  } else if (existingOverlay) {
    existingOverlay.remove();
  }
}

// ─── Public API ───
const PanelGestaoPaineis = (() => {
  async function mount(targetContainer: HTMLElement, ports?: PanelPorts): Promise<void> {
    if (_isInitialized && _container) {
      console.warn(`[${MODULE_ID}] Already mounted`);
      return;
    }

    markMountStart();
    _ports = ports || {};
    _container = targetContainer;
    _abortController = new AbortController();
    _isInitialized = true;

    // Load CSS
    loadCSS();

    // Parse initial filters from URL
    const urlFilters = parseFiltersFromURL();
    if (Object.keys(urlFilters).length > 0) {
      store.setFilters(urlFilters);
    }

    // Initial render with skeleton
    store.setLoading(true);
    _container.innerHTML = _renderPanel(store.getState());

    // Setup event delegation
    setupEventListeners(_container, _abortController);

    // Subscribe to store changes
    const unsub = store.subscribe(_onStateChange);
    _unsubscribes.push(unsub);

    // Load data
    const signal = _abortController.signal;
    await Promise.all([
      loadPanels(signal),
      loadCategories(signal),
    ]);

    // Start auto-refresh
    _refreshTimer = setInterval(() => {
      loadPanels(_abortController?.signal);
    }, CONFIG.refreshInterval);

    trackMount();
    markMountEnd();
  }

  function unmount(): void {
    if (!_isInitialized) return;

    // Stop refresh
    if (_refreshTimer) {
      clearInterval(_refreshTimer);
      _refreshTimer = null;
    }

    // Abort pending requests
    if (_abortController) {
      _abortController.abort();
      _abortController = null;
    }

    // Unsubscribe store listeners
    _unsubscribes.forEach(fn => fn());
    _unsubscribes = [];

    // Cleanup events
    cleanupEventListeners();

    // Clear DOM
    if (_container) {
      _container.innerHTML = '';
      _container = null;
    }

    // Reset store
    store.reset();
    _isInitialized = false;
    _ports = {};

    trackUnmount();
  }

  async function refresh(): Promise<void> {
    if (!_isInitialized) return;
    const signal = _abortController?.signal;
    await Promise.all([
      loadPanels(signal),
      loadCategories(signal),
    ]);
  }

  function getStatus(): PanelStatus {
    const state = store.getState();
    return {
      mounted: _isInitialized,
      state: state.loading ? 'LOADING' : state.error ? 'ERROR' : 'READY',
      lastUpdate: new Date().toISOString(),
      error: state.error,
      panelCount: state.panels.length,
    };
  }

  return {
    mount,
    unmount,
    refresh,
    getStatus,
    healthCheck: buildHealthCheck,
    info: buildInfo,
    destroy: unmount,
    VERSION,
    MODULE_ID,
  };
})();

const { mount, unmount, refresh, getStatus, healthCheck, info, destroy } = PanelGestaoPaineis;
export { VERSION, MODULE_ID, PanelGestaoPaineis, mount, unmount, refresh, getStatus, healthCheck, info, destroy };
export default PanelGestaoPaineis;
