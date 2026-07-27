// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Panel Orchestrator Manager - Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   state from ./state/store.js
//   tracker from ./telemetry/tracker.js
//   ui from ./ui/renderer.js
//   api from ./api/adapter.js
//   MODULE_ID, PANEL_ID, PANEL_NAME, metrics, loadCSS, ensureAuth, checkPanelAcce...
//   handleAction from ./action-handlers.js
//   handleFormSubmit from ./form-handlers.js
//
// PROVIDES:
//   VERSION — module constant
//   getVersion() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   mount() — exported function
//   unmount() — exported function
//   destroy() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
//   'input'
//   'submit'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { state } from './state/store.js';

// @ts-expect-error TS migration - TS2724
import { tracker } from './telemetry/tracker.js';
import { ui } from './ui/renderer.js';
import { api } from './api/adapter.js';
import * as crud from './handlers/crud.js';
import * as uiActions from './handlers/ui-actions.js';

// @ts-expect-error TS migration - TS2614
import { MODULE_ID, PANEL_ID, PANEL_NAME, metrics, loadCSS, ensureAuth, checkPanelAccess } from './core/lifecycle.js';
import { handleAction } from './action-handlers.js';
import { handleFormSubmit } from './form-handlers.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export { MODULE_ID };
export const getVersion = () => VERSION;

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const _isDocumentVisible = () => typeof document !== 'undefined' && !document.hidden;
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const PanelOrchestratorManager = (() => {
  'use strict';
  let isInitialized = false;
  let container: HTMLElement | null = null;
  let abortController: AbortController | null = null;
  let unsubscribeState: (() => void) | null = null;
  let timelinePanelInstance: { refresh?: () => void; unmount?: () => void } | null = null;
  let metricsDashboardInstance: { refresh?: () => void; unmount?: () => void } | null = null;

  const callbacks = {
    showToast: (msg: string, type: string) => (uiActions as any).showToast(container, msg, type),
    showLoading: (show: boolean) => (uiActions as any).showLoading(container, show),
    closeAllModals: () => uiActions.closeAllModals(container),
    loadData: () => _loadData(),
    loadStats: () => _loadStats(),
    loadAudit: () => _loadAudit()
  };

  const init = () => {
    if (isInitialized) return Promise.resolve({ success: true, alreadyInitialized: true });
    tracker.trackInit(); loadCSS(); state.init(); _initPorts(); isInitialized = true; tracker.trackInitComplete();
    return Promise.resolve({ success: true });
  };

  const mount = (targetContainer: HTMLElement) => {
    if (!targetContainer) return Promise.resolve({ success: false, error: 'Container is required' });
    if (!ensureAuth('mount')) return Promise.resolve({ success: false, error: 'Authentication required' });
    if (!checkPanelAccess()) { tracker.trackAccessDenied('mount'); return Promise.resolve({ success: false, error: 'Access denied - Super Admin required' }); }
    container = targetContainer;
    abortController = new AbortController();
    return init().then(() => _loadStats()).then(() => {
      _render(); _setupEventListeners(); _subscribeToState();
      metrics.mountCount++; metrics.lastActivity = Date.now(); tracker.trackMounted();
      return _loadData();
    }).then(() => ({ success: true }));
  };

  const unmount = () => {
    if (abortController) { abortController.abort(); abortController = null; }
    if (unsubscribeState) { unsubscribeState(); unsubscribeState = null; }
    if (timelinePanelInstance?.unmount) { timelinePanelInstance.unmount(); timelinePanelInstance = null; }
    if (metricsDashboardInstance?.unmount) { metricsDashboardInstance.unmount(); metricsDashboardInstance = null; }
    if (container) { container.innerHTML = ''; container = null; }
    crud.clearEditingItem(); crud.clearPendingDelete();
    metrics.unmountCount++; tracker.trackUnmounted();
    return { success: true };
  };

  const _render = () => {
    if (!container) return;
    const currentState = state.getState();
    container.innerHTML = ui.renderMain(currentState);
    if (currentState.selectedTab === 'timeline') _mountTimelinePanel();
    else if (currentState.selectedTab === 'metrics') _mountMetricsDashboard();
  };

  const _mountTimelinePanel = () => {
    const mountPoint = container?.querySelector('[data-timeline-mount]');
    if (!mountPoint) return;
    import('/core/ui-orchestrator/components/timeline-panel.js').then((module) => {
      const TimelinePanel = module.default;
      timelinePanelInstance = TimelinePanel;
      TimelinePanel.mount(mountPoint as HTMLElement, { eventTimeline: _getPort('eventTimeline') });
    }).catch((error) => { mountPoint.innerHTML = `<div class="pom-error">❌ ${error.message}</div>`; });
  };

  const _mountMetricsDashboard = () => {
    const mountPoint = container?.querySelector('[data-metrics-mount]');
    if (!mountPoint) return;
    import('/core/ui-orchestrator/components/metrics-dashboard.js').then((module) => {
      const MetricsDashboard = module.default;
      metricsDashboardInstance = MetricsDashboard;
      MetricsDashboard.mount(mountPoint as HTMLElement, { autoRefresh: true, refreshInterval: 5000 });
    }).catch((error) => { mountPoint.innerHTML = `<div class="pom-error">❌ ${error.message}</div>`; });
  };

  const _subscribeToState = () => {
    unsubscribeState = state.subscribe((newState: Record<string, unknown>) => {
      if (!container) return;
      const content = container.querySelector('.pom-content');
      if (content) {
        const isFullHeight = newState.selectedTab === 'timeline' || newState.selectedTab === 'metrics';
        if (newState.selectedTab !== 'timeline' && timelinePanelInstance?.unmount) { timelinePanelInstance.unmount(); timelinePanelInstance = null; }
        if (newState.selectedTab !== 'metrics' && metricsDashboardInstance?.unmount) { metricsDashboardInstance.unmount(); metricsDashboardInstance = null; }
        if (isFullHeight) content.classList.add('pom-content--fullheight'); else content.classList.remove('pom-content--fullheight');
        if (newState.selectedTab === 'timeline') { content.innerHTML = ui.renderTimeline(newState); _mountTimelinePanel(); }
        else if (newState.selectedTab === 'metrics') { content.innerHTML = ui.renderMetrics(newState); _mountMetricsDashboard(); }
        else { content.innerHTML = newState.isLoading ? ui.renderLoading() : ui.renderTabContent(newState); }
      }
      const statsBar = container.querySelector('[data-stats-bar]');
      if (statsBar && newState['stats']) (statsBar as HTMLElement).innerHTML = ui.renderStatsBar(newState['stats'] as Record<string, unknown>);
      const toolbar = container.querySelector('.pom-toolbar');
      if (toolbar) { const hide = newState['selectedTab'] === 'timeline' || newState['selectedTab'] === 'metrics' || newState['selectedTab'] === 'audit'; (toolbar as HTMLElement).style.display = hide ? 'none' : ''; }
    });
  };

  const _loadStats = () => api.getStats().then((stats) => { state.setState({ stats }); }).catch((error) => { const logger = _getPort('logger'); logger?.warn?.('[POM] Failed to load stats:', error?.message || 'unknown'); });

  const _loadData = () => {
    const currentTab = state.getState().selectedTab;
    if (currentTab === 'timeline' || currentTab === 'metrics') return Promise.resolve();
    let promise;
    switch (currentTab) {
      case 'triggers': promise = crud.loadTriggers(state.getState().filterComponent); break;
      case 'rules': promise = crud.loadRules(); break;
      case 'flags': promise = crud.loadFlags(); break;
      case 'audit': promise = _loadAudit(); break;
      default: promise = Promise.resolve();
    }
    return promise.catch((error) => { callbacks.showToast(error.message, 'error'); });
  };

  const _loadAudit = () => { state.setLoading(true); return api.getAuditLog(50).then((audit) => { state.setState({ audit, isLoading: false }); }).catch((error) => { state.setError(error.message); }); };

  const _setupEventListeners = () => {
    if (!container) return;
    const signal = abortController?.signal;
    container.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tab = target.closest('[data-tab]') as HTMLElement | null;
      if (tab) { const tabId = (tab as HTMLElement).dataset.tab || ''; state.setTab(tabId); tracker.trackTabChange(tabId); _render(); _setupEventListeners(); _loadData(); return; }
      const action = target.closest('[data-action]') as HTMLElement | null;
      // @ts-expect-error strict migration — TS2345
      if (action) handleAction((action as HTMLElement).dataset.action || '', (action as HTMLElement).dataset as unknown as Record<string, string>, container, callbacks, { timeline: timelinePanelInstance, metrics: metricsDashboardInstance });
    }, { signal });
    const searchInput = container.querySelector('[data-action="search"]');
    if (searchInput) searchInput.addEventListener('input', (e: Event) => { state.setSearch((e.target as HTMLInputElement).value); }, { signal });
    const filterSelect = container.querySelector('[data-action="filter-component"]');
    if (filterSelect) filterSelect.addEventListener('change', (e: Event) => { const val = (e.target as HTMLSelectElement).value; state.setFilter(val); crud.loadTriggers(val); }, { signal });
    container.addEventListener('submit', (e: Event) => { e.preventDefault(); const form = (e.target as HTMLElement).closest('[data-form]') as HTMLFormElement | null; if (form) handleFormSubmit(form, (data) => { const formType = form.dataset.form; if (formType === 'trigger') crud.saveTrigger(data as Record<string, unknown>, callbacks); else if (formType === 'rule') crud.saveRule(data as Record<string, unknown>, callbacks); else if (formType === 'flag') crud.saveFlag(data as Record<string, unknown>, callbacks); }); }, { signal });
    container.addEventListener('change', (e: Event) => { const triggerSelect = (e.target as HTMLElement).closest('[data-simulator="trigger-select"]') as HTMLSelectElement | null; if (triggerSelect?.value) { const intentInput = container!.querySelector('[data-simulator="intent-input"]') as HTMLInputElement | null; const selectedOption = triggerSelect.selectedOptions[0]; if (intentInput && selectedOption) intentInput.value = (selectedOption as HTMLOptionElement).dataset.intent || ''; } }, { signal });
  };

  const healthCheck = () => {
    const uiOrchestrator = _getPort('uiOrchestrator');
    const eventTimeline = _getPort('eventTimeline');
    const canvasEngine = _getPort('canvasEngine');
    const checks = { initialized: isInitialized, mounted: !!container, hasState: !!state.getState(), authOk: checkPanelAccess(), hasOrchestrator: !!uiOrchestrator, hasTimeline: !!eventTimeline, hasCanvas: !!canvasEngine, abortControllerActive: !!abortController && !abortController.signal.aborted };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed >= 6 ? 'HEALTHY' : passed >= 4 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/7`, checks, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
  };

  const info = () => ({ version: VERSION, moduleId: MODULE_ID, panelId: PANEL_ID, panelName: PANEL_NAME, initialized: isInitialized, mounted: !!container, state: state.getState(), timelineMounted: !!timelinePanelInstance, metricsMounted: !!metricsDashboardInstance, metrics: { ...metrics }, portsInitialized: Ports.isInitialized() });

  return { init, mount, unmount, healthCheck, info, getVersion: () => VERSION, VERSION, MODULE_ID };
})();

export const init = PanelOrchestratorManager.init;
export const mount = PanelOrchestratorManager.mount;
export const unmount = PanelOrchestratorManager.unmount;
export const destroy = () => unmount();
export const healthCheck = () => { const hc = PanelOrchestratorManager.healthCheck(); (hc as any).isDocumentVisible = _isDocumentVisible(); return hc; };
export const info = PanelOrchestratorManager.info;

export default PanelOrchestratorManager;
