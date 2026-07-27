// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.monitoring.health-monitor
// PURPOSE: Router Monitoring - Health Monitor
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
//   registerCheck() — exported function
//   unregisterCheck() — exported function
//   runChecks() — exported function
//   startMonitoring() — exported function
//   stopMonitoring() — exported function
//   getLastCheck() — exported function
//   isHealthy() — exported function
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

const MODULE_ID = 'components.router.monitoring.health-monitor';
const VERSION = '2.2.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; checks: Record<string, () => Record<string, unknown>>; lastCheck: Record<string, unknown> | null; intervalId: ReturnType<typeof setInterval> | null; intervalMs: number } = { initialized: false, checks: {}, lastCheck: null, intervalId: null, intervalMs: 30000 };
const _metrics = { checksRun: 0, healthy: 0, degraded: 0, unhealthy: 0 };

function _track(eventName: string, payload: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e: any) { } }
function _emit(eventName: string, data: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }

function registerCheck(name: string, checkFn: () => Record<string, unknown>) { if (!name || typeof checkFn !== 'function') return { ok: false, error: 'Invalid arguments' }; _state.checks[name] = checkFn; return { ok: true, name }; }
function unregisterCheck(name: string) { if (_state.checks[name]) { delete _state.checks[name]; return { ok: true }; } return { ok: false, reason: 'Not found' }; }

function runChecks() { _metrics.checksRun++; const results: Record<string, Record<string, unknown>> = {}; let overall = 'HEALTHY'; let score = 100; for (const name in _state.checks) { if (Object.prototype.hasOwnProperty.call(_state.checks, name)) { try { const result = _state.checks[name](); results[name] = result; if (result.status === 'UNHEALTHY') { overall = 'UNHEALTHY'; score -= 30; } else if (result.status === 'DEGRADED' && overall !== 'UNHEALTHY') { overall = 'DEGRADED'; score -= 15; } } catch (e: any) { results[name] = { status: 'UNHEALTHY', error: e.message }; overall = 'UNHEALTHY'; score -= 30; } } } if (overall === 'HEALTHY') _metrics.healthy++; else if (overall === 'DEGRADED') _metrics.degraded++; else _metrics.unhealthy++; _state.lastCheck = { timestamp: Date.now(), results, overall, score: Math.max(0, score) }; _emit(ROUTER_EVENTS.HEALTH_CHECKED, _state.lastCheck); _track('router:health:check', { overall, score }); return _state.lastCheck; }

function startMonitoring(intervalMs: number) { if (_state.intervalId) return { ok: false, reason: 'Already monitoring' }; _state.intervalMs = intervalMs || _state.intervalMs; _state.intervalId = setInterval(runChecks, _state.intervalMs); runChecks(); return { ok: true, intervalMs: _state.intervalMs }; }
function stopMonitoring() { if (_state.intervalId) { clearInterval(_state.intervalId); _state.intervalId = null; } return { ok: true }; }

function getLastCheck() { return _state.lastCheck; }
function isHealthy() { return _state.lastCheck && _state.lastCheck.overall === 'HEALTHY'; }


function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); if (ctx && ctx.intervalMs) _state.intervalMs = ctx.intervalMs as number; if (ctx && ctx.autoStart) startMonitoring(0); _state.initialized = true; return { ok: true, version: VERSION }; }
function cleanup() { stopMonitoring(); _state.checks = {}; _state.lastCheck = null; _state.initialized = false; return { ok: true }; }
function healthCheck() { let score = _state.initialized ? 100 : 50; if (_state.lastCheck && _state.lastCheck.overall === 'UNHEALTHY') score -= 30; return { status: score >= 80 ? 'HEALTHY' : score >= 50 ? 'DEGRADED' : 'UNHEALTHY', score: Math.max(0, score), moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'warn' }, monitoring: { ok: !!_state.intervalId, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, checksCount: Object.keys(_state.checks).length, isMonitoring: !!_state.intervalId, intervalMs: _state.intervalMs, lastCheck: _state.lastCheck, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, cleanup, registerCheck, unregisterCheck, runChecks, startMonitoring, stopMonitoring, getLastCheck, isHealthy, healthCheck, info };
export default { MODULE_ID, VERSION, init, cleanup, registerCheck, unregisterCheck, runChecks, startMonitoring, stopMonitoring, getLastCheck, isHealthy, healthCheck, info, injectPorts, getPorts };
