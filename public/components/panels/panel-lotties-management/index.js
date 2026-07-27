import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
import { state } from "./state/store.js";
import { ui } from "./ui/renderer.js";
import { setupEventHandlers } from "./ui/events.js";
import { tracker } from "./telemetry/tracker.js";
import { MODULE_ID as CONST_MODULE_ID, PANEL_ID, PANEL_NAME, AVAILABLE_LOTTIES, ASSIGNABLE_COMPONENTS, metrics, loadCSS, isAuthenticated, checkPanelAccess, buildHealthCheck, buildInfo } from "./core/lifecycle.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = CONST_MODULE_ID;
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const _isDocumentVisible = () => typeof document !== "undefined" && !document.hidden;
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const id = PANEL_ID;
const capabilities = { type: "panel", reorderable: true, critical: false };
const PanelLottiesManagement = (() => {
  "use strict";
  let isInitialized = false;
  let container = null;
  let unsubscribeState = null;
  const render = () => {
    if (!container) return;
    ui.render(container, state.getState());
  };
  const subscribeToState = () => {
    unsubscribeState = state.subscribe(() => {
      render();
    });
  };
  const mount2 = (element) => {
    _initPorts();
    tracker.trackInit("start");
    if (!isAuthenticated()) {
      element.innerHTML = '<div class="panel-error" style="padding:2rem;text-align:center;color:#F59E0B;">Fa\xE7a login para acessar este painel</div>';
      return Promise.resolve(false);
    }
    if (!checkPanelAccess()) {
      element.innerHTML = '<div class="panel-error" style="padding:2rem;text-align:center;color:#EF4444;">Sem permiss\xE3o para acessar este painel</div>';
      return Promise.resolve(false);
    }
    if (isInitialized) unmount2();
    container = element;
    container.setAttribute("data-panel", PANEL_ID);
    loadCSS();
    ui.renderSkeleton(container);
    const _lotties = AVAILABLE_LOTTIES;
    const lottiesArr = Object.keys(AVAILABLE_LOTTIES).map((key) => ({ id: key, ..._lotties[key] }));
    state.setLotties(lottiesArr);
    const componentsArr = ASSIGNABLE_COMPONENTS.map((comp) => ({ ...comp }));
    state.setComponents(componentsArr);
    try {
      const saved = localStorage.getItem("lotties-assignments");
      if (saved) state.setAssignments(JSON.parse(saved));
    } catch (e) {
    }
    subscribeToState();
    setupEventHandlers(container, render);
    render();
    state.subscribe((s) => {
      try {
        localStorage.setItem("lotties-assignments", JSON.stringify(s.assignments));
      } catch (e) {
      }
    });
    isInitialized = true;
    metrics.mountCount++;
    metrics.lastActivity = Date.now();
    tracker.trackMount();
    const eventBus = _getPort("eventBus");
    eventBus?.emit?.(PANEL_EVENTS.READY, { panelId: PANEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID });
    tracker.trackInit("complete");
    return Promise.resolve(true);
  };
  const unmount2 = () => {
    cleanupEvents();
    if (unsubscribeState) {
      unsubscribeState();
      unsubscribeState = null;
    }
    if (container) {
      container.innerHTML = "";
      container = null;
    }
    state.reset();
    isInitialized = false;
    metrics.unmountCount++;
    tracker.trackUnmount();
  };
  const healthCheck2 = () => buildHealthCheck(isInitialized, container);
  const info2 = () => buildInfo(isInitialized, container, state, healthCheck2());
  const getStatus2 = () => ({
    version: VERSION,
    moduleId: MODULE_ID,
    panelId: PANEL_ID,
    panelName: PANEL_NAME,
    initialized: isInitialized,
    authenticated: isAuthenticated(),
    hasPermission: checkPanelAccess(),
    portsInitialized: Ports.isInitialized(),
    metrics: { ...metrics }
  });
  const getVersion2 = () => VERSION;
  return {
    mount: mount2,
    unmount: unmount2,
    healthCheck: healthCheck2,
    info: info2,
    getStatus: getStatus2,
    getVersion: getVersion2,
    isInitialized: () => isInitialized,
    getPanelId: () => PANEL_ID,
    getPanelName: () => PANEL_NAME
  };
})();
if (typeof window !== "undefined" && !isStrict()) {
  window.PanelLottiesManagement = PanelLottiesManagement;
}
const { mount, unmount, healthCheck: _rawHealthCheck, info, getStatus, getVersion } = PanelLottiesManagement;
const healthCheck = () => {
  const hc = _rawHealthCheck();
  hc.isDocumentVisible = _isDocumentVisible();
  return hc;
};
const destroy = () => unmount();
var panel_lotties_management_default = PanelLottiesManagement;
export {
  MODULE_ID,
  VERSION,
  capabilities,
  panel_lotties_management_default as default,
  destroy,
  getPorts,
  getStatus,
  getVersion,
  healthCheck,
  id,
  info,
  injectPorts,
  mount,
  unmount
};
