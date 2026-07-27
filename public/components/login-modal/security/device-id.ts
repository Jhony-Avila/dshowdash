// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.8.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-device-id
// PURPOSE: security   device id
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   DeviceIDManager() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
// ═══════════════════════════════════════════════════════════════
'use strict';
// Login Modal - Device ID Manager
// @version 5.8.0-P17WI-ES6
// P17WI: PortsFactory/PortsProfiles

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '5.8.0-P17WI';
const MODULE_ID = 'login-modal-device-id';
const STORAGE_KEY = 'dshow_device_id';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string) { const logger = _getPort('logger'); if (!logger) return; const args = Array.prototype.slice.call(arguments, 1); if (level === 'error') { if (logger.error) logger.error(...['[login-device-id]'].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...['[login-device-id]'].concat(args)); return; } if (_debugEnabled() && logger.debug) logger.debug(...['[login-device-id]'].concat(args)); };

export function DeviceIDManager(this: any, config: Record<string, any>) { if (!config) config = {}; this.config = config; this.deviceId = null; this._metrics = { generates: 0, retrieves: 0, clears: 0 }; _initPorts(); }

DeviceIDManager.prototype.generate = function() {
  this._metrics.generates++;

  // @ts-expect-error TS migration - TS2554
  try { const array = new Uint8Array(16); crypto.getRandomValues(array); const id = Array.from(array, b => b.toString(16).padStart(2, '0')).join(''); this.deviceId = id; this._persist(id); _log('info', 'Device ID gerado'); return id; }

  // @ts-expect-error TS migration - TS2554
  catch (error) { _log('error', 'Erro ao gerar device ID', error); const fallback = `fb-${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`; this.deviceId = fallback; return fallback; }
};


// @ts-expect-error TS migration - TS2554
DeviceIDManager.prototype.get = function() { this._metrics.retrieves++; if (this.deviceId) return this.deviceId; try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) { this.deviceId = stored; return stored; } } catch (error) { _log('warn', 'Erro ao recuperar device ID', error); } return this.generate(); };


// @ts-expect-error TS migration - TS2554
DeviceIDManager.prototype.clear = function() { this._metrics.clears++; try { localStorage.removeItem(STORAGE_KEY); this.deviceId = null; _log('info', 'Device ID limpo'); } catch (error) { _log('error', 'Erro ao limpar device ID', error); } };


// @ts-expect-error TS migration - TS2554
DeviceIDManager.prototype._persist = (id: string) => { try { localStorage.setItem(STORAGE_KEY, id); } catch (error) { _log('warn', 'Erro ao persistir device ID', error); } };

DeviceIDManager.prototype.getStatus = function() { return { hasDeviceId: !!this.deviceId, deviceIdLength: this.deviceId ? this.deviceId.length : 0, metrics: Object.assign({}, this._metrics) }; };

DeviceIDManager.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, hasDeviceId: !!this.deviceId, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() }; };

DeviceIDManager.prototype.healthCheck = () => { const logger = _getPort('logger'); const checks = { canGenerateId: typeof crypto !== 'undefined', hasStorage: typeof localStorage !== 'undefined', loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export default DeviceIDManager;
export { VERSION, MODULE_ID };
