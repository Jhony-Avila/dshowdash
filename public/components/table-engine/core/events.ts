// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P25)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:events
// PURPOSE: Table Engine - Internal Event Emitter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   EventEmitter() — exported function
//   applyEventEmitter() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

export const VERSION = '1.1.0-P25';
export const MODULE_ID = 'table-engine:events';

export function EventEmitter(this: any) {
  this._handlers = new Map();
  this._onceHandlers = new Map();
}

EventEmitter.prototype.on = function(event: string, handler: ((payload: Record<string, unknown>) => void) | undefined) {
  const self = this;
  if (typeof handler !== 'function') return () => {};
  if (!self._handlers.has(event)) self._handlers.set(event, new Set());
  self._handlers.get(event).add(handler);
  return () => { self.off(event, handler); };
};

EventEmitter.prototype.once = function(event: string, handler: ((payload: Record<string, unknown>) => void) | undefined) {
  const self = this;
  if (typeof handler !== 'function') return () => {};
  if (!self._onceHandlers.has(event)) self._onceHandlers.set(event, new Set());
  self._onceHandlers.get(event).add(handler);
  return () => { const set = self._onceHandlers.get(event); if (set) set.delete(handler); };
};

EventEmitter.prototype.off = function(event: string, handler: ((payload: Record<string, unknown>) => void) | undefined) {
  if (handler) {
    const handlers = this._handlers.get(event);
    if (handlers) handlers.delete(handler);
    const once = this._onceHandlers.get(event);
    if (once) once.delete(handler);
  } else {
    this._handlers.delete(event);
    this._onceHandlers.delete(event);
  }
  return this;
};

EventEmitter.prototype.emit = function(event: string, data: Record<string, unknown>) {
  if (!data) data = {};
  const payload = Object.assign({}, data, { event, timestamp: Date.now() });
  const handlers = this._handlers.get(event);
  if (handlers) handlers.forEach((h: (payload: Record<string, unknown>) => void) => { try { h(payload); } catch (e) {} });
  const once = this._onceHandlers.get(event);
  if (once) once.forEach((h: (payload: Record<string, unknown>) => void) => { try { h(payload); } catch (e) {} });
  this._onceHandlers.delete(event);
  return this;
};

EventEmitter.prototype.clear = function() {
  this._handlers.clear();
  this._onceHandlers.clear();
  return this;
};

EventEmitter.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, eventsCount: this._handlers.size, p25Compliant: true };
};

EventEmitter.prototype.healthCheck = function() {
  const checks = { handlersMapAvailable: !!this._handlers, onceMapAvailable: !!this._onceHandlers };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, eventsCount: this._handlers.size, p25Compliant: true, timestamp: Date.now() };
};

export function applyEventEmitter(target: Record<string, unknown>) {
  const emitter = new (EventEmitter as unknown as new () => Record<string, ((...args: unknown[]) => unknown)>)();
  target.on = emitter.on.bind(emitter);
  target.once = emitter.once.bind(emitter);
  target.off = emitter.off.bind(emitter);
  target.emit = emitter.emit.bind(emitter);
  target._eventEmitter = emitter;
  return target;
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { moduleAvailable: true }, p25Compliant: true, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true };
}

export default { EventEmitter, applyEventEmitter, VERSION, MODULE_ID, healthCheck, info };
