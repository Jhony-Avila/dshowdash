import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-navrail-admin/handlers/sync";
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
class SyncHandler {
  constructor(options = {}) {
    this.options = options;
    this._syncing = false;
    this._metrics = { syncCount: 0, errorCount: 0, lastSyncAt: null };
  }
  async sync(data) {
    if (this._syncing) return { ok: false, reason: "already_syncing" };
    this._syncing = true;
    this._metrics.syncCount++;
    this._metrics.lastSyncAt = Date.now();
    try {
      _getPort("logger")?.debug(`[${MODULE_ID}] Syncing...`);
      return { ok: true, data };
    } catch (e) {
      this._metrics.errorCount++;
      _getPort("logger")?.error(`[${MODULE_ID}] Sync error:`, e);
      return { ok: false, error: e.message };
    } finally {
      this._syncing = false;
    }
  }
  isSyncing() {
    return this._syncing;
  }
  healthCheck() {
    return { status: "healthy", syncing: this._syncing, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, syncing: this._syncing, metrics: this._metrics, portsInitialized: Ports.isInitialized() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
}
var sync_default = SyncHandler;
export {
  MODULE_ID,
  SyncHandler,
  VERSION,
  sync_default as default,
  getPorts,
  injectPorts
};
