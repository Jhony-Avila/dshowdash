// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P24-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01.core.lifecycle
// PURPOSE: Panel-01 Lifecycle Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   LIFECYCLE_EVENTS — exported value
//   LifecycleManager() — exported function
//   getEmitMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LIFECYCLE_EVENTS.BEFORE_MOUNT
//   LIFECYCLE_EVENTS.BEFORE_UNMOUNT
//   LIFECYCLE_EVENTS.BEFORE_UPDATE
//   LIFECYCLE_EVENTS.ERROR
//   LIFECYCLE_EVENTS.MOUNTED
//   LIFECYCLE_EVENTS.UNMOUNTED
//   LIFECYCLE_EVENTS.UPDATED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01.core.lifecycle';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// P24: Métricas de emissão
const _emitMetrics: { total: number; byEvent: Record<string, number>; lastEmitAt: number | null } = { total: 0, byEvent: {}, lastEmitAt: null };
function _trackEmit(eventName: string) { _emitMetrics.total++; _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1; _emitMetrics.lastEmitAt = Date.now(); }

const _log = function(level: string) { const args = Array.prototype.slice.call(arguments, 1); const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if ((logger as Record<string, unknown>).error) (logger as Record<string, (...a: unknown[]) => void>).error(prefix, args.join(' ')); return; } if (level === 'warn') { if ((logger as Record<string, unknown>).warn) (logger as Record<string, (...a: unknown[]) => void>).warn(prefix, args.join(' ')); return; } if ((logger as Record<string, unknown>).info) (logger as Record<string, (...a: unknown[]) => void>).info(prefix, args.join(' ')); };

export const LIFECYCLE_EVENTS = { BEFORE_MOUNT: 'lifecycle:beforeMount', MOUNTED: 'lifecycle:mounted', BEFORE_UPDATE: 'lifecycle:beforeUpdate', UPDATED: 'lifecycle:updated', BEFORE_UNMOUNT: 'lifecycle:beforeUnmount', UNMOUNTED: 'lifecycle:unmounted', ERROR: 'lifecycle:error' };

export function LifecycleManager(this: any, panelId: string) { this.panelId = panelId; this.state = 'idle'; this.hooks = new Map(); this.mountTime = null; _initPorts(); }

LifecycleManager.prototype.on = function(event: string, callback: (...args: unknown[]) => unknown) { if (!this.hooks.has(event)) { this.hooks.set(event, new Set()); } this.hooks.get(event).add(callback); const self = this; return () => { self.hooks.get(event).delete(callback); }; };

LifecycleManager.prototype.emit = function(event: string, data: Record<string, unknown>) {
  data = data || {};
  _trackEmit(event);
  const callbacks = this.hooks.get(event);
  if (!callbacks) return Promise.resolve();
  const self = this;
  const promises: Promise<unknown>[] = [];
  callbacks.forEach((callback: (...args: unknown[]) => unknown) => {

    // @ts-expect-error TS migration - TS2554
    promises.push(Promise.resolve().then(() => callback(Object.assign({ event, panelId: self.panelId, source: MODULE_ID, timestamp: Date.now() }, data))).catch((error: Error) => { _log('error', 'Hook error:', error.message || error); }));
  });
  return Promise.all(promises);
};

LifecycleManager.prototype.beforeMount = function() { this.state = 'mounting'; return this.emit(LIFECYCLE_EVENTS.BEFORE_MOUNT, {}); };
LifecycleManager.prototype.mounted = function() { this.state = 'mounted'; this.mountTime = Date.now(); return this.emit(LIFECYCLE_EVENTS.MOUNTED, { mountTime: this.mountTime }); };
LifecycleManager.prototype.beforeUpdate = function(changes: unknown) { return this.emit(LIFECYCLE_EVENTS.BEFORE_UPDATE, { changes }); };
LifecycleManager.prototype.updated = function(changes: unknown) { return this.emit(LIFECYCLE_EVENTS.UPDATED, { changes }); };
LifecycleManager.prototype.beforeUnmount = function() { this.state = 'unmounting'; return this.emit(LIFECYCLE_EVENTS.BEFORE_UNMOUNT, {}); };
LifecycleManager.prototype.unmounted = function() { this.state = 'unmounted'; const uptime = this.mountTime ? Date.now() - this.mountTime : 0; const result = this.emit(LIFECYCLE_EVENTS.UNMOUNTED, { uptime }); this.mountTime = null; return result; };
LifecycleManager.prototype.error = function(error: Error | string) { this.state = 'error'; return this.emit(LIFECYCLE_EVENTS.ERROR, { error: (error as Error)?.message || error }); };
LifecycleManager.prototype.getState = function() { return this.state; };
LifecycleManager.prototype.getUptime = function() { return this.mountTime ? Date.now() - this.mountTime : 0; };
LifecycleManager.prototype.destroy = function() { this.hooks.clear(); this.state = 'destroyed'; };

export function getEmitMetrics() { return Object.assign({}, _emitMetrics); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), emitMetrics: getEmitMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { lifecycleReady: true, portsInitialized: Ports.isInitialized() }, emitMetrics: getEmitMetrics(), p24Instrumented: true, timestamp: Date.now() }; }
export default { LIFECYCLE_EVENTS, LifecycleManager, info, healthCheck, getEmitMetrics, VERSION, MODULE_ID, injectPorts, getPorts };
