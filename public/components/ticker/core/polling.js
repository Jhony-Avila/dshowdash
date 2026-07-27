import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.4.0-P17WI";
const MODULE_ID = "ticker.core.polling";
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
class PollingManager {
  constructor(options = {}) {
    this.interval = options.interval || 3e5;
    this.callback = options.callback || (() => {
    });
    this.timerId = null;
    this.isRunning = false;
    this.abortController = null;
    this._metrics = { startCount: 0, stopCount: 0, pollCount: 0, abortCount: 0, lastPollAt: null };
  }
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._poll();
    this.timerId = setInterval(() => this._poll(), this.interval);
    this._metrics.startCount++;
    _log("debug", `Polling started (interval: ${this.interval}ms)`);
  }
  _poll() {
    if (!this.isRunning) return;
    if (typeof document !== "undefined" && document.hidden) return;
    if (this.abortController) {
      this.abortController.abort();
      this._metrics.abortCount++;
      _log("debug", "Previous fetch aborted");
    }
    this.abortController = new AbortController();
    this.callback(this.abortController.signal);
    this._metrics.pollCount++;
    this._metrics.lastPollAt = Date.now();
  }
  stop() {
    if (!this.isRunning) return;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    clearInterval(this.timerId);
    this.isRunning = false;
    this.timerId = null;
    this._metrics.stopCount++;
    _log("debug", "Polling stopped");
  }
  restart() {
    this.stop();
    this.start();
  }
  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this._metrics.abortCount++;
    }
  }
  getSignal() {
    return this.abortController?.signal || null;
  }
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { hasCallback: typeof this.callback === "function", validInterval: this.interval > 0, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, isRunning: this.isRunning, interval: this.interval, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { startCount: 0, stopCount: 0, pollCount: 0, abortCount: 0, lastPollAt: null };
  }
}
function getVersion() {
  return VERSION;
}
var polling_default = PollingManager;
export {
  MODULE_ID,
  PollingManager,
  VERSION,
  polling_default as default,
  getPorts,
  getVersion,
  injectPorts
};
