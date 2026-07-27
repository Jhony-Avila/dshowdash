// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.core.offline-queue
// PURPOSE: Router Core - Offline Queue
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   cleanup() — exported function
//   enqueue() — exported function
//   dequeue() — exported function
//   peek() — exported function
//   clear() — exported function
//   getQueue() — exported function
//   getSize() — exported function
//   processQueue() — exported function
//   setOnline() — exported function
//   isOnline() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';

const MODULE_ID = 'components.router.core.offline-queue';
const VERSION = '2.2.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; queue: Record<string, unknown>[]; maxSize: number; isOnline: boolean } = { initialized: false, queue: [], maxSize: 50, isOnline: true };
const _metrics = { queued: 0, processed: 0, dropped: 0, errors: 0 };
let _cleanups: (() => void)[] = [];

function _track(eventName: string, payload: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }
function _emit(eventName: string, data: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }

function enqueue(item: unknown) { if (_state.queue.length >= _state.maxSize) { _state.queue.shift(); _metrics.dropped++; } _state.queue.push({ item, timestamp: Date.now(), id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }); _metrics.queued++; _track('router:offline:enqueue', { queueSize: _state.queue.length }); return { ok: true, queueSize: _state.queue.length }; }
function dequeue() { if (_state.queue.length === 0) return null; return _state.queue.shift(); }
function peek() { return _state.queue.length > 0 ? _state.queue[0] : null; }
function clear() { const count = _state.queue.length; _state.queue = []; return { ok: true, cleared: count }; }
function getQueue() { return _state.queue.slice(); }
function getSize() { return _state.queue.length; }

function processQueue(handler: (item: unknown) => void) { if (!handler || typeof handler !== 'function') return { ok: false, error: 'Handler required' }; let processed = 0; let errors = 0; while (_state.queue.length > 0 && _state.isOnline) { const entry = _state.queue.shift(); try { handler(entry!.item); processed++; _metrics.processed++; } catch (e) { errors++; _metrics.errors++; } } _track('router:offline:process', { processed, errors }); _emit(ROUTER_EVENTS.OFFLINE_PROCESSED, { processed, errors }); return { ok: true, processed, errors }; }

function setOnline(online: boolean) { const wasOffline = !_state.isOnline; _state.isOnline = online; if (wasOffline && online) _emit(ROUTER_EVENTS.OFFLINE_ONLINE, { queueSize: _state.queue.length }); else if (!online) _emit(ROUTER_EVENTS.OFFLINE_OFFLINE, {}); }
function isOnline() { return _state.isOnline; }

function _handleOnline() { setOnline(true); }
function _handleOffline() { setOnline(false); }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); if (ctx && ctx.maxSize) _state.maxSize = ctx.maxSize as number; if (typeof window !== 'undefined') { _state.isOnline = navigator.onLine; window.addEventListener('online', _handleOnline); window.addEventListener('offline', _handleOffline); _cleanups.push(() => { window.removeEventListener('online', _handleOnline); window.removeEventListener('offline', _handleOffline); }); } _state.initialized = true; _track('router:offline-queue:init', { version: VERSION }); return { ok: true, version: VERSION }; }
function cleanup() { for (let i = 0; i < _cleanups.length; i++) { try { _cleanups[i](); } catch (e) { } } _cleanups = []; _state.queue = []; _state.initialized = false; return { ok: true }; }
function healthCheck() { let score = _state.initialized ? 100 : 50; if (!_state.isOnline) score -= 10; if (_state.queue.length > _state.maxSize * 0.8) score -= 15; return { status: score >= 80 ? 'HEALTHY' : score >= 50 ? 'DEGRADED' : 'UNHEALTHY', score: Math.max(0, score), moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'warn' }, isOnline: { ok: _state.isOnline, severity: 'info' }, queueNotFull: { ok: _state.queue.length < _state.maxSize * 0.8, severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, isOnline: _state.isOnline, queueSize: _state.queue.length, maxSize: _state.maxSize, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, cleanup, enqueue, dequeue, peek, clear, getQueue, getSize, processQueue, setOnline, isOnline, healthCheck, info };
export default { MODULE_ID, VERSION, init, cleanup, enqueue, dequeue, peek, clear, getQueue, getSize, processQueue, setOnline, isOnline, healthCheck, info, injectPorts, getPorts };
