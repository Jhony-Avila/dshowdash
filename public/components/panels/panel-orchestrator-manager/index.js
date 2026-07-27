import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { state } from "./state/store.js";
import { tracker } from "./telemetry/tracker.js";
import { ui } from "./ui/renderer.js";
import { api } from "./api/adapter.js";
import * as crud from "./handlers/crud.js";
import * as uiActions from "./handlers/ui-actions.js";
import { MODULE_ID, PANEL_ID, PANEL_NAME, metrics, loadCSS, ensureAuth, checkPanelAccess } from "./core/lifecycle.js";
import { handleAction } from "./action-handlers.js";
import { handleFormSubmit } from "./form-handlers.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const getVersion = () => VERSION;
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const _isDocumentVisible = () => typeof document !== "undefined" && !document.hidden;
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const PanelOrchestratorManager = (() => {
  "use strict";
  let isInitialized = false;
  let container = null;
  let abortController = null;
  let unsubscribeState = null;
  let timelinePanelInstance = null;
  let metricsDashboardInstance = null;
  const callbacks = {
    showToast: (msg, type) => uiActions.showToast(container, msg, type),
    showLoading: (show) => uiActions.showLoading(container, show),
    closeAllModals: () => uiActions.closeAllModals(container),
    loadData: () => _loadData(),
    loadStats: () => _loadStats(),
    loadAudit: () => _loadAudit()
  };
  const init2 = () => {
    if (isInitialized) return Promise.resolve({ success: true, alreadyInitialized: true });
    tracker.trackInit();
    loadCSS();
    state.init();
    _initPorts();
    isInitialized = true;
    tracker.trackInitComplete();
    return Promise.resolve({ success: true });
  };
  const mount2 = (targetContainer) => {
    if (!targetContainer) return Promise.resolve({ success: false, error: "Container is required" });
    if (!ensureAuth("mount")) return Promise.resolve({ success: false, error: "Authentication required" });
    if (!checkPanelAccess()) {
      tracker.trackAccessDenied("mount");
      return Promise.resolve({ success: false, error: "Access denied - Super Admin required" });
    }
    container = targetContainer;
    abortController = new AbortController();
    return init2().then(() => _loadStats()).then(() => {
      _render();
      _setupEventListeners();
      _subscribeToState();
      metrics.mountCount++;
      metrics.lastActivity = Date.now();
      tracker.trackMounted();
      return _loadData();
    }).then(() => ({ success: true }));
  };
  const unmount2 = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    if (unsubscribeState) {
      unsubscribeState();
      unsubscribeState = null;
    }
    if (timelinePanelInstance?.unmount) {
      timelinePanelInstance.unmount();
      timelinePanelInstance = null;
    }
    if (metricsDashboardInstance?.unmount) {
      metricsDashboardInstance.unmount();
      metricsDashboardInstance = null;
    }
    if (container) {
      container.innerHTML = "";
      container = null;
    }
    crud.clearEditingItem();
    crud.clearPendingDelete();
    metrics.unmountCount++;
    tracker.trackUnmounted();
    return { success: true };
  };
  const _render = () => {
    if (!container) return;
    const currentState = state.getState();
    container.innerHTML = ui.renderMain(currentState);
    if (currentState.selectedTab === "timeline") _mountTimelinePanel();
    else if (currentState.selectedTab === "metrics") _mountMetricsDashboard();
  };
  const _mountTimelinePanel = () => {
    const mountPoint = container?.querySelector("[data-timeline-mount]");
    if (!mountPoint) return;
    import("/core/ui-orchestrator/components/timeline-panel.js").then((module) => {
      const TimelinePanel = module.default;
      timelinePanelInstance = TimelinePanel;
      TimelinePanel.mount(mountPoint, { eventTimeline: _getPort("eventTimeline") });
    }).catch((error) => {
      mountPoint.innerHTML = `<div class="pom-error">\u274C ${error.message}</div>`;
    });
  };
  const _mountMetricsDashboard = () => {
    const mountPoint = container?.querySelector("[data-metrics-mount]");
    if (!mountPoint) return;
    import("/core/ui-orchestrator/components/metrics-dashboard.js").then((module) => {
      const MetricsDashboard = module.default;
      metricsDashboardInstance = MetricsDashboard;
      MetricsDashboard.mount(mountPoint, { autoRefresh: true, refreshInterval: 5e3 });
    }).catch((error) => {
      mountPoint.innerHTML = `<div class="pom-error">\u274C ${error.message}</div>`;
    });
  };
  const _subscribeToState = () => {
    unsubscribeState = state.subscribe((newState) => {
      if (!container) return;
      const content = container.querySelector(".pom-content");
      if (content) {
        const isFullHeight = newState.selectedTab === "timeline" || newState.selectedTab === "metrics";
        if (newState.selectedTab !== "timeline" && timelinePanelInstance?.unmount) {
          timelinePanelInstance.unmount();
          timelinePanelInstance = null;
        }
        if (newState.selectedTab !== "metrics" && metricsDashboardInstance?.unmount) {
          metricsDashboardInstance.unmount();
          metricsDashboardInstance = null;
        }
        if (isFullHeight) content.classList.add("pom-content--fullheight");
        else content.classList.remove("pom-content--fullheight");
        if (newState.selectedTab === "timeline") {
          content.innerHTML = ui.renderTimeline(newState);
          _mountTimelinePanel();
        } else if (newState.selectedTab === "metrics") {
          content.innerHTML = ui.renderMetrics(newState);
          _mountMetricsDashboard();
        } else {
          content.innerHTML = newState.isLoading ? ui.renderLoading() : ui.renderTabContent(newState);
        }
      }
      const statsBar = container.querySelector("[data-stats-bar]");
      if (statsBar && newState["stats"]) statsBar.innerHTML = ui.renderStatsBar(newState["stats"]);
      const toolbar = container.querySelector(".pom-toolbar");
      if (toolbar) {
        const hide = newState["selectedTab"] === "timeline" || newState["selectedTab"] === "metrics" || newState["selectedTab"] === "audit";
        toolbar.style.display = hide ? "none" : "";
      }
    });
  };
  const _loadStats = () => api.getStats().then((stats) => {
    state.setState({ stats });
  }).catch((error) => {
    const logger = _getPort("logger");
    logger?.warn?.("[POM] Failed to load stats:", error?.message || "unknown");
  });
  const _loadData = () => {
    const currentTab = state.getState().selectedTab;
    if (currentTab === "timeline" || currentTab === "metrics") return Promise.resolve();
    let promise;
    switch (currentTab) {
      case "triggers":
        promise = crud.loadTriggers(state.getState().filterComponent);
        break;
      case "rules":
        promise = crud.loadRules();
        break;
      case "flags":
        promise = crud.loadFlags();
        break;
      case "audit":
        promise = _loadAudit();
        break;
      default:
        promise = Promise.resolve();
    }
    return promise.catch((error) => {
      callbacks.showToast(error.message, "error");
    });
  };
  const _loadAudit = () => {
    state.setLoading(true);
    return api.getAuditLog(50).then((audit) => {
      state.setState({ audit, isLoading: false });
    }).catch((error) => {
      state.setError(error.message);
    });
  };
  const _setupEventListeners = () => {
    if (!container) return;
    const signal = abortController?.signal;
    container.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;
      const tab = target.closest("[data-tab]");
      if (tab) {
        const tabId = tab.dataset.tab || "";
        state.setTab(tabId);
        tracker.trackTabChange(tabId);
        _render();
        _setupEventListeners();
        _loadData();
        return;
      }
      const action = target.closest("[data-action]");
      if (action) handleAction(action.dataset.action || "", action.dataset, container, callbacks, { timeline: timelinePanelInstance, metrics: metricsDashboardInstance });
    }, { signal });
    const searchInput = container.querySelector('[data-action="search"]');
    if (searchInput) searchInput.addEventListener("input", (e) => {
      state.setSearch(e.target.value);
    }, { signal });
    const filterSelect = container.querySelector('[data-action="filter-component"]');
    if (filterSelect) filterSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      state.setFilter(val);
      crud.loadTriggers(val);
    }, { signal });
    container.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target.closest("[data-form]");
      if (form) handleFormSubmit(form, (data) => {
        const formType = form.dataset.form;
        if (formType === "trigger") crud.saveTrigger(data, callbacks);
        else if (formType === "rule") crud.saveRule(data, callbacks);
        else if (formType === "flag") crud.saveFlag(data, callbacks);
      });
    }, { signal });
    container.addEventListener("change", (e) => {
      const triggerSelect = e.target.closest('[data-simulator="trigger-select"]');
      if (triggerSelect?.value) {
        const intentInput = container.querySelector('[data-simulator="intent-input"]');
        const selectedOption = triggerSelect.selectedOptions[0];
        if (intentInput && selectedOption) intentInput.value = selectedOption.dataset.intent || "";
      }
    }, { signal });
  };
  const healthCheck2 = () => {
    const uiOrchestrator = _getPort("uiOrchestrator");
    const eventTimeline = _getPort("eventTimeline");
    const canvasEngine = _getPort("canvasEngine");
    const checks = { initialized: isInitialized, mounted: !!container, hasState: !!state.getState(), authOk: checkPanelAccess(), hasOrchestrator: !!uiOrchestrator, hasTimeline: !!eventTimeline, hasCanvas: !!canvasEngine, abortControllerActive: !!abortController && !abortController.signal.aborted };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed >= 6 ? "HEALTHY" : passed >= 4 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/7`, checks, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
  };
  const info2 = () => ({ version: VERSION, moduleId: MODULE_ID, panelId: PANEL_ID, panelName: PANEL_NAME, initialized: isInitialized, mounted: !!container, state: state.getState(), timelineMounted: !!timelinePanelInstance, metricsMounted: !!metricsDashboardInstance, metrics: { ...metrics }, portsInitialized: Ports.isInitialized() });
  return { init: init2, mount: mount2, unmount: unmount2, healthCheck: healthCheck2, info: info2, getVersion: () => VERSION, VERSION, MODULE_ID };
})();
const init = PanelOrchestratorManager.init;
const mount = PanelOrchestratorManager.mount;
const unmount = PanelOrchestratorManager.unmount;
const destroy = () => unmount();
const healthCheck = () => {
  const hc = PanelOrchestratorManager.healthCheck();
  hc.isDocumentVisible = _isDocumentVisible();
  return hc;
};
const info = PanelOrchestratorManager.info;
var panel_orchestrator_manager_default = PanelOrchestratorManager;
export {
  MODULE_ID,
  VERSION,
  panel_orchestrator_manager_default as default,
  destroy,
  getPorts,
  getVersion,
  healthCheck,
  info,
  init,
  injectPorts,
  mount,
  unmount
};
