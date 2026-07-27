import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.1.0-P17WI";
const MODULE_ID = "preloader.telemetry.metrics";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
class PreloaderMetrics {
  _metrics;
  constructor() {
    this.reset();
  }
  reset() {
    this._metrics = { initCount: 0, mountCount: 0, hideCount: 0, cleanupCount: 0, lastInitAt: null, lastMountAt: null, lastHideAt: null, lastCleanupAt: null };
  }
  recordInit() {
    this._metrics.initCount++;
    this._metrics.lastInitAt = Date.now();
  }
  recordMount() {
    this._metrics.mountCount++;
    this._metrics.lastMountAt = Date.now();
  }
  recordHide() {
    this._metrics.hideCount++;
    this._metrics.lastHideAt = Date.now();
  }
  recordCleanup() {
    this._metrics.cleanupCount++;
    this._metrics.lastCleanupAt = Date.now();
  }
  get() {
    return { ...this._metrics };
  }
  getStatus() {
    return { ...this._metrics, uptime: this._metrics.lastInitAt ? Date.now() - this._metrics.lastInitAt : 0 };
  }
}
function createMetrics() {
  return new PreloaderMetrics();
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
}
var metrics_default = { VERSION, MODULE_ID, createMetrics, PreloaderMetrics, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  PreloaderMetrics,
  VERSION,
  createMetrics,
  metrics_default as default,
  getPorts,
  healthCheck,
  injectPorts
};
