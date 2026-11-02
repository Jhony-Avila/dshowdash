// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: metrics-polling-manager
// PURPOSE: MetricsPollingManager - Single Source of Truth
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   MetricsPollingManager — exported value
//   CONFIG — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   document.addEventListener
//   window.MetricsPollingManager
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export var MODULE_ID = 'metrics-polling-manager';
export var VERSION = '2.4.0-STRICT-MODE';

var CONFIG: { readonly MIN_INTERVAL_MS: number; readonly DEFAULT_INTERVAL_MS: number; readonly MAX_INTERVAL_MS: number; readonly BACKOFF_MULTIPLIER: number; readonly COOLDOWN_AFTER_ERRORS: number; readonly COOLDOWN_MS: number; readonly REQUEST_TIMEOUT_MS: number; readonly ENDPOINT: string } = Object.freeze({ MIN_INTERVAL_MS: 30000, DEFAULT_INTERVAL_MS: 30000, MAX_INTERVAL_MS: 300000, BACKOFF_MULTIPLIER: 2, COOLDOWN_AFTER_ERRORS: 5, COOLDOWN_MS: 300000, REQUEST_TIMEOUT_MS: 10000, ENDPOINT: '/api/metrics/server.php' });

var Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

var _state = { initialized: false, isRunning: false, paused: false, inFlight: false, inCooldown: false, cooldownUntil: 0, timerId: null as ReturnType<typeof setTimeout> | null, currentInterval: CONFIG.DEFAULT_INTERVAL_MS, abortController: null as AbortController | null, lastData: null as unknown | null, lastFetchTime: 0, lastSuccessTime: 0, lastErrorTime: 0, consecutiveErrors: 0, totalRequests: 0, totalErrors: 0, totalAborts: 0, subscribers: new Map(), startCount: 0 };

var _debug = function() { var cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug; };
var _log = function(level: string, msg: string, data?: unknown) { var logger = _getPort('logger'); if (!logger) return; if (!_debug() && level !== 'error' && level !== 'warn') return; var fn = logger[level] || logger.info; if (typeof fn === 'function') fn.call(logger, '[' + MODULE_ID + ']', msg, data || ''); };

function _clampInterval(interval: number) { return Math.max(CONFIG.MIN_INTERVAL_MS, Math.min(interval, CONFIG.MAX_INTERVAL_MS)); }
function _notifySubscribers(data: Record<string, unknown> | null, error?: string | null) { _state.subscribers.forEach(function(callback: (arg: Record<string, unknown>) => void) { try { callback({ data: data, error: error || null, timestamp: Date.now(), fromCache: false }); } catch (e) {} }); }


function _tick() { if (!_state.isRunning) return; if (typeof document !== 'undefined' && document.hidden) { _scheduleNext(_state.currentInterval); return; } if (typeof navigator !== 'undefined' && !navigator.onLine) { _scheduleNext(_state.currentInterval); return; } if (_state.inFlight) { _scheduleNext(CONFIG.MIN_INTERVAL_MS); return; } if (_state.inCooldown) { if (Date.now() < _state.cooldownUntil) { _scheduleNext(CONFIG.MIN_INTERVAL_MS); return; } _state.inCooldown = false; _state.consecutiveErrors = 0; _state.currentInterval = CONFIG.DEFAULT_INTERVAL_MS; _log('info', 'Cooldown expired, resuming'); } _state.inFlight = true; _state.abortController = new AbortController(); _state.totalRequests++; _state.lastFetchTime = Date.now(); var timeoutId = setTimeout(function() { if (_state.abortController) _state.abortController.abort(); }, CONFIG.REQUEST_TIMEOUT_MS); fetch(CONFIG.ENDPOINT, { method: 'GET', headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }, signal: _state.abortController.signal }).then(function(response) { clearTimeout(timeoutId); if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); }).then(function(data) { _state.lastData = data; _state.lastSuccessTime = Date.now(); _state.consecutiveErrors = 0; _state.currentInterval = CONFIG.DEFAULT_INTERVAL_MS; _notifySubscribers(data); }).catch(function(error) { clearTimeout(timeoutId); if (error.name === 'AbortError') { _state.totalAborts++; } else { _state.totalErrors++; _state.consecutiveErrors++; _state.lastErrorTime = Date.now(); _state.currentInterval = _clampInterval(_state.currentInterval * CONFIG.BACKOFF_MULTIPLIER); if (_state.consecutiveErrors % 5 === 1) { _log('warn', 'Fetch errors: ' + _state.consecutiveErrors + ', backoff: ' + _state.currentInterval + 'ms'); } if (_state.consecutiveErrors >= CONFIG.COOLDOWN_AFTER_ERRORS) { _state.inCooldown = true; _state.cooldownUntil = Date.now() + CONFIG.COOLDOWN_MS; _log('error', 'Circuit breaker: cooldown ' + (CONFIG.COOLDOWN_MS / 1000) + 's'); } _notifySubscribers(null, error.message); } }).finally(function() { _state.inFlight = false; _state.abortController = null; if (_state.isRunning && !_state.inCooldown) { _scheduleNext(_clampInterval(_state.currentInterval)); } }); }

function _scheduleNext(interval: number) { if (_state.timerId !== null) { clearTimeout(_state.timerId); _state.timerId = null; } if (_state.isRunning) { _state.timerId = setTimeout(_tick, _clampInterval(interval)); } }
function _handleVisibilityChange() { if (document.hidden) { _state.paused = true; } else { _state.paused = false; if (_state.isRunning && !_state.inCooldown && !_state.inFlight) _tick(); } }
function _handleOnlineStatus() { if (navigator.onLine && _state.isRunning && !_state.inCooldown && !_state.inFlight) _tick(); }

var MetricsPollingManager = {
  VERSION: VERSION, MODULE_ID: MODULE_ID,

  init: function() { if (_state.initialized) return this; if (typeof document !== 'undefined') { document.addEventListener('visibilitychange', _handleVisibilityChange); } if (typeof window !== 'undefined') { window.addEventListener('online', _handleOnlineStatus); window.addEventListener('offline', _handleOnlineStatus); } _state.initialized = true; _log('info', 'Initialized v' + VERSION); return this; },

  start: function() { if (!_state.initialized) this.init(); if (_state.isRunning) { _log('warn', 'Already running, ignoring start()'); return this; } this.stop(); _state.isRunning = true; _state.startCount++; _state.currentInterval = CONFIG.DEFAULT_INTERVAL_MS; _log('info', 'Started (interval: ' + _state.currentInterval + 'ms)'); _tick(); return this; },
  stop: function() { _state.isRunning = false; if (_state.timerId !== null) { clearTimeout(_state.timerId); _state.timerId = null; } if (_state.abortController) { _state.abortController.abort(); _state.abortController = null; } _state.inFlight = false; return this; },
  subscribe: function(id: string, callback: (...args: unknown[]) => void) { var self = this; if (typeof callback !== 'function') return function() {}; _state.subscribers.set(id, callback); if (_state.lastData) { try { callback({ data: _state.lastData, error: null, timestamp: _state.lastSuccessTime, fromCache: true }); } catch (e) {} } if (_state.subscribers.size === 1 && !_state.isRunning) this.start(); return function() { self.unsubscribe(id); }; },
  unsubscribe: function(id: string) { _state.subscribers.delete(id); if (_state.subscribers.size === 0 && _state.isRunning) this.stop(); },
  refresh: function() { if (_state.inCooldown) return false; if (!_state.inFlight) _tick(); return true; },
  getLastData: function() { return _state.lastData; },
  reset: function() { this.stop(); _state.subscribers.clear(); _state.lastData = null; _state.consecutiveErrors = 0; _state.inCooldown = false; _state.currentInterval = CONFIG.DEFAULT_INTERVAL_MS; },
  status: function() { return { version: VERSION, initialized: _state.initialized, isRunning: _state.isRunning, paused: _state.paused, inFlight: _state.inFlight, inCooldown: _state.inCooldown, cooldownUntil: _state.inCooldown ? new Date(_state.cooldownUntil).toISOString() : null, currentInterval: _state.currentInterval, subscriberCount: _state.subscribers.size, consecutiveErrors: _state.consecutiveErrors, startCount: _state.startCount, stats: { totalRequests: _state.totalRequests, totalErrors: _state.totalErrors, totalAborts: _state.totalAborts }, portsInitialized: Ports.isInitialized() }; },
  info: function() { return this.status(); },
  healthCheck: function() { var healthy = _state.initialized && !_state.inCooldown && _state.consecutiveErrors < 3; return { status: healthy ? 'HEALTHY' : (_state.inCooldown ? 'UNHEALTHY' : 'DEGRADED'), score: healthy ? 100 : (_state.inCooldown ? 0 : 50), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; },
  injectPorts: injectPorts, getPorts: getPorts
};

if (typeof window !== 'undefined') {
  // Strict mode: só expõe window.MetricsPollingManager quando !isStrict()
  if (!isStrict()) {
    window.MetricsPollingManager = MetricsPollingManager;
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, property: 'window.MetricsPollingManager', version: VERSION });
  }
  // DevTools sempre permitido
  if (!window.__dev) window.__dev = {};
  window.__dev.metricsPolling = MetricsPollingManager;
}

export default MetricsPollingManager;
export { MetricsPollingManager, CONFIG as METRICS_POLLING_CONFIG };
