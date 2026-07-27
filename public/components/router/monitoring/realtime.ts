// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.monitoring.realtime
// PURPOSE: Router Monitoring - Realtime Stats
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
//   recordNavigation() — exported function
//   getStats() — exported function
//   subscribe() — exported function
//   setWindow() — exported function
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

const MODULE_ID = 'components.router.monitoring.realtime';
const VERSION = '2.2.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; navigations: { path: string; latency: number; timestamp: number }[]; windowMs: number; subscribers: ((stats: Record<string, unknown>) => void)[] } = { initialized: false, navigations: [], windowMs: 60000, subscribers: [] };
const _metrics = { navigations: 0, avgLatency: 0, peakLatency: 0 };

function _emit(eventName: string, data: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }
function _notifySubscribers() { const stats = getStats(); for (let i = 0; i < _state.subscribers.length; i++) { try { _state.subscribers[i](stats); } catch (e) { } } }

function recordNavigation(path: string, latencyMs: number) { const now = Date.now(); _state.navigations.push({ path, latency: latencyMs, timestamp: now }); _state.navigations = _state.navigations.filter(n => now - n.timestamp < _state.windowMs); _metrics.navigations++; if (latencyMs > _metrics.peakLatency) _metrics.peakLatency = latencyMs; const total = _state.navigations.reduce((sum, n) => sum + n.latency, 0); _metrics.avgLatency = _state.navigations.length > 0 ? Math.round(total / _state.navigations.length) : 0; _emit(ROUTER_EVENTS.REALTIME_NAVIGATION, { path, latency: latencyMs }); _notifySubscribers(); return { ok: true }; }

function getStats() { const now = Date.now(); const recent = _state.navigations.filter(n => now - n.timestamp < _state.windowMs); const pathCounts: Record<string, number> = {}; for (let i = 0; i < recent.length; i++) { const p = recent[i].path; pathCounts[p] = (pathCounts[p] || 0) + 1; } const topPaths = Object.keys(pathCounts).sort((a, b) => pathCounts[b] - pathCounts[a]).slice(0, 5).map(p => ({
  path: p,
  count: pathCounts[p]
})); return { windowMs: _state.windowMs, navigationsInWindow: recent.length, avgLatency: _metrics.avgLatency, peakLatency: _metrics.peakLatency, totalNavigations: _metrics.navigations, topPaths }; }

function subscribe(callback: (event: Record<string, unknown>) => void) { if (typeof callback !== 'function') return () => {}; _state.subscribers.push(callback); return () => { const idx = _state.subscribers.indexOf(callback); if (idx >= 0) _state.subscribers.splice(idx, 1); }; }
function setWindow(ms: number) { _state.windowMs = ms; return { ok: true }; }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); if (ctx && ctx.windowMs) _state.windowMs = ctx.windowMs as number; _state.initialized = true; return { ok: true, version: VERSION }; }
function cleanup() { _state.navigations = []; _state.subscribers = []; _state.initialized = false; return { ok: true }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, windowMs: _state.windowMs, navigationsInWindow: _state.navigations.length, subscribersCount: _state.subscribers.length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, cleanup, recordNavigation, getStats, subscribe, setWindow, healthCheck, info };
export default { MODULE_ID, VERSION, init, cleanup, recordNavigation, getStats, subscribe, setWindow, healthCheck, info, injectPorts, getPorts };
