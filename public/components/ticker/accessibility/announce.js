import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.4.0-P17WI";
const MODULE_ID = "ticker.accessibility.announce";
const hasWindow = typeof window !== "undefined";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
  return cfg?.app?.debug ?? false;
};
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
class AnnounceManager {
  liveRegion;
  _metrics;
  constructor() {
    this.liveRegion = null;
    this._metrics = { mountCount: 0, announceCount: 0, lastAnnounceAt: null };
  }
  mount(container) {
    this.liveRegion = container.querySelector("[aria-live]");
    this._metrics.mountCount++;
    _log("debug", "AnnounceManager mounted");
  }
  announce(message) {
    if (this.liveRegion) {
      this.liveRegion.setAttribute("aria-label", message);
      this._metrics.announceCount++;
      this._metrics.lastAnnounceAt = Date.now();
      _log("debug", "Announced:", message);
    }
  }
  unmount() {
    this.liveRegion = null;
    _log("debug", "AnnounceManager unmounted");
  }
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { ready: true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, hasLiveRegion: !!this.liveRegion, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, announceCount: 0, lastAnnounceAt: null };
  }
}
function getVersion() {
  return VERSION;
}
var announce_default = AnnounceManager;
export {
  AnnounceManager,
  MODULE_ID,
  VERSION,
  announce_default as default,
  getPorts,
  getVersion,
  injectPorts
};
