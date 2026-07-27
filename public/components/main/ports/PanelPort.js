import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
const MODULE_ID = "components.main.ports.panel";
const VERSION = "2.4.0-P18EC";
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
const _state = { currentPanel: null, currentModule: null, loadedPanels: {}, loadedModules: {}, loading: false };
const _metrics = { loads: 0, loadSuccesses: 0, loadFailures: 0, unloads: 0, mounts: 0, errors: 0 };
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {}));
}
function _getPanelPath(panelId) {
  if (panelId.match(/^panel-\d+$/)) {
    return `/components/panels/${panelId}/index.js`;
  }
  if (panelId.startsWith("/") || panelId.includes(".js")) {
    return panelId;
  }
  return `/components/panels/${panelId}/index.js`;
}
async function loadPanel(panelId, options = {}) {
  _metrics.loads++;
  options = options || {};
  _state.loading = true;
  _emit(PANEL_EVENTS.LOAD_REQUEST, { panelId });
  try {
    if (_state.loadedModules[panelId]) {
      _state.currentPanel = panelId;
      _state.currentModule = _state.loadedModules[panelId];
      _state.loading = false;
      _emit(PANEL_EVENTS.LOADED, { panelId, cached: true });
      return _state.loadedModules[panelId];
    }
    const panelPath = _getPanelPath(panelId);
    const module = await import(panelPath);
    _state.loadedModules[panelId] = module;
    _state.loadedPanels[panelId] = { loadedAt: Date.now(), options, path: panelPath };
    _state.currentPanel = panelId;
    _state.currentModule = module;
    _state.loading = false;
    _metrics.loadSuccesses++;
    _emit(PANEL_EVENTS.LOADED, { panelId, path: panelPath });
    return module;
  } catch (error) {
    _metrics.loadFailures++;
    _metrics.errors++;
    _state.loading = false;
    _emit(PANEL_EVENTS.ERROR, { panelId, error: error.message });
    throw error;
  }
}
function unloadPanel(panelId) {
  _metrics.unloads++;
  panelId = panelId || _state.currentPanel;
  if (_state.loadedPanels[panelId]) {
    delete _state.loadedPanels[panelId];
    delete _state.loadedModules[panelId];
    _emit(PANEL_EVENTS.UNMOUNTED, { panelId });
  }
  if (_state.currentPanel === panelId) {
    _state.currentPanel = null;
    _state.currentModule = null;
  }
  return { ok: true };
}
function getCurrentPanel() {
  return _state.currentPanel;
}
function getCurrentModule() {
  return _state.currentModule;
}
function isLoading() {
  return _state.loading;
}
function isLoaded(panelId) {
  return !!_state.loadedModules[panelId];
}
function getLoadedPanels() {
  return Object.keys(_state.loadedPanels);
}
function getModule(panelId) {
  return _state.loadedModules[panelId] || null;
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { hasCurrentPanel: { ok: !!_state.currentPanel, severity: "info" }, notLoading: { ok: !_state.loading, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, currentPanel: _state.currentPanel, loadedPanelsCount: Object.keys(_state.loadedPanels).length, loadedPanels: Object.keys(_state.loadedPanels), isLoading: _state.loading, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function createPanelPort(options) {
  options = options || {};
  init(options);
  return { loadPanel, unloadPanel, getCurrentPanel, getCurrentModule, getModule, isLoading, isLoaded, getLoadedPanels, healthCheck, info, VERSION, MODULE_ID };
}
var PanelPort_default = { MODULE_ID, VERSION, createPanelPort, init, loadPanel, unloadPanel, getCurrentPanel, getCurrentModule, getModule, isLoading, isLoaded, getLoadedPanels, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  createPanelPort,
  PanelPort_default as default,
  getCurrentModule,
  getCurrentPanel,
  getLoadedPanels,
  getModule,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isLoaded,
  isLoading,
  loadPanel,
  unloadPanel
};
