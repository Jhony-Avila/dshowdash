// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05.scheduler.refresh
// PURPOSE: Panel-05 Refresh Scheduler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   start() — exported function
//   stop() — exported function
//   pause() — exported function
//   resume() — exported function
//   refresh() — exported function
//   isPaused() — exported function
//   isRefreshing() — exported function
//   isRunning() — exported function
//   getCountdown() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   ... and 3 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventKey
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'panel-05.scheduler.refresh';
const VERSION = '9.3.0-P2-ENTERPRISE';

const SCHEDULER_EVENTS = {
  STARTED: 'panel-05:scheduler:started',
  STOPPED: 'panel-05:scheduler:stopped',
  PAUSED: 'panel-05:scheduler:paused',
  RESUMED: 'panel-05:scheduler:resumed',
  REFRESH_START: 'panel-05:scheduler:refresh:start',
  REFRESH_DONE: 'panel-05:scheduler:refresh:done',
  REFRESH_ERROR: 'panel-05:scheduler:refresh:error'
};

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _countdownId: ReturnType<typeof setInterval> | null = null;
let _countdown = 0;
let _interval = 60000;
let _onTick: ((seconds: number | null) => void) | null = null;
let _onRefresh: (() => unknown) | null = null;
let _paused = false;
let _refreshing = false;
let _startedAt: number | null = null;

let _metrics: { refreshes: number; errors: number; avgRefreshTime: number; lastRefresh: number | null; manualRefreshes: number } = { refreshes: 0, errors: 0, avgRefreshTime: 0, lastRefresh: null, manualRefreshes: 0 };

const _debug = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug ? true : false; };

const _log = function(level: string, ...rest: unknown[]) {
  const args = rest;
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { if (logger.error) logger.error(prefix, ...args); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(prefix, ...args); return; }
  if (level === 'info') { if (logger.info) logger.info(prefix, ...args); return; }
  if (_debug() && logger.debug) logger.debug(prefix, ...args);
};

function _emitEvent(eventKey: string, data: Record<string, unknown> = {}) {
  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) { eventBus.emit(eventKey, Object.assign({ moduleId: MODULE_ID, timestamp: Date.now() }, data)); }
}

function start(options: Record<string, unknown> = {}) {
  stop(); _initPorts();
  _interval = (options.interval as number) || 60000; _onTick = (options.onTick as ((seconds: number | null) => void)) || null; _onRefresh = (options.onRefresh as (() => unknown)) || null; _paused = false; _refreshing = false; _startedAt = Date.now();
  const seconds = Math.floor(_interval / 1000); _countdown = seconds;
  if (_onTick) _onTick(_countdown);
  _countdownId = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;  // aba oculta: nao conta nem busca
    if (_paused || _refreshing) return;
    _countdown--;
    if (_onTick) _onTick(_countdown);
    if (_countdown <= 0) { _countdown = seconds; triggerRefresh('auto'); }
  }, 1000);
  _emitEvent(SCHEDULER_EVENTS.STARTED, { interval: _interval });
  _log('info', `Started: ${seconds}s interval`);
}

function triggerRefresh(trigger: string = 'auto') {
  if (_refreshing) { _log('warn', 'Refresh already in progress, skipping'); return Promise.resolve({ ok: false, reason: 'already-refreshing' }); }
  if (!_onRefresh) return Promise.resolve({ ok: false, reason: 'no-callback' });
  _refreshing = true;
  const startTime = performance.now();
  _emitEvent(SCHEDULER_EVENTS.REFRESH_START, { trigger });
  // @ts-expect-error strict migration — TS2721
  return Promise.resolve().then(() => _onRefresh()).then(() => {
    const duration = performance.now() - startTime;
    _metrics.refreshes++; _metrics.lastRefresh = Date.now(); _metrics.avgRefreshTime = (_metrics.avgRefreshTime * (_metrics.refreshes - 1) + duration) / _metrics.refreshes;
    if (trigger === 'manual') _metrics.manualRefreshes++;
    _emitEvent(SCHEDULER_EVENTS.REFRESH_DONE, { trigger, duration });
    return { ok: true, duration };
  }).catch(e => { _metrics.errors++; _emitEvent(SCHEDULER_EVENTS.REFRESH_ERROR, { trigger, error: e.message }); _log('error', 'Refresh error:', e); return { ok: false, error: e.message }; }).then(result => { _refreshing = false; _countdown = Math.floor(_interval / 1000); if (_onTick) _onTick(_countdown); return result; });
}

function refresh() { _countdown = Math.floor(_interval / 1000); if (_onTick) _onTick(_countdown); return triggerRefresh('manual'); }

function pause() { _paused = true; if (_onTick) _onTick(null); _emitEvent(SCHEDULER_EVENTS.PAUSED); }
function resume() { _paused = false; if (_onTick) _onTick(_countdown); _emitEvent(SCHEDULER_EVENTS.RESUMED); }
function isPaused() { return _paused; }
function stop() { if (_countdownId) { clearInterval(_countdownId); _countdownId = null; _emitEvent(SCHEDULER_EVENTS.STOPPED); } _countdown = 0; _paused = false; _refreshing = false; _onTick = null; _onRefresh = null; _startedAt = null; }
function isRefreshing() { return _refreshing; }
function isRunning() { return _countdownId !== null; }
function getCountdown() { return _countdown; }
function getMetrics() { return Object.assign({}, _metrics, { uptime: _startedAt ? Date.now() - _startedAt : 0, errorRate: _metrics.refreshes > 0 ? (_metrics.errors / _metrics.refreshes) : 0 }); }
function resetMetrics() { _metrics = { refreshes: 0, errors: 0, avgRefreshTime: 0, lastRefresh: null as number | null, manualRefreshes: 0 }; return { ok: true }; }

function info() { return { moduleId: MODULE_ID, version: VERSION, running: _countdownId !== null, paused: _paused, refreshing: _refreshing, countdown: _countdown, interval: _interval, metrics: getMetrics() }; }

function healthCheck() {
  const metrics = getMetrics();
  const checks = { running: _countdownId !== null || !_startedAt, notStuck: !_refreshing || (Date.now() - (_metrics.lastRefresh || Date.now())) < 120000, lowErrorRate: metrics.errorRate < 0.3, recentActivity: !_startedAt || !_metrics.lastRefresh || (Date.now() - _metrics.lastRefresh) < _interval * 3 };
  const values = Object.values(checks); const passed = values.filter(Boolean).length; const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, metrics, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}

export { start, stop, pause, resume, refresh, isPaused, isRefreshing, isRunning, getCountdown, getMetrics, resetMetrics, info, healthCheck, SCHEDULER_EVENTS, VERSION, MODULE_ID };
export default { start, stop, pause, resume, refresh, isPaused, isRefreshing, isRunning, getCountdown, getMetrics, resetMetrics, info, healthCheck, injectPorts, getPorts, SCHEDULER_EVENTS, VERSION, MODULE_ID };
