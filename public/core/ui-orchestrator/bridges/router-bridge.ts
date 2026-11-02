// UI Orchestrator - Router Navigate Bridge
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 2.3.0-ENTERPRISE
// @changelog v2.3.0-ENTERPRISE - ES6 modernization (const/let, arrow functions, template literals, optional chaining)
// P18EC: Events Contracts Migration
// P17WI: PortsFactory/PortsProfiles migration
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

export const VERSION = '2.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.ui-orchestrator.bridges.router-bridge';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _initialized = false;
let _cleanup: (() => void) | null = null;
const _metrics = { received: 0, executed: 0, skipped: 0, hardNavs: 0, errors: 0 };

const _log = (level: string, message: string, data: Record<string, unknown> = {}) => { const logger = _getPort('logger') as Record<string, ((...a: unknown[]) => void) | undefined> | null; const fn = logger?.[level]; if (typeof fn === 'function') fn(`[${MODULE_ID}] ${message}`, data); };
const _track = (eventName: string, payload: Record<string, unknown>) => { try { const tk = _getPort('telemetry') as Record<string, unknown> | null; const trackFn = tk?.['track'] as ((...a: unknown[]) => void) | undefined; if (typeof trackFn === 'function') trackFn(eventName, { moduleId: MODULE_ID, ...payload }); } catch (e) { } };

const _emitHardNav = (path: string, reason: string, source: string) => { const eb = _getPort('eventBus') as Record<string, unknown> | null; const emitFn = eb?.['emit'] as ((...a: unknown[]) => void) | undefined; if (typeof emitFn === 'function') emitFn(UI_EVENTS.HARD_NAV, { path, reason, source, allowedByContract: true, timestamp: Date.now() }); _track('navigation:hard-nav', { path, reason, source }); _metrics.hardNavs++; };

const _handleNavigateRequest = (data: unknown) => {
  _metrics.received++;
  const d = data as Record<string, unknown>;
  const path = (d?.path || d?.route) as string | undefined;
  const source = (d?.source || 'unknown') as string;
  if (!path) { _log('warn', 'Navigate request without path', { data }); _metrics.skipped++; return; }
  if (source === 'router-global' || source === MODULE_ID || d?.__viaBridge) { _log('debug', 'Skipping to avoid loop', { path, source }); _metrics.skipped++; return; }
  try {
    const router = _getPort('router') as Record<string, unknown> & { navigate?: (path: string, opts?: Record<string, unknown>) => void } | null;
    if (router?.navigate) { router.navigate(path, { ...(d?.options as Record<string, unknown>), source: 'router-bridge', __viaBridge: true }); _metrics.executed++; _log('info', 'Navigate executed via RouterGlobal', { path, source }); _track('navigation:bridge:success', { path, source, via: 'RouterGlobal' }); }
    else { _emitHardNav(path, 'RouterGlobal unavailable - fallback to hash', source); const hashPath = path.charAt(0) === '#' ? path : `#${path.charAt(0) === '/' ? path : `/${path}`}`; if (typeof window !== 'undefined') window.location.hash = hashPath; _metrics.executed++; _log('info', 'Navigate executed via hash change (fallback)', { path }); _track('navigation:bridge:success', { path, source, via: 'hash-fallback' }); }
  } catch (error) { _metrics.errors++; _log('error', 'Navigate failed', { path, error: (error as Error).message }); _track('navigation:bridge:error', { path, error: (error as Error).message }); }
};

export const init = (options: Record<string, unknown> = {}) => {
  if (_initialized) return { success: true, alreadyInitialized: true };
  _initPorts();
  if (options.ports) injectPorts(options.ports as Record<string, unknown>);
  const eb = _getPort('eventBus') as { on?: (event: string, handler: (data: unknown) => void) => (() => void) } | null;
  if (!eb?.on) { _log('error', 'EventBus not available'); return { success: false, error: 'EventBus required' }; }
  _cleanup = eb.on(ROUTER_EVENTS.NAVIGATE, _handleNavigateRequest);
  _initialized = true;
  _log('info', 'Router Bridge initialized (P18EC compliant)');
  _track('router-bridge:init', { version: VERSION });
  const tk = _getPort('telemetry') as Record<string, unknown> | null;
  const registerFn = tk?.['register'] as ((...a: unknown[]) => void) | undefined;
  if (typeof registerFn === 'function') registerFn({ id: MODULE_ID, version: VERSION, healthCheck, info });
  return { success: true, version: VERSION };
};

export const destroy = () => { if (_cleanup && typeof _cleanup === 'function') { _cleanup(); _cleanup = null; } _initialized = false; _log('info', 'Router Bridge destroyed'); };

export const healthCheck = () => { const issues = []; let score = 100; if (!_initialized) { issues.push({ code: 'NOT_INIT', severity: 'crit', message: 'Not initialized' }); score -= 50; } if (!_getPort('eventBus')) { issues.push({ code: 'NO_EVENTBUS', severity: 'warn', message: 'EventBus not available' }); score -= 20; } if (!_getPort('router')) { issues.push({ code: 'NO_ROUTER', severity: 'warn', message: 'RouterGlobal not available (will use fallback)' }); score -= 10; } if (_metrics.errors > 5) { issues.push({ code: 'HIGH_ERRORS', severity: 'warn', message: `${_metrics.errors} errors` }); score -= 10; } const status = score >= 80 ? 'HEALTHY' : score >= 50 ? 'DEGRADED' : 'UNHEALTHY'; return { status, score: Math.max(0, score), moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _initialized, severity: 'crit' }, hasEventBus: { ok: !!_getPort('eventBus'), severity: 'warn' }, hasRouter: { ok: !!_getPort('router'), severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, issues, metrics: _metrics }; };

export const getMetrics = () => ({ ..._metrics });
export const info = () => ({ version: VERSION, moduleId: MODULE_ID, initialized: _initialized, metrics: _metrics, listenedEvents: [ROUTER_EVENTS.NAVIGATE], portsInitialized: Ports.isInitialized() });

export default { VERSION, MODULE_ID, init, destroy, healthCheck, getMetrics, info, injectPorts, getPorts };
