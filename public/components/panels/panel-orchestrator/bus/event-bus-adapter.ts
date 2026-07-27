// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-orchestrator.bus.event-bus-adapter
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   EventBusAdapter() — exported function
//   orchestratorBus — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   event
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
// Event Bus Adapter
// @version 2.3.1-P17WI-AAA-ES6
// P17WI: PortsFactory/PortsProfiles migration

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-orchestrator.bus.event-bus-adapter';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug ? true : false; };

const _log = function(level: string) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { if (logger.error) logger.error(...[`[${MODULE_ID}]`].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(...[`[${MODULE_ID}]`].concat(args)); return; }
  if (level === 'info') { if (logger.info) logger.info(...[`[${MODULE_ID}]`].concat(args)); return; }
  if (_debugEnabled() && logger.debug) logger.debug(...[`[${MODULE_ID}]`].concat(args));
};

function EventBusAdapter(this: any) { this.handlers = new Map(); this.eventLog = []; this.maxLogSize = 100; this.initialized = false; this.destroyed = false; }

EventBusAdapter.prototype.getVersion = () => VERSION;
EventBusAdapter.prototype.isInitialized = function() { return this.initialized && !this.destroyed; };

EventBusAdapter.prototype.init = function() { if (this.initialized) return this; _initPorts(); this.initialized = true; this.destroyed = false; this._logEvent('adapter:init', { version: VERSION, timestamp: Date.now() }); return this; };

EventBusAdapter.prototype._getGlobalBus = () => _getPort('eventBus');

EventBusAdapter.prototype._logEvent = function(event: string, data: Record<string, unknown> = {}) { const entry = { event, data, timestamp: Date.now() }; this.eventLog.push(entry); if (this.eventLog.length > this.maxLogSize) this.eventLog.shift(); };


// @ts-expect-error TS migration - TS2554
EventBusAdapter.prototype.emit = function(event, payload) { if (payload === undefined) payload = {}; const bus = this._getGlobalBus(); const enrichedPayload = Object.assign({}, payload, { _source: 'orchestrator', _moduleId: MODULE_ID, _timestamp: Date.now() }); this._logEvent(event, enrichedPayload); if (bus && typeof bus.emit === 'function') { bus.emit(event, enrichedPayload); return true; } _log('info', `Global EventBus nao disponivel para: ${event} - evento local registrado`); return false; };


// @ts-expect-error TS migration - TS2554
EventBusAdapter.prototype.on = function(event, handler) { if (typeof handler !== 'function') { _log('error', 'Handler deve ser funcao'); return () => {}; } const self = this; const bus = this._getGlobalBus(); if (!this.handlers.has(event)) this.handlers.set(event, new Set()); this.handlers.get(event).add(handler); if (bus && typeof bus.on === 'function') bus.on(event, handler); this._logEvent('adapter:subscribed', { event }); return () => { self.off(event, handler); }; };

EventBusAdapter.prototype.off = function(event: string, handler: (...args: unknown[]) => void) { const bus = this._getGlobalBus(); if (this.handlers.has(event)) this.handlers.get(event).delete(handler); if (bus && typeof bus.off === 'function') bus.off(event, handler); this._logEvent('adapter:unsubscribed', { event }); };

EventBusAdapter.prototype.once = function(event: string, handler: (...args: unknown[]) => void) { const self = this; const wrappedHandler = (data: unknown) => { self.off(event, wrappedHandler); handler(data); }; return this.on(event, wrappedHandler); };

EventBusAdapter.prototype.removeAllListeners = function(event: string) { const self = this; const bus = this._getGlobalBus(); if (event) { if (this.handlers.has(event)) { const handlers = this.handlers.get(event); handlers.forEach((handler: (...args: unknown[]) => void) => { if (bus && typeof bus.off === 'function') bus.off(event, handler); }); this.handlers.delete(event); } } else { this.handlers.forEach((handlers: Set<(...args: unknown[]) => void>, evt: string) => { handlers.forEach((handler: (...args: unknown[]) => void) => { if (bus && typeof bus.off === 'function') bus.off(evt, handler); }); }); this.handlers.clear(); } this._logEvent('adapter:cleared', { event: event || 'all' }); };

EventBusAdapter.prototype.getEventLog = function() { return this.eventLog.slice(); };
EventBusAdapter.prototype.getRecentEvents = function(count: number = 10) { return this.eventLog.slice(-count); };
EventBusAdapter.prototype.getSubscribedEvents = function() { return Array.from(this.handlers.keys()); };
EventBusAdapter.prototype.getHandlerCount = function(event: string) { if (event) return this.handlers.has(event) ? this.handlers.get(event).size : 0; let total = 0; this.handlers.forEach((h: Set<unknown>) => { total += h.size; }); return total; };
EventBusAdapter.prototype.getStats = function() { return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, hasGlobalBus: !!this._getGlobalBus(), subscribedEvents: this.getSubscribedEvents().length, totalHandlers: this.getHandlerCount(), eventLogSize: this.eventLog.length, portsInitialized: Ports.isInitialized() }; };
EventBusAdapter.prototype.reset = function() { this.removeAllListeners(); this.eventLog = []; this.destroyed = false; };
EventBusAdapter.prototype.destroy = function() { this.removeAllListeners(); this.eventLog = []; this.initialized = false; this.destroyed = true; this._logEvent('adapter:destroyed', {}); };

// @ts-expect-error strict migration — TS7009
const orchestratorBus = new EventBusAdapter();

function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
function healthCheck() { const logger = _getPort('logger'); return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { ready: true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }, timestamp: Date.now() }; }

export { EventBusAdapter, orchestratorBus, VERSION, MODULE_ID, info, healthCheck };
export default orchestratorBus;
