import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.4.0-P17WI";
const MODULE_ID = "header/state/snapshots";
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
class StateSnapshots {
  constructor(maxSnapshots = 10) {
    this.snapshots = [];
    this.maxSnapshots = maxSnapshots;
    this._debug = false;
    this._metrics = { captureCount: 0, rollbackCount: 0, lastCaptureAt: null };
  }
  capture(state) {
    this._metrics.captureCount++;
    this._metrics.lastCaptureAt = Date.now();
    const snapshot = { state: JSON.parse(JSON.stringify(state)), timestamp: Date.now() };
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) this.snapshots.shift();
    _log("debug", `Snapshot capturado (${this.snapshots.length}/${this.maxSnapshots})`);
    return snapshot;
  }
  getLatest() {
    if (this.snapshots.length === 0) return null;
    return this.snapshots[this.snapshots.length - 1];
  }
  getAll() {
    return [...this.snapshots];
  }
  rollback(index = -1) {
    if (this.snapshots.length === 0) {
      _log("error", "Nenhum snapshot dispon\xEDvel para rollback");
      throw new Error("Nenhum snapshot dispon\xEDvel para rollback");
    }
    const targetIndex = index < 0 ? this.snapshots.length + index : index;
    if (targetIndex < 0 || targetIndex >= this.snapshots.length) {
      _log("error", `\xCDndice de snapshot inv\xE1lido: ${index}`);
      throw new RangeError(`\xCDndice de snapshot inv\xE1lido: ${index}`);
    }
    this._metrics.rollbackCount++;
    _log("info", `Rollback para snapshot ${targetIndex}`);
    return this.snapshots[targetIndex].state;
  }
  clear() {
    this.snapshots = [];
    _log("info", "Snapshots limpos");
  }
  getCount() {
    return this.snapshots.length;
  }
  getMetrics() {
    return { ...this._metrics, snapshotCount: this.snapshots.length };
  }
  resetMetrics() {
    this._metrics = { captureCount: 0, rollbackCount: 0, lastCaptureAt: null };
  }
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { belowLimit: this.snapshots.length <= this.maxSnapshots, loggerAvailable: !!logger };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), snapshotCount: this.snapshots.length, maxSnapshots: this.maxSnapshots, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), snapshotCount: this.snapshots.length, maxSnapshots: this.maxSnapshots, metrics: this.getMetrics(), healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    this._debug = !!enabled;
  }
}
function getVersion() {
  return VERSION;
}
var snapshots_default = StateSnapshots;
export {
  MODULE_ID,
  StateSnapshots,
  VERSION,
  snapshots_default as default,
  getPorts,
  getVersion,
  injectPorts
};
