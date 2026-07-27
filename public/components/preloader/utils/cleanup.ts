// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.3.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-cleanup
// PURPOSE: Resource Cleanup Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   CleanupManager() — exported function
//   getVersion() — exported function
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

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const VERSION = '5.3.0-P17WI';
const MODULE_ID = 'preloader-cleanup';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _log(level: 'error' | 'warn' | 'info' | 'debug', msg: string, ctx?: Record<string, unknown>) {
  const logger = _getPort('logger');
  if (!logger) return;
  ctx = ctx || {};
  ctx.component = MODULE_ID;
  if (typeof logger[level] === 'function') {
    logger[level](msg, ctx);
  }
}

export function CleanupManager(this: any) {
    this.timers = new Set();
    this.observers = new Set();
    this.intervals = new Set();
    this.callbacks = new Set();
    this._cleanupCount = 0;
    this._lastCleanupAt = null;
    this._errors = [];
    _initPorts();
}

CleanupManager.prototype.addTimer = function(timer: ReturnType<typeof setTimeout>) { this.timers.add(timer); };
CleanupManager.prototype.addObserver = function(observer: MutationObserver) { this.observers.add(observer); };
CleanupManager.prototype.addInterval = function(interval: ReturnType<typeof setInterval>) { this.intervals.add(interval); };
CleanupManager.prototype.add = function(callback: () => void) { if (typeof callback === 'function') { this.callbacks.add(callback); } };

CleanupManager.prototype.cleanup = function() {
    const self = this;
    self._cleanupCount++;
    self._lastCleanupAt = Date.now();
    self.timers.forEach((timer: ReturnType<typeof setTimeout>) => { clearTimeout(timer); });
    self.timers.clear();
    self.observers.forEach((observer: MutationObserver) => { observer.disconnect(); });
    self.observers.clear();
    self.intervals.forEach((interval: ReturnType<typeof setInterval>) => { clearInterval(interval); });
    self.intervals.clear();
    self.callbacks.forEach((callback: () => void) => {
        try { callback(); }
        catch (err: any) { self._errors.push({ error: err.message, timestamp: Date.now() }); _log('warn', `Erro ao executar callback: ${err.message}`); }
    });
    self.callbacks.clear();
    _log('info', 'Recursos limpos');
};

CleanupManager.prototype.getResourceCount = function() {
    return { timers: this.timers.size, observers: this.observers.size, intervals: this.intervals.size, callbacks: this.callbacks.size, total: this.timers.size + this.observers.size + this.intervals.size + this.callbacks.size };
};

CleanupManager.prototype.healthCheck = function() {
    const resources = this.getResourceCount();
    const noLeaks = resources.total < 100;
    const lowErrors = this._errors.length < 10;
    const checks = { noLeaks, lowErrors, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 3 ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/3`, checks, resources, cleanupCount: this._cleanupCount, errorCount: this._errors.length, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
};

CleanupManager.prototype.info = function() {
    return { version: VERSION, moduleId: MODULE_ID, healthCheck: this.healthCheck(), resources: this.getResourceCount(), cleanupCount: this._cleanupCount, lastCleanupAt: this._lastCleanupAt, portsInitialized: Ports.isInitialized(), errors: this._errors.slice(-5) };
};

export function getVersion() { return VERSION; }
export { VERSION, MODULE_ID };
