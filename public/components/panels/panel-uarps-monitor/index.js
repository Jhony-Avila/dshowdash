import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { COMPONENT_EVENTS } from "/core/runtime/events/catalog/component.events.js";
import { state, resetState } from "./core/state.js";
import { fetchAPI } from "./api/client.js";
import { renderSkeleton, renderError, renderDashboard } from "./ui/renderer.js";
import { bindEvents } from "./ui/events.js";
const MODULE_ID = "panel-uarps-monitor";
const VERSION = "9.3.0-P2-ENTERPRISE";
const PANEL_ID = MODULE_ID;
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _isAuthenticated = () => {
  const auth = _getPort("auth");
  if (auth?.isAuthenticated?.()) return true;
  if (typeof window === "undefined") return false;
  const strictMode = isStrict();
  if (window.Core?.windowAdapter?.get) {
    const sm = window.Core.windowAdapter.get("SessionManager");
    if (sm?.isAuthenticated?.()) return true;
  }
  if (strictMode) return false;
  if (window.SessionManager?.isAuthenticated?.()) {
    recordViolation("WINDOW_SESSIONMANAGER_FALLBACK", { module: MODULE_ID, method: "_isAuthenticated" });
    return true;
  }
  return false;
};
const _isDocumentVisible = () => typeof document !== "undefined" && !document.hidden;
const _canRefresh = () => state.mounted && _isDocumentVisible() && _isAuthenticated();
let _container = null;
let _mounted = false;
async function loadData() {
  if (!_canRefresh()) return false;
  state.loading = true;
  state.error = null;
  render();
  try {
    const [status, inventory, divergences] = await Promise.all([
      fetchAPI("status"),
      fetchAPI("inventory"),
      fetchAPI("divergences")
    ]);
    state.status = status;
    state.inventory = inventory;
    state.divergences = divergences.divergences || [];
    state.stats = divergences.stats || {};
    state.lastRefresh = /* @__PURE__ */ new Date();
    state.loading = false;
    state.error = null;
    render();
    return true;
  } catch (error) {
    state.loading = false;
    state.error = error.message;
    render();
    return false;
  }
}
function render() {
  if (!_container) return;
  if (!_isAuthenticated()) {
    _container.innerHTML = '<div style="padding:2rem;text-align:center;color:#F59E0B;">Fa\xE7a login para acessar</div>';
    return;
  }
  if (state.loading && !state.status) {
    _container.innerHTML = renderSkeleton();
    return;
  }
  if (state.error && !state.status) {
    _container.innerHTML = renderError(state.error);
    bindEvents(_container, { canRefresh: _isAuthenticated, refresh: loadData });
    return;
  }
  _container.innerHTML = renderDashboard(state);
  bindEvents(_container, { canRefresh: _isAuthenticated, refresh: loadData });
}
function mount(container, config = {}) {
  _initPorts();
  if (_mounted || state.mounted) {
    const logger = _getPort("logger");
    logger?.warn?.(`[${MODULE_ID}] Already mounted \u2014 skipping duplicate mount`);
    return Promise.resolve({ ok: true });
  }
  _container = typeof container === "string" ? document.querySelector(container) : container;
  if (!_container) {
    const logger = _getPort("logger");
    logger?.error?.(`[${MODULE_ID}] Container not found`);
    return Promise.resolve({ ok: false, error: "Container not found" });
  }
  if (!_isAuthenticated()) {
    _container.innerHTML = '<div style="padding:2rem;text-align:center;color:#F59E0B;">Fa\xE7a login para acessar</div>';
    return Promise.resolve({ ok: false, error: "AUTH_REQUIRED" });
  }
  const cssPath = `/components/panels/${MODULE_ID}/styles/index.css`;
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    link.setAttribute("data-panel", MODULE_ID);
    document.head.appendChild(link);
  }
  _mounted = true;
  state.mounted = true;
  state.autoRefreshInterval = setInterval(() => {
    if (_canRefresh()) loadData();
  }, 6e4);
  const eventBus = _getPort("eventBus");
  eventBus?.emit?.(COMPONENT_EVENTS.MOUNTED, { componentId: PANEL_ID, moduleId: MODULE_ID, timestamp: Date.now() });
  return loadData().then(() => ({ ok: true }));
}
function unmount() {
  if (!_mounted && !state.mounted) return Promise.resolve();
  _mounted = false;
  if (state.autoRefreshInterval) {
    clearInterval(state.autoRefreshInterval);
    state.autoRefreshInterval = null;
  }
  if (_container) _container.innerHTML = "";
  _container = null;
  resetState();
  const eventBus = _getPort("eventBus");
  eventBus?.emit?.(COMPONENT_EVENTS.UNMOUNTED, { componentId: PANEL_ID, moduleId: MODULE_ID, timestamp: Date.now() });
  return Promise.resolve();
}
function healthCheck() {
  return {
    status: state.mounted && !state.error ? "HEALTHY" : state.error ? "DEGRADED" : "NOT_MOUNTED",
    mounted: state.mounted,
    loading: state.loading,
    error: state.error,
    isAuthenticated: _isAuthenticated(),
    isDocumentVisible: _isDocumentVisible(),
    lastRefresh: state.lastRefresh,
    divergenceCount: state.divergences.length,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    mounted: state.mounted,
    isAuthenticated: _isAuthenticated(),
    isDocumentVisible: _isDocumentVisible(),
    status: state.status,
    inventory: state.inventory,
    stats: state.stats,
    divergenceCount: state.divergences.length,
    lastRefresh: state.lastRefresh,
    features: [
      "Real-time UARPS status monitoring",
      "Divergence tracking and logging",
      "Inventory overview (triggers/regions)",
      "Auto-refresh every 60s (with auth/visibility gating)",
      "Shadow mode validation"
    ],
    timestamp: Date.now()
  };
}
function getVersion() {
  return VERSION;
}
function refresh() {
  if (_canRefresh()) return loadData();
  return Promise.resolve(false);
}
function destroy() {
  return unmount();
}
var panel_uarps_monitor_default = { mount, unmount, destroy, healthCheck, info, getVersion, refresh, VERSION, MODULE_ID, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  panel_uarps_monitor_default as default,
  destroy,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  mount,
  refresh,
  unmount
};
