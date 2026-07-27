import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.main.domain.main-engine.navigation";
const VERSION = "3.0.0-P1-HEX";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const NAVIGATION_SYNC_EVENT = "main.navigation.sync";
const _state = { initialized: false, currentPanel: null, previousPanel: null, currentRoute: null, isNavigating: false, mounted: false };
const _metrics = { navigations: 0, mounts: 0, errors: 0, syncsEmitted: 0 };
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {}));
}
function _track(eventName, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function _setTimeout(fn, ms) {
  const timerPort = _getPort("timer");
  if (timerPort && timerPort.setTimeout) return timerPort.setTimeout(fn, ms);
  return setTimeout(fn, ms);
}
function _emitNavigationSync(panelId, route, previousPanel) {
  _metrics.syncsEmitted++;
  _emit(NAVIGATION_SYNC_EVENT, {
    panelId,
    route: route || _state.currentRoute || `#/${panelId}`,
    previousPanel: previousPanel || _state.previousPanel,
    timestamp: Date.now()
  });
  _track("main:navigation:sync", { panelId, route });
}
function navigateToPanel(panelId, options) {
  if (_state.isNavigating) return Promise.resolve({ ok: false, reason: "Navigation in progress" });
  _state.isNavigating = true;
  _metrics.navigations++;
  _state.previousPanel = _state.currentPanel;
  _state.currentPanel = panelId;
  _state.currentRoute = options && options.route || `#/${panelId}`;
  _emit(MAIN_EVENTS.NAVIGATION_START, { from: _state.previousPanel, to: panelId });
  _track("main:navigation", { from: _state.previousPanel, to: panelId });
  return new Promise((resolve) => {
    _setTimeout(() => {
      _state.isNavigating = false;
      _emit(MAIN_EVENTS.NAVIGATION_COMPLETE, { panelId });
      _emitNavigationSync(panelId, _state.currentRoute, _state.previousPanel);
      resolve({ ok: true, panelId });
    }, 0);
  });
}
function getCurrentPanel() {
  return _state.currentPanel;
}
function getPreviousPanel() {
  return _state.previousPanel;
}
function getCurrentRoute() {
  return _state.currentRoute;
}
function isNavigating() {
  return _state.isNavigating;
}
function goBack() {
  if (_state.previousPanel) return navigateToPanel(_state.previousPanel);
  return Promise.resolve({ ok: false, reason: "No previous panel" });
}
function performMount(engine) {
  if (_state.mounted) return Promise.resolve({ ok: true, alreadyMounted: true });
  _metrics.mounts++;
  _state.mounted = true;
  _emit(MAIN_EVENTS.MOUNTED, { engine: !!engine });
  _track("main:mounted", {});
  return Promise.resolve({ ok: true, mounted: true });
}
async function performNavigate(engine, panelId, options) {
  options = options || {};
  _metrics.navigations++;
  const route = options.route || `#/${panelId}`;
  const previousPanel = _state.currentPanel;
  const nc = engine._navigationController;
  if (engine && nc && nc.navigate) {
    try {
      const result = await nc.navigate(panelId, options);
      _state.currentPanel = panelId;
      _state.currentRoute = route;
      _state.previousPanel = previousPanel;
      _emitNavigationSync(panelId, route, previousPanel);
      return result;
    } catch (error) {
      _metrics.errors++;
      return navigateToPanel(panelId, options);
    }
  }
  return navigateToPanel(panelId, options);
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    score: 100,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      initialized: { ok: _state.initialized, severity: "info" },
      mounted: { ok: _state.mounted, severity: "info" },
      notNavigating: { ok: !_state.isNavigating, severity: "info" },
      portsInitialized: { ok: Ports.isInitialized(), severity: "info" }
    },
    metrics: _metrics,
    p1HexCompliant: true
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _state.initialized,
    mounted: _state.mounted,
    currentPanel: _state.currentPanel,
    currentRoute: _state.currentRoute,
    previousPanel: _state.previousPanel,
    isNavigating: _state.isNavigating,
    metrics: _metrics,
    portsInitialized: Ports.isInitialized(),
    p1HexCompliant: true,
    navigationSyncEvent: NAVIGATION_SYNC_EVENT
  };
}
var navigation_default = { MODULE_ID, VERSION, NAVIGATION_SYNC_EVENT, init, performMount, performNavigate, navigateToPanel, getCurrentPanel, getPreviousPanel, getCurrentRoute, isNavigating, goBack, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  NAVIGATION_SYNC_EVENT,
  VERSION,
  navigation_default as default,
  getCurrentPanel,
  getCurrentRoute,
  getPorts,
  getPreviousPanel,
  goBack,
  healthCheck,
  info,
  init,
  injectPorts,
  isNavigating,
  navigateToPanel,
  performMount,
  performNavigate
};
