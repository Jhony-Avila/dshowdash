// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.6.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.telemetry-kernel
// PURPOSE: Enterprise Observability System - centralized telemetry hub
// ───────────────────────────────────────────────────────────────
// @contract LIFECYCLE - init/cleanup/destroy/shutdown
// @contract REGISTRY - register/unregister module descriptors
// @contract TRACKING - track events with severity and payload
// @contract COLLECTION - collect/summary health from all modules
// @contract PORTS - Integration via PortsFactory/PortsProfiles
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TELEMETRY_EVENTS from /core/runtime/events/index.js
//   createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   init(), cleanup(), destroy(), shutdown(),
//   register(), unregister(), track(),
//   collect(), summary(), getEvents(), listModules(),
//   exportState(), healthCheck(), info(),
//   injectPorts(), getPorts()
// GLOBALS: window.TelemetryKernel
// @changelog v2.6.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.5.0-STRICT-MODE: Strict mode integration
// @changelog v2.4.0-ENTERPRISE: ES6 modernization
// @changelog v2.3.0-ENTERPRISE: Added destroy/shutdown for complete lifecycle
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TELEMETRY_EVENTS } from '/core/runtime/events/catalog/telemetry.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'components.telemetry-kernel';
export const VERSION = '2.6.0-P2-ENTERPRISE';

const SEVERITY = { DEBUG: 'debug', INFO: 'info', WARN: 'warn', ERROR: 'error', CRITICAL: 'critical' };

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
const getPorts = () => Ports.snapshot();

type _ModuleEntry = { id: string; version: string; healthCheck: (() => unknown) | null; info: (() => unknown) | null; metrics: unknown; registeredAt: number; updatedAt: number; lastHealth: unknown; lastHealthTime: number | null; eventCount: number };
const _state: { initialized: boolean; modules: Map<string, _ModuleEntry>; events: unknown[]; eventIdCounter: number; maxEvents: number; droppedEvents: number; initTime: number | null; errors: unknown[]; metrics: { tracks: number; collects: number; registers: number; unregisters: number } } = { initialized: false, modules: new Map(), events: [], eventIdCounter: 0, maxEvents: 1000, droppedEvents: 0, initTime: null, errors: [], metrics: { tracks: 0, collects: 0, registers: 0, unregisters: 0 } };

const _envelope = (ok: boolean, data?: unknown, errors?: unknown[]) => ({ ok, data: data || null, meta: { moduleId: MODULE_ID, version: VERSION, timestamp: new Date().toISOString() }, errors: errors || [] });

const _health = (status: string, score: number, checks?: Record<string, unknown>, issues?: unknown[]) => ({ status, score, moduleId: MODULE_ID, version: VERSION, checks: checks || {}, issues: issues || [], metrics: { modulesCount: _state.modules.size, eventsCount: _state.events.length, droppedEvents: _state.droppedEvents, uptime: _state.initTime ? Date.now() - _state.initTime : 0 }, timestamp: new Date().toISOString() });

const _genEventId = () => `evt-${++_state.eventIdCounter}-${Date.now().toString(36)}`;

const init = (ctx?: { ports?: { eventBus?: unknown } }) => {
  if (_state.initialized) return _envelope(true, { alreadyInitialized: true });
  try {
    _initPorts();
    if (ctx?.ports?.eventBus) Ports.inject({ eventBus: ctx.ports.eventBus });
    _state.initialized = true;
    _state.initTime = Date.now();
    register({ id: MODULE_ID, version: VERSION, healthCheck, info });
    const eb = _getPort('eventBus');
    eb?.emit?.(TELEMETRY_EVENTS.KERNEL_READY, { version: VERSION });
    return _envelope(true, { initialized: true, version: VERSION });
  } catch (e: any) {
    _state.errors.push({ code: 'INIT_ERROR', message: e.message, timestamp: Date.now() });
    return _envelope(false, null, [{ code: 'INIT_ERROR', message: e.message }]);
  }
};

const register = (moduleDescriptor: { id?: string; version?: string; healthCheck?: (() => unknown) | null; info?: (() => unknown) | null; metrics?: unknown }) => {
  if (!moduleDescriptor?.id) return _envelope(false, null, [{ code: 'INVALID_MODULE', message: 'Module must have id' }]);
  const { id } = moduleDescriptor;
  const existing = _state.modules.get(id);
  _state.modules.set(id, { id, version: moduleDescriptor.version || '0.0.0', healthCheck: moduleDescriptor.healthCheck || null, info: moduleDescriptor.info || null, metrics: moduleDescriptor.metrics || null, registeredAt: existing?.registeredAt || Date.now(), updatedAt: Date.now(), lastHealth: null, lastHealthTime: null, eventCount: existing?.eventCount || 0 });
  _state.metrics.registers++;
  track('module:registered', { moduleId: id, version: moduleDescriptor.version }, SEVERITY.INFO, id);
  return _envelope(true, { moduleId: id, registered: true });
};

const unregister = (moduleId: string) => {
  if (!_state.modules.has(moduleId)) return _envelope(false, null, [{ code: 'NOT_FOUND', message: `Module not found: ${moduleId}` }]);
  _state.modules.delete(moduleId);
  _state.metrics.unregisters++;
  track('module:unregistered', { moduleId }, SEVERITY.INFO);
  return _envelope(true, { moduleId, unregistered: true });
};

const track = (eventName: string, payload?: Record<string, unknown>, severity?: string, sourceModuleId?: string) => {
  const eventId = _genEventId();
  const sev = severity || SEVERITY.INFO;
  const source = sourceModuleId || 'unknown';
  const mod = _state.modules.get(source);
  const event = { eventId, eventName, severity: sev, source: { moduleId: source, version: mod?.version || null }, payload: payload || {}, timestamp: Date.now(), isoTime: new Date().toISOString(), correlationId: payload?.correlationId || null, runId: payload?.runId || null };
  if (_state.events.length >= _state.maxEvents) { _state.events.shift(); _state.droppedEvents++; }
  _state.events.push(event);
  _state.metrics.tracks++;
  if (mod) mod.eventCount++;
  try { const eb = _getPort('eventBus'); eb?.emit?.(TELEMETRY_EVENTS.EVENT, event); } catch (e: any) {}
  return _envelope(true, { eventId, tracked: true });
};

const collect = () => {
  const results = [];
  let totalScore = 0;
  let moduleCount = 0;
  let healthyCount = 0;
  let degradedCount = 0;
  let unhealthyCount = 0;
  const issues = [];
  const startTime = Date.now();
  for (const [id, mod] of _state.modules) {
    type _HealthResult = { status?: string; score?: number | null; checks?: unknown; issues?: Array<{ code?: string; severity?: string; message?: string; evidence?: unknown }>; moduleId?: string; error?: string; message?: string } | null;
    let health: _HealthResult = null;
    if (typeof mod.healthCheck === 'function') {
      try {
        health = mod.healthCheck() as _HealthResult;
        mod.lastHealth = health;
        mod.lastHealthTime = Date.now();
        if (health) {
          const score = typeof health.score === 'number' ? health.score : 0;
          totalScore += score;
          moduleCount++;
          const st = (health.status || '').toUpperCase();
          if (st === 'HEALTHY' || st === 'OK') healthyCount++;
          else if (st === 'DEGRADED') degradedCount++;
          else if (st === 'UNHEALTHY' || st === 'ERROR') unhealthyCount++;
          // @ts-expect-error strict migration — TS18048
          if (health.issues?.length > 0) {
            // @ts-expect-error strict migration — TS18048
            for (const issue of health.issues) {
              issues.push({ moduleId: id, code: issue.code || 'UNKNOWN', severity: issue.severity || 'warn', message: issue.message || 'Unknown issue', evidence: issue.evidence || null });
            }
          }
        }
      } catch (e: any) {
        health = { status: 'UNHEALTHY', score: 0, moduleId: id, error: (e as Error).message };
        unhealthyCount++;
        issues.push({ moduleId: id, code: 'HEALTH_ERROR', severity: 'crit', message: `healthCheck() failed: ${(e as Error).message}` });
      }
    } else {
      health = { status: 'UNKNOWN', score: null, moduleId: id, message: 'No healthCheck function' };
    }
    results.push({ moduleId: id, version: mod.version, status: health?.status || 'UNKNOWN', score: typeof health?.score === 'number' ? health.score : null, checks: health?.checks || null, issues: health?.issues || [] });
  }
  const avgScore = moduleCount > 0 ? Math.round(totalScore / moduleCount) : 0;
  const durationMs = Date.now() - startTime;
  _state.metrics.collects++;
  let globalStatus = 'HEALTHY';
  if (unhealthyCount > 0) globalStatus = 'UNHEALTHY';
  else if (degradedCount > 0) globalStatus = 'DEGRADED';
  return _envelope(true, { global: { status: globalStatus, score: avgScore, modulesTotal: _state.modules.size, modulesHealthy: healthyCount, modulesDegraded: degradedCount, modulesUnhealthy: unhealthyCount }, modules: results, issues, collectionMeta: { durationMs, timestamp: new Date().toISOString() } });
};

const summary = () => {
  const collected = collect();
  if (!collected.ok) return collected;
  const { data } = collected;
  const d = data as { global: { status: string; score: number; modulesTotal: number; modulesHealthy: number; modulesDegraded: number; modulesUnhealthy: number }; issues: Array<{ severity: string }> };
  return _envelope(true, { status: d.global.status, score: d.global.score, modules: d.global.modulesTotal, healthy: d.global.modulesHealthy, degraded: d.global.modulesDegraded, unhealthy: d.global.modulesUnhealthy, issues: d.issues.length, criticalIssues: d.issues.filter((i: { severity: string }) => i.severity === 'crit').length, topIssues: d.issues.slice(0, 5), timestamp: new Date().toISOString() });
};

const getEvents = (limit?: number, filter?: { severity?: string; moduleId?: string; eventName?: string }) => {
  const n = limit || 100;
  let events = _state.events;
  if (filter) {
    if (filter.severity) events = events.filter((e) => (e as Record<string, unknown>)['severity'] === filter.severity);
    if (filter.moduleId) events = events.filter((e) => ((e as Record<string, unknown>)['source'] as Record<string, unknown>)['moduleId'] === filter.moduleId);
    if (filter.eventName) events = events.filter((e) => ((e as Record<string, unknown>)['eventName'] as string).includes(filter.eventName as string));
  }
  const recent = events.slice(-n);
  return _envelope(true, { events: recent, count: recent.length, total: _state.events.length, dropped: _state.droppedEvents });
};

const listModules = () => {
  const list = [];
  for (const [id, mod] of _state.modules) {
    list.push({ id, version: mod.version, hasHealthCheck: !!mod.healthCheck, hasInfo: !!mod.info, hasMetrics: !!mod.metrics, registeredAt: mod.registeredAt, eventCount: mod.eventCount, lastHealthStatus: (mod.lastHealth as { status?: string } | null)?.status || 'unknown', lastHealthTime: mod.lastHealthTime });
  }
  return _envelope(true, { modules: list, count: list.length });
};

const exportState = () => _envelope(true, { modules: listModules().data, recentEvents: getEvents(50).data, health: summary().data, metrics: _state.metrics, uptime: _state.initTime ? Date.now() - _state.initTime : 0, exportedAt: new Date().toISOString() });

const healthCheck = () => {
  const checks = { initialized: { ok: _state.initialized, severity: 'crit' }, modulesRegistered: { ok: _state.modules.size > 0, severity: 'warn' }, eventsBufferOk: { ok: _state.events.length < _state.maxEvents * 0.9, severity: 'info' }, noDroppedEvents: { ok: _state.droppedEvents === 0, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'warn' } };
  const issues = [];
  let score = 100;
  if (!_state.initialized) { issues.push({ code: 'NOT_INITIALIZED', severity: 'crit', message: 'Kernel not initialized' }); score -= 50; }
  if (_state.modules.size === 0) { issues.push({ code: 'NO_MODULES', severity: 'warn', message: 'No modules registered' }); score -= 10; }
  if (_state.events.length >= _state.maxEvents * 0.9) { issues.push({ code: 'EVENTS_NEAR_LIMIT', severity: 'info', message: `Events buffer at ${Math.round(_state.events.length / _state.maxEvents * 100)}%` }); score -= 5; }
  if (_state.droppedEvents > 0) { issues.push({ code: 'EVENTS_DROPPED', severity: 'warn', message: `${_state.droppedEvents} events dropped` }); score -= 10; }
  if (_state.errors.length > 0) { issues.push({ code: 'HAS_ERRORS', severity: 'warn', message: `${_state.errors.length} errors recorded` }); score -= 5; }
  const status = score >= 80 ? 'HEALTHY' : score >= 50 ? 'DEGRADED' : 'UNHEALTHY';
  const health = _health(status, Math.max(0, score), checks, issues);
  (health as any).strictMode = isStrict();
  return health;
};

const info = () => _envelope(true, { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, modulesCount: _state.modules.size, eventsCount: _state.events.length, droppedEvents: _state.droppedEvents, maxEvents: _state.maxEvents, uptime: _state.initTime ? Date.now() - _state.initTime : 0, portsInitialized: Ports.isInitialized(), metrics: _state.metrics, timestamp: Date.now() });

const cleanup = () => { _state.modules.clear(); _state.events = []; _state.errors = []; _state.initialized = false; _state.initTime = null; _state.droppedEvents = 0; return _envelope(true, { cleanedUp: true }); };
const destroy = () => cleanup();
const shutdown = () => cleanup();

if (typeof window !== 'undefined') {
  // DevTools sempre permitido
  window.__dev = window.__dev || {};
  window.__dev.TelemetryKernel = { MODULE_ID, VERSION, SEVERITY, init, cleanup, destroy, shutdown, register, unregister, track, collect, summary, getEvents, listModules, exportState, healthCheck, info, injectPorts, getPorts };

  // Exposição global só em modo não-strict
  if (!isStrict()) {
    (window as any).TelemetryKernel = { MODULE_ID, VERSION, SEVERITY, init, cleanup, destroy, shutdown, register, unregister, track, collect, summary, getEvents, listModules, exportState, healthCheck, info, injectPorts, getPorts };
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: 'window.TelemetryKernel' });
  }
}

export { SEVERITY, init, cleanup, destroy, shutdown, register, unregister, track, collect, summary, getEvents, listModules, exportState, healthCheck, info, injectPorts, getPorts };
export default { MODULE_ID, VERSION, init, cleanup, destroy, shutdown, register, unregister, track, collect, summary, getEvents, listModules, exportState, healthCheck, info, injectPorts, getPorts };
