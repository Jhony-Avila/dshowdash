// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.8.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-eventbus
// PURPOSE: Login Modal - EventBus Local
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   EventBus() — exported function
//   getEventBus() — exported function
//   resetEventBus() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '5.8.0-P17WI';
const MODULE_ID = 'login-modal-eventbus';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };

const _log = function(level: string) { const logger = _getPort('logger'); if (!logger) return; const args = Array.prototype.slice.call(arguments, 1); if (level === 'error') { if (logger.error) logger.error(...['[login-eventbus]'].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...['[login-eventbus]'].concat(args)); return; } if (_debugEnabled() && logger.debug) logger.debug(...['[login-eventbus]'].concat(args)); };

export function EventBus(this: any, config: Record<string, any>) { if (!config) config = {}; this.namespace = config.namespace || 'login-modal'; this.debug = config.debug || false; this.listeners = new Map(); this.history = []; this.maxHistory = config.maxHistory || 50; this._metrics = { emits: 0, subscriptions: 0, unsubscriptions: 0 }; _initPorts(); }

EventBus.prototype.on = function(event: string, callback: (payload: any) => void) { this._metrics.subscriptions++; const key = this._getKey(event); if (!this.listeners.has(key)) this.listeners.set(key, new Set()); this.listeners.get(key).add(callback); const self = this; return () => { self.off(event, callback); }; };

EventBus.prototype.off = function(event: string, callback: (payload: any) => void) { this._metrics.unsubscriptions++; const key = this._getKey(event); const listeners = this.listeners.get(key); if (listeners) listeners.delete(callback); };


// @ts-expect-error TS migration - TS2554
EventBus.prototype.emit = function(event: string, data: Record<string, unknown>) { if (!data) data = {}; this._metrics.emits++; const key = this._getKey(event); const payload = { event, data, timestamp: Date.now(), namespace: this.namespace }; this._recordHistory(payload); const listeners = this.listeners.get(key); if (listeners) { listeners.forEach((callback: (payload: any) => void) => { try { callback(payload); } catch (error) { _log('error', `Erro em listener ${event}:`, error); } }); } if (this.debug) _log('info', `Evento emitido: ${event}`, data); };

EventBus.prototype.once = function(event: string, callback: (payload: any) => void) { const self = this; const wrapper = (payload: any) => { self.off(event, wrapper); callback(payload); }; return this.on(event, wrapper); };


// @ts-expect-error TS migration - TS2554
EventBus.prototype.clear = function() { this.listeners.clear(); this.history = []; _log('info', 'EventBus limpo'); };

EventBus.prototype._getKey = function(event: string) { return `${this.namespace}:${event}`; };
EventBus.prototype._recordHistory = function(payload: Record<string, unknown>) { this.history.push(payload); if (this.history.length > this.maxHistory) this.history.shift(); };
EventBus.prototype.getHistory = function() { return this.history.slice(); };

EventBus.prototype.getListenerCount = function(event: string) { if (event) { const key = this._getKey(event); const set = this.listeners.get(key); return set ? set.size : 0; } let total = 0; this.listeners.forEach((set: Set<any>) => { total += set.size; }); return total; };

EventBus.prototype.getEventNames = function() { const names: string[] = []; this.listeners.forEach((set: Set<any>, key: string) => { names.push(key); }); return names; };

EventBus.prototype.getStatus = function() { return { namespace: this.namespace, debug: this.debug, totalListeners: this.getListenerCount(), historySize: this.history.length, metrics: Object.assign({}, this._metrics) }; };

EventBus.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, namespace: this.namespace, portsInitialized: Ports.isInitialized(), status: this.getStatus(), timestamp: Date.now() }; };

EventBus.prototype.healthCheck = function() { const logger = _getPort('logger'); const checks = { hasNamespace: !!this.namespace, lowHistorySize: this.history.length <= this.maxHistory, noMemoryLeak: this.getListenerCount() < 1000, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 5 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export default EventBus;

let _instance: any = null;
export function getEventBus(config: Record<string, any>) { if (!_instance) _instance = new (EventBus as any)(config); return _instance; }
export function resetEventBus() { _instance = null; }
export { VERSION, MODULE_ID };
