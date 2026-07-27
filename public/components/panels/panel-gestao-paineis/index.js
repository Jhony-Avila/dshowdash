import { PANEL_ID, MODULE_ID, VERSION, CSS_PREFIX } from "./core/constants.js";
import { CONFIG } from "./core/config.js";
import { store } from "./state/store.js";
import { parseFiltersFromURL, hasActiveFilters } from "./state/filters.js";
import { loadPanels, loadCategories } from "./handlers/data.js";
import { setupEventListeners, setupTagInput, cleanupEventListeners } from "./handlers/events.js";
import { renderGrid } from "./ui/grid/panel-grid.js";
import { renderFilterBar } from "./ui/filters/filter-bar.js";
import { renderDetailModal } from "./ui/modal/panel-detail-modal.js";
import { renderSkeleton } from "./render/skeleton.js";
import { renderEmptyState, renderErrorState } from "./render/empty-state.js";
import { loadCSS, healthCheck as buildHealthCheck, info as buildInfo } from "./init/lifecycle.js";
import { markMountStart, markMountEnd } from "./init/performance.js";
import { trackMount, trackUnmount } from "./telemetry/tracker.js";
let _container = null;
let _abortController = null;
let _unsubscribes = [];
let _refreshTimer = null;
let _isInitialized = false;
let _ports = {};
function _renderKPIs(state) {
  const total = state.pagination.total || state.panels.length;
  const active = state.panels.filter((p) => p.is_active).length;
  const inactive = state.panels.filter((p) => !p.is_active).length;
  const noScreenshot = state.panels.filter((p) => !p.thumbnail_url).length;
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
function _renderPanel(state) {
  const header = `
    <div class="${CSS_PREFIX}-header">
      <h2 class="${CSS_PREFIX}-header__title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        Gest\xE3o de Pain\xE9is
      </h2>
      <p class="${CSS_PREFIX}-header__subtitle">Gerencie e monitore todos os pain\xE9is do sistema</p>
    </div>`;
  let content;
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
function _onStateChange(state) {
  if (!_container) return;
  const kpiBar = _container.querySelector(`.${CSS_PREFIX}-kpi-bar`);
  if (kpiBar) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = _renderKPIs(state);
    const newKpi = tempDiv.firstElementChild;
    if (newKpi) kpiBar.replaceWith(newKpi);
  }
  const filterBar = _container.querySelector(`.${CSS_PREFIX}-filter-bar`);
  if (filterBar) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = renderFilterBar(state.filters, state.categories, state.pagination.total || state.panels.length);
    const newFilter = tempDiv.firstElementChild;
    if (newFilter) filterBar.replaceWith(newFilter);
  }
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
  _renderModalIfNeeded(state);
}
function _renderModalIfNeeded(state) {
  if (!_container) return;
  const existingOverlay = _container.querySelector(`.${CSS_PREFIX}-modal-overlay`);
  if (state.modalOpen && state.selectedPanel) {
    const isPending = state.pendingScreenshots.has(state.selectedPanel.panel_id);
    const modalHtml = renderDetailModal(state.selectedPanel, state.categories, isPending);
    if (existingOverlay) {
      existingOverlay.outerHTML = modalHtml;
    } else {
      _container.insertAdjacentHTML("beforeend", modalHtml);
    }
    if (_abortController) {
      setupTagInput(_container, _abortController.signal);
    }
    const historyEl = _container.querySelector(`.${CSS_PREFIX}-screenshot-history[data-action="load-screenshot-history"]`);
    if (historyEl && historyEl.getAttribute("data-loaded") !== "true") {
      historyEl.click();
    }
  } else if (existingOverlay) {
    existingOverlay.remove();
  }
}
const PanelGestaoPaineis = /* @__PURE__ */ (() => {
  async function mount2(targetContainer, ports) {
    if (_isInitialized && _container) {
      console.warn(`[${MODULE_ID}] Already mounted`);
      return;
    }
    markMountStart();
    _ports = ports || {};
    _container = targetContainer;
    _abortController = new AbortController();
    _isInitialized = true;
    loadCSS();
    const urlFilters = parseFiltersFromURL();
    if (Object.keys(urlFilters).length > 0) {
      store.setFilters(urlFilters);
    }
    store.setLoading(true);
    _container.innerHTML = _renderPanel(store.getState());
    setupEventListeners(_container, _abortController);
    const unsub = store.subscribe(_onStateChange);
    _unsubscribes.push(unsub);
    const signal = _abortController.signal;
    await Promise.all([
      loadPanels(signal),
      loadCategories(signal)
    ]);
    _refreshTimer = setInterval(() => {
      loadPanels(_abortController?.signal);
    }, CONFIG.refreshInterval);
    trackMount();
    markMountEnd();
  }
  function unmount2() {
    if (!_isInitialized) return;
    if (_refreshTimer) {
      clearInterval(_refreshTimer);
      _refreshTimer = null;
    }
    if (_abortController) {
      _abortController.abort();
      _abortController = null;
    }
    _unsubscribes.forEach((fn) => fn());
    _unsubscribes = [];
    cleanupEventListeners();
    if (_container) {
      _container.innerHTML = "";
      _container = null;
    }
    store.reset();
    _isInitialized = false;
    _ports = {};
    trackUnmount();
  }
  async function refresh2() {
    if (!_isInitialized) return;
    const signal = _abortController?.signal;
    await Promise.all([
      loadPanels(signal),
      loadCategories(signal)
    ]);
  }
  function getStatus2() {
    const state = store.getState();
    return {
      mounted: _isInitialized,
      state: state.loading ? "LOADING" : state.error ? "ERROR" : "READY",
      lastUpdate: (/* @__PURE__ */ new Date()).toISOString(),
      error: state.error,
      panelCount: state.panels.length
    };
  }
  return {
    mount: mount2,
    unmount: unmount2,
    refresh: refresh2,
    getStatus: getStatus2,
    healthCheck: buildHealthCheck,
    info: buildInfo,
    destroy: unmount2,
    VERSION,
    MODULE_ID
  };
})();
const { mount, unmount, refresh, getStatus, healthCheck, info, destroy } = PanelGestaoPaineis;
var panel_gestao_paineis_default = PanelGestaoPaineis;
export {
  MODULE_ID,
  PanelGestaoPaineis,
  VERSION,
  panel_gestao_paineis_default as default,
  destroy,
  getStatus,
  healthCheck,
  info,
  mount,
  refresh,
  unmount
};
