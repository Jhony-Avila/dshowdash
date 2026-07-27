import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { HEADER_EVENTS } from "/core/runtime/events/catalog/header.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-header-admin/handlers/sync";
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
let _syncHandler = null;
let _initialized = false;
function SyncHandler(options) {
  options = options || {};
  this.options = options;
  this._syncing = false;
  this._metrics = { syncCount: 0, errorCount: 0, lastSyncAt: null };
}
SyncHandler.prototype.sync = function(data) {
  const self = this;
  if (this._syncing) return Promise.resolve({ ok: false, reason: "already_syncing" });
  this._syncing = true;
  this._metrics.syncCount++;
  this._metrics.lastSyncAt = Date.now();
  return new Promise((resolve) => {
    try {
      const logger = _getPort("logger");
      if (logger && logger.debug) logger.debug(`[${MODULE_ID}] Syncing...`);
      resolve({ ok: true, data });
    } catch (e) {
      self._metrics.errorCount++;
      const logger = _getPort("logger");
      if (logger && logger.error) logger.error(`[${MODULE_ID}] Sync error:`, e);
      resolve({ ok: false, error: e.message });
    } finally {
      self._syncing = false;
    }
  });
};
SyncHandler.prototype.isSyncing = function() {
  return this._syncing;
};
SyncHandler.prototype.healthCheck = function() {
  return { status: "healthy", syncing: this._syncing, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, p18Compliant: true };
};
SyncHandler.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, syncing: this._syncing, metrics: this._metrics, portsInitialized: Ports.isInitialized(), p18Compliant: true };
};
SyncHandler.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
function initSync(options = {}) {
  if (_initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  _syncHandler = new SyncHandler(options);
  _initialized = true;
  return { ok: true, version: VERSION };
}
function triggerSync(data) {
  if (!_syncHandler) initSync();
  return _syncHandler.sync(data);
}
function refreshLiveHeader() {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(HEADER_EVENTS.REFRESH, { source: MODULE_ID, timestamp: Date.now() });
  return { ok: true };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _initialized, p18Compliant: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, initialized: _initialized, p18Compliant: true };
}
var sync_default = { SyncHandler, initSync, triggerSync, refreshLiveHeader, injectPorts, getPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  SyncHandler,
  VERSION,
  sync_default as default,
  getPorts,
  healthCheck,
  info,
  initSync,
  injectPorts,
  refreshLiveHeader,
  triggerSync
};
