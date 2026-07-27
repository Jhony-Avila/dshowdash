import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { HealthAPI } from "../api/health.js";
import { AlertsAPI } from "../api/alerts.js";
import { NetworkQualityMonitor } from "./network-quality.js";
import { PollingManager } from "./polling.js";
const VERSION = "5.3.0-P17WI";
const MODULE_ID = "header/core/header-managers";
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
const _debugEnabled = () => _getPort("config")?.app?.debug || false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    logger.error?.(prefix, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(prefix, ...args);
    return;
  }
  if (level === "info") {
    logger.info?.(prefix, ...args);
    return;
  }
  if (_debugEnabled()) logger.debug?.(prefix, ...args);
};
class HeaderManagers {
  constructor(header) {
    this.header = header;
    this._debug = false;
    this._metrics = { initAPICount: 0, initManagersCount: 0, lastInitAt: null };
  }
  initAPI() {
    this._metrics.initAPICount++;
    this._metrics.lastInitAt = Date.now();
    this.header.healthAPI = new HealthAPI(this.header.config, this.header.timers, this.header.logger, this.header.eventBus);
    this.header.alertsAPI = new AlertsAPI(this.header.config, this.header.logger, this.header.eventBus);
    _log("info", "APIs inicializadas");
  }
  initManagers() {
    this._metrics.initManagersCount++;
    this.header.networkMonitor = new NetworkQualityMonitor(this.header.config, this.header.store, this.header.logger);
    this.header.polling = new PollingManager(this.header.config, this.header.healthAPI, this.header.alertsAPI, this.header.networkMonitor, this.header.store, this.header.timers, this.header.telemetry, this.header.logger, this.header.eventBus);
    _log("info", "Managers inicializados");
  }
  healthCheck() {
    const checks = { headerAvailable: !!this.header, healthAPIReady: !!this.header?.healthAPI, alertsAPIReady: !!this.header?.alertsAPI, networkMonitorReady: !!this.header?.networkMonitor, pollingReady: !!this.header?.polling };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    this._debug = !!enabled;
  }
  resetMetrics() {
    this._metrics = { initAPICount: 0, initManagersCount: 0, lastInitAt: null };
  }
}
function getVersion() {
  return VERSION;
}
var header_managers_default = HeaderManagers;
export {
  HeaderManagers,
  MODULE_ID,
  VERSION,
  header_managers_default as default,
  getPorts,
  getVersion,
  injectPorts
};
