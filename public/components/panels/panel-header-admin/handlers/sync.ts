// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-header-admin/handlers/sync
// PURPOSE: Header Admin - Sync Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   HEADER_EVENTS from /core/runtime/events/catalog/header.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   SyncHandler() — exported function
//   initSync() — exported function
//   triggerSync() — exported function
//   refreshLiveHeader() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   HEADER_EVENTS.REFRESH
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { HEADER_EVENTS } from '/core/runtime/events/catalog/header.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-header-admin/handlers/sync';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

interface SyncHandlerInstance { sync: (data: unknown) => Promise<unknown>; isSyncing: () => boolean }
interface SyncHandlerConstructor { new(options: Record<string, unknown>): SyncHandlerInstance; prototype: SyncHandlerInstance & Record<string, unknown> }
let _syncHandler: SyncHandlerInstance | null = null;
let _initialized = false;

export function SyncHandler(this: Record<string, unknown>, options: Record<string, unknown>) {
  options = options || {};
  this.options = options;
  this._syncing = false;
  this._metrics = { syncCount: 0, errorCount: 0, lastSyncAt: null };
}

SyncHandler.prototype.sync = function(data: unknown) {
  const self = this;
  if (this._syncing) return Promise.resolve({ ok: false, reason: 'already_syncing' });
  this._syncing = true;
  this._metrics.syncCount++;
  this._metrics.lastSyncAt = Date.now();
  return new Promise(resolve => {
    try {
      const logger = _getPort('logger');
      if (logger && logger.debug) logger.debug(`[${MODULE_ID}] Syncing...`);
      resolve({ ok: true, data });
    } catch (e: any) {
      self._metrics.errorCount++;
      const logger = _getPort('logger');
      if (logger && logger.error) logger.error(`[${MODULE_ID}] Sync error:`, e);
      resolve({ ok: false, error: e.message });
    } finally {
      self._syncing = false;
    }
  });
};

SyncHandler.prototype.isSyncing = function() { return this._syncing; };
SyncHandler.prototype.healthCheck = function() { return { status: 'healthy', syncing: this._syncing, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, p18Compliant: true }; };
SyncHandler.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, syncing: this._syncing, metrics: this._metrics, portsInitialized: Ports.isInitialized(), p18Compliant: true }; };
SyncHandler.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };

export function initSync(options: Record<string, unknown> = {}) {
  if (_initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  _syncHandler = new (SyncHandler as unknown as SyncHandlerConstructor)(options);
  _initialized = true;
  return { ok: true, version: VERSION };
}

export function triggerSync(data: unknown) {

  if (!_syncHandler) initSync();
  return _syncHandler!.sync(data);
}

export function refreshLiveHeader() {
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(HEADER_EVENTS.REFRESH, { source: MODULE_ID, timestamp: Date.now() });
  return { ok: true };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _initialized, p18Compliant: true }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, initialized: _initialized, p18Compliant: true }; }

export default { SyncHandler, initSync, triggerSync, refreshLiveHeader, injectPorts, getPorts, info, healthCheck, VERSION, MODULE_ID };
