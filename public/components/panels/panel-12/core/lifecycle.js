import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
import * as logger from "../utils/logger.js";
// CSS_PATH e' importado pelo nome real. Estava `VERSION as CSS_PATH`, o que punha a
// string de versao no href -> /9.3.0-P2-ENTERPRISE devolvia o fallback SPA em HTML e
// o navegador recusava por MIME: o painel nunca teve estilo.
import { PANEL_ID, CSS_PATH, REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED } from "./constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-12.core.lifecycle";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
const _debug = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...rest) {
  const args = rest;
  const loggerPort = _getPort("logger");
  const prefix = "[Panel-12]";
  if (level === "error") {
    if (loggerPort && loggerPort.error) loggerPort.error(...[prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (loggerPort && loggerPort.warn) loggerPort.warn(...[prefix].concat(args));
    return;
  }
  if (_debug() && loggerPort && loggerPort.debug) loggerPort.debug(...[prefix].concat(args));
};
const state = { intervalId: null, loadedOnce: false, pollingPaused: false, pauseTimer: null, retryToast: null, cssLoaded: false, currentRequestId: 0, activeLoadRequest: null, abortController: null, searchDebounceTimer: null, isDegraded: false, consecutiveErrors: 0 };
function loadCSS() {
  if (state.cssLoaded) return;
  if (document.querySelector(`link[href*="${CSS_PATH}"]`)) {
    state.cssLoaded = true;
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CSS_PATH;
  document.head.appendChild(link);
  state.cssLoaded = true;
  logger.info("css.loaded", { panel: PANEL_ID });
}
function markLoadedOnce() {
  _initPorts();
  if (!state.loadedOnce) {
    const eventBus = _getPort("eventBus");
    if (eventBus && eventBus.emit) {
      eventBus.emit(PANEL_EVENTS.LOADED, { panelId: PANEL_ID, timestamp: Date.now(), source: MODULE_ID });
    }
    state.loadedOnce = true;
    const telemetry = _getPort("telemetry");
    if (telemetry && telemetry.track) {
      telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { panel: PANEL_ID, panelId: PANEL_ID });
    }
  }
}
function pausePollingTemporarily(ms) {
  if (ms === void 0) ms = 300;
  state.pollingPaused = true;
  if (state.pauseTimer) clearTimeout(state.pauseTimer);
  state.pauseTimer = setTimeout(() => {
    state.pollingPaused = false;
    state.pauseTimer = null;
  }, ms);
}
function getRefreshInterval() {
  if (state.isDegraded) return REFRESH_INTERVAL_DEGRADED;
  if (navigator.connection && navigator.connection.effectiveType) {
    const type = navigator.connection.effectiveType;
    if (type === "2g") return REFRESH_INTERVAL_BASE * 4;
    if (type === "3g") return REFRESH_INTERVAL_BASE * 2;
  }
  return REFRESH_INTERVAL_BASE;
}
function handleSessionExpired(container) {
  if (typeof window !== "undefined" && window.openLogin) {
    window.openLogin();
  }
  const table = document.querySelector(`#${PANEL_ID} .p12-table-wrapper`);
  if (table) {
    table.innerHTML = '<div class="p12-error">Sess\xE3o expirada. Por favor, fa\xE7a login novamente.</div>';
  }
}
function resetState() {
  if (state.pauseTimer) clearTimeout(state.pauseTimer);
  state.intervalId = null;
  state.loadedOnce = false;
  state.pollingPaused = false;
  state.pauseTimer = null;
  state.retryToast = null;
  state.cssLoaded = false;
  state.currentRequestId = 0;
  state.activeLoadRequest = null;
  state.abortController = null;
  state.searchDebounceTimer = null;
  state.isDegraded = false;
  state.consecutiveErrors = 0;
}
function getStatus() {
  return { panelId: PANEL_ID, version: VERSION, mounted: state.loadedOnce, destroyed: false, isDegraded: state.isDegraded, consecutiveErrors: state.consecutiveErrors, pollingPaused: state.pollingPaused, cssLoaded: state.cssLoaded, portsInitialized: Ports.isInitialized(), p22Compliant: true };
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  const loggerPort = _getPort("logger");
  const status = getStatus();
  const checks = { cssLoaded: status.cssLoaded === true, mounted: status.mounted === true, notDegraded: status.isDegraded !== true, lowErrorCount: (status.consecutiveErrors || 0) < 5, notPaused: status.pollingPaused !== true, loggerReady: !!loggerPort, portsInitialized: Ports.isInitialized() };
  const values = Object.values(checks);
  const score = values.filter(Boolean).length;
  const maxScore = Object.keys(checks).length;
  return { status: score === maxScore ? "HEALTHY" : score >= 5 ? "DEGRADED" : "UNHEALTHY", score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, panelId: PANEL_ID, version: VERSION, p22Compliant: true, timestamp: Date.now() };
}
function info() {
  return Object.assign({ panelId: PANEL_ID, version: VERSION, p22Compliant: true }, getStatus());
}
export {
  MODULE_ID,
  PANEL_ID,
  VERSION,
  _debug,
  _log,
  getPorts,
  getRefreshInterval,
  getStatus,
  getVersion,
  handleSessionExpired,
  healthCheck,
  info,
  injectPorts,
  loadCSS,
  markLoadedOnce,
  pausePollingTemporarily,
  resetState,
  state
};
