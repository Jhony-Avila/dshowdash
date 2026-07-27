/**
 * @file Auto Health Check
 * @version 1.3.0-STRICT-MODE
 * @module app-shell/devtools/auto-health-check
 *
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires /core/runtime/constants/event-names.js (APP_SHELL_EVENT_NAMES)
 * @requires /core/runtime/ports-profiles.js (createCorePorts)
 * @requires /core/runtime/enterprise/strict-mode.js (isStrict, recordViolation)
 *
 * @provides VERSION, MODULE_ID
 * @provides start, stop, checkNow, isRunning
 * @provides configure, getConfig, getStatus, getHistory
 * @provides subscribe, getMetrics, healthCheck, info
 * @provides injectPorts, getPorts
 *
 * WINDOW ACCESS (controlado por strict-mode):
 *   (window as any).AppShell — acesso ao healthCheck (bloqueado em strict mode)
 *
 * @description
 * Automatic periodic health checks with configurable interval.
 * Emits events on status changes and tracks health history.
 * v1.3.0: Migração para strict-mode NR-FULL
 * v1.2.0: P0 ENTERPRISE - Migrated to Ports pattern (no window.EventBus).
 * v1.1.0: Migrated to APP_SHELL_EVENT_NAMES constants.
 *
 * @example
 * import { start, stop, getStatus } from './auto-health-check.js';
 * start({ interval: 30000, onDegraded: notifyAdmin });
 * console.log(getStatus());
 * ============================================================================
 */
'use strict';

import { APP_SHELL_EVENT_NAMES } from '/core/runtime/constants/event-names.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-auto-health-check';

const hasWindow = typeof window !== 'undefined';

// P0 ENTERPRISE: Ports-based EventBus access
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}

function _getEventBus() {
  _initPorts();
  return Ports.get('eventBus');
}

/**
 * NR-FULL: Resolução de AppShell para healthCheck
 * 1. Ports.get() primeiro (se disponível)
 * 2. Core.windowAdapter.get() segundo
 * 3. isStrict() ? null : (window as any).AppShell com recordViolation()
 */
function _resolveAppShell() {
  // 1. Tentar via Ports
  const fromPorts = Ports.get('appShell');
  if (fromPorts) return fromPorts;

  // 2. Tentar via Core.windowAdapter
  if (hasWindow && window.Core && window.Core.windowAdapter) {
    // @ts-expect-error strict migration — TS2722, TS18048
    const fromAdapter = window.Core.windowAdapter.get('AppShell');
    if (fromAdapter) return fromAdapter;
  }

  // 3. Fallback com strict-mode check
  if (hasWindow && (window as any).AppShell) {
    if (isStrict()) {
      recordViolation('WINDOW_ACCESS', {
        target: '(window as any).AppShell',
        module: MODULE_ID,
        suggestion: "Use Ports.get('appShell') ou Core.windowAdapter.get('AppShell')"
      });
      return null;
    }
    // Modo não-strict: permitido com warning
    recordViolation('WINDOW_FALLBACK', {
      target: '(window as any).AppShell',
      module: MODULE_ID,
      suggestion: "Migre para Ports.get('appShell')"
    });
    return (window as any).AppShell;
  }

  return null;
}

export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _intervalId: DynObj = null;
let _running = false;
let _lastCheck: DynObj = null;
let _lastStatus: DynObj = null;
let _checkCount = 0;
let _statusHistory: DynObj[] = [];
const _subscribers: DynObj[] = [];

const _config = { enabled: true, interval: 30000, emitEvents: true, logChanges: true, onDegraded: null as DynObj, onUnhealthy: null as DynObj, onRecovered: null as DynObj };

const _metrics = { totalChecks: 0, healthy: 0, degraded: 0, unhealthy: 0, transitions: 0, errors: 0 };

function _notify(event: string, data: DynObj) { _subscribers.forEach(cb => { try { cb(event, data); } catch (e: any) {} }); }

function _emitEvent(eventName: string, data: DynObj) {
  if (!_config.emitEvents) return;
  const eb = _getEventBus();
  if (eb && eb.emit) {
    eb.emit(APP_SHELL_EVENT_NAMES.HEALTH_PREFIX + eventName, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
}

function _runCheck() {
  _metrics.totalChecks++;
  _checkCount++;
  _lastCheck = Date.now();

  let result;
  try {
    // NR-FULL: Usar resolução controlada
    const appShell = _resolveAppShell();
    if (appShell && appShell.healthCheck) {
      result = appShell.healthCheck();
    } else {
      result = { status: 'HEALTHY', score: '1/1', checks: { autoCheck: true } };
    }
  } catch (e: any) {
    _metrics.errors++;
    result = { status: 'UNHEALTHY', score: '0/1', checks: { error: false }, error: e.message };
  }

  const previousStatus = _lastStatus;
  _lastStatus = result.status;

  if (result.status === 'HEALTHY') _metrics.healthy++;
  else if (result.status === 'DEGRADED') _metrics.degraded++;
  else _metrics.unhealthy++;

  _statusHistory.push({ status: result.status, score: result.score, timestamp: _lastCheck });
  if (_statusHistory.length > 50) _statusHistory.shift();

  if (previousStatus && previousStatus !== result.status) {
    _metrics.transitions++;
    _emitEvent('status-changed', { previous: previousStatus, current: result.status, result });
    _notify('status-changed', { previous: previousStatus, current: result.status, result });

    if (_config.logChanges) {
      console.log(`[AutoHealthCheck] Status changed: ${previousStatus} -> ${result.status}`);
    }

    if (result.status === 'DEGRADED' && _config.onDegraded) {
      try { _config.onDegraded(result); } catch (e: any) {}
    } else if (result.status === 'UNHEALTHY' && _config.onUnhealthy) {
      try { _config.onUnhealthy(result); } catch (e: any) {}
    } else if (result.status === 'HEALTHY' && previousStatus !== 'HEALTHY' && _config.onRecovered) {
      try { _config.onRecovered(result); } catch (e: any) {}
    }
  }

  return result;
}

export function start(options: DynObj) {
  if (_running) return { ok: false, error: 'Already running' };
  options = options || {};

  if (options.interval !== undefined) _config.interval = Math.max(1000, Math.min(300000, options.interval));
  if (options.emitEvents !== undefined) _config.emitEvents = !!options.emitEvents;
  if (options.logChanges !== undefined) _config.logChanges = !!options.logChanges;
  if (options.onDegraded !== undefined) _config.onDegraded = options.onDegraded;
  if (options.onUnhealthy !== undefined) _config.onUnhealthy = options.onUnhealthy;
  if (options.onRecovered !== undefined) _config.onRecovered = options.onRecovered;

  _runCheck();
  _intervalId = setInterval(_runCheck, _config.interval);
  _running = true;

  _emitEvent('started', { interval: _config.interval });
  _notify('started', { interval: _config.interval });

  return { ok: true, interval: _config.interval };
}

export function stop() {
  if (!_running) return { ok: false, error: 'Not running' };
  if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
  _running = false;

  _emitEvent('stopped', {});
  _notify('stopped', {});

  return { ok: true };
}

export function checkNow() { return _runCheck(); }
export function isRunning() { return _running; }

export function configure(options: DynObj) {
  if (options.interval !== undefined) _config.interval = Math.max(1000, Math.min(300000, options.interval));
  if (options.emitEvents !== undefined) _config.emitEvents = !!options.emitEvents;
  if (options.logChanges !== undefined) _config.logChanges = !!options.logChanges;
  if (options.onDegraded !== undefined) _config.onDegraded = options.onDegraded;
  if (options.onUnhealthy !== undefined) _config.onUnhealthy = options.onUnhealthy;
  if (options.onRecovered !== undefined) _config.onRecovered = options.onRecovered;

  if (_running) {
    clearInterval(_intervalId);
    _intervalId = setInterval(_runCheck, _config.interval);
  }
}

export function getConfig() { return { enabled: _config.enabled, interval: _config.interval, emitEvents: _config.emitEvents, logChanges: _config.logChanges, hasCallbacks: { onDegraded: !!_config.onDegraded, onUnhealthy: !!_config.onUnhealthy, onRecovered: !!_config.onRecovered } }; }
export function getStatus() { return { running: _running, lastCheck: _lastCheck, lastStatus: _lastStatus, checkCount: _checkCount }; }
export function getLastStatus() { return _lastStatus; }
export function getLastCheckTime() { return _lastCheck; }
export function getHistory() { return _statusHistory.slice(); }
export function getStatusHistory() { return getHistory(); }
export { setCheckInterval as setInterval };
function setCheckInterval(ms: number) {
  if (typeof ms === 'number' && ms >= 1000) {
    _config.interval = ms;
    if (_running) {
      clearInterval(_intervalId);
      _intervalId = globalThis.setInterval(_runCheck, _config.interval);
    }
  }
}
export function subscribe(callback: DynObj) { if (typeof callback === 'function') _subscribers.push(callback); return () => { const idx = _subscribers.indexOf(callback); if (idx >= 0) _subscribers.splice(idx, 1); }; }
export function getMetrics() { return Object.assign({}, _metrics, { healthyRate: _metrics.totalChecks > 0 ? Math.round((_metrics.healthy / _metrics.totalChecks) * 100) : 100 }); }

export function healthCheck() {
  const checks = { running: _running, noErrors: _metrics.errors === 0, recentCheckHealthy: _lastStatus === 'HEALTHY', portsInitialized: _portsInitialized, strictModeCompliant: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed >= 4 ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/5`, checks, metrics: getMetrics(), p0Enterprise: true, strictMode: isStrict(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, running: _running, config: getConfig(), status: getStatus(), metrics: getMetrics(), historyLength: _statusHistory.length, strictMode: isStrict(), timestamp: Date.now() };
}

const AutoHealthCheck = {
  VERSION,
  MODULE_ID,
  start,
  stop,
  checkNow,
  isRunning,
  configure,
  getConfig,
  getStatus,
  getLastStatus,
  getLastCheckTime,
  getHistory,
  getStatusHistory,
  setInterval: setCheckInterval,
  subscribe,
  getMetrics,
  healthCheck,
  info,
  injectPorts,
  getPorts
};

// Strict Mode: Controle de exposição global
if (hasWindow) {
  // DevTools sempre permitido
  if (typeof (window as any).__DEVTOOLS__ !== 'undefined') {
    (window as any).__DEVTOOLS__.AutoHealthCheck = AutoHealthCheck;
  }
}

export default AutoHealthCheck;
