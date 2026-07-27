// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-TIMEOUT-TUNING)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.api.fallback-sources
// PURPOSE: Fallback Sources - Ticker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//   FallbackSourceManager — exported class
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'abort'
// WINDOW ACCESS:
//   (none)
//
// @changelog
//   1.3.0-TIMEOUT-TUNING: Primary source timeout 8s -> 15s, news-only 6s -> 10s,
//     cached 3s -> 5s. Reduces false-positive WARN logs when API response is slow
//     (observed 3.6s avg, peaks above 8s). Static fallback unchanged at 2s.
//   1.2.0-P17WI: Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export var VERSION = '1.3.0-TIMEOUT-TUNING';
export var MODULE_ID = 'ticker.api.fallback-sources';

var hasWindow = typeof window !== 'undefined';
var Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

var _log = function(level: string, ...extraArgs: any[]) {
  var args = Array.prototype.slice.call(arguments, 1);
  var logger = _getPort('logger');
  if (logger && typeof logger[level] === 'function') {
    logger[level].apply(logger, ['[' + MODULE_ID + ']'].concat(args));
  }
};

var SOURCES = [
  { id: 'primary',   name: 'DShowDash API',   url: '/api/news/get_ticker_data.php',          priority: 1, timeout: 15000, enabled: true },
  { id: 'news-only', name: 'News Only API',   url: '/api/news/get_news.php',                 priority: 2, timeout: 10000, enabled: true },
  { id: 'cached',    name: 'Cached Data',     url: '/api/news/cached.json',                  priority: 3, timeout: 5000,  enabled: true },
  { id: 'static',    name: 'Static Fallback', url: '/components/ticker/data/fallback.json',  priority: 4, timeout: 2000,  enabled: true }
];

export function FallbackSourceManager(this: any, options?: Record<string, unknown>) {
  if (options === undefined) options = {};
  this.sources = (options as any).sources || SOURCES.map(function(s: Record<string, unknown>) { return Object.assign({}, s); });
  this.maxRetries = options.maxRetries || 2;
  this.retryDelay = options.retryDelay || 1000;
  this._lastSuccessfulSource = null;
  this._sourceHealth = new Map();
  this._metrics = { attempts: 0, successes: 0, failures: 0, fallbacks: 0 };
  var self = this;
  this.sources.forEach(function(s: Record<string, any>) {
    self._sourceHealth.set(s.id, { failures: 0, lastSuccess: null, lastFailure: null });
  });
}

FallbackSourceManager.prototype.fetch = function(signal?: AbortSignal) {
  var self = this;
  self._metrics.attempts++;
  var sortedSources = self._getSortedSources();

  return (function tryNext(index) {
    if (index >= sortedSources.length) {
      self._metrics.failures++;
      return Promise.reject(new Error('All sources failed'));
    }
    var source = sortedSources[index];
    if (!source.enabled) return tryNext(index + 1);

    return self._fetchFromSource(source, signal || null).then(function(result: unknown) {
      self._onSourceSuccess(source);
      self._metrics.successes++;
      if (source.priority > 1) self._metrics.fallbacks++;
      return { data: result, source: source.id, isFallback: source.priority > 1 };
    }).catch(function(error: unknown) {
      self._onSourceFailure(source, error);
      _log('warn', 'Source failed: ' + source.name, { error: (error as Error).message });
      if (signal && signal.aborted) return Promise.reject(error);
      return tryNext(index + 1);
    });
  })(0);
};

FallbackSourceManager.prototype._fetchFromSource = function(source: Record<string, unknown>, signal: AbortSignal | null) {
  var controller = new AbortController();
  var timeoutId = setTimeout(function() { controller.abort(); }, source.timeout as number);
  var combinedSignal = signal ? this._combineSignals(signal, controller.signal) : controller.signal;

  return fetch(source.url as string, {
    signal: combinedSignal,
    headers: { 'Content-Type': 'application/json' }
  }).then(function(response) {
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  }).then(function(data) {
    if (data.ok === false) throw new Error(data.error || 'Invalid response');
    return Array.isArray(data) ? data : (data.data || data.items || []);
  }).catch(function(error) {
    clearTimeout(timeoutId);
    throw error;
  });
};

FallbackSourceManager.prototype._combineSignals = function(signal1: AbortSignal, signal2: AbortSignal) {
  var controller = new AbortController();
  var abort = function() { controller.abort(); };
  if (signal1.aborted || signal2.aborted) {
    controller.abort();
    return controller.signal;
  }
  signal1.addEventListener('abort', abort, { once: true });
  signal2.addEventListener('abort', abort, { once: true });
  return controller.signal;
};

FallbackSourceManager.prototype._getSortedSources = function() {
  var self = this;
  return this.sources.slice().sort(function(a: Record<string, unknown>, b: Record<string, unknown>) {
    var healthA = self._sourceHealth.get(a.id);
    var healthB = self._sourceHealth.get(b.id);
    if (a.id === self._lastSuccessfulSource) return -1;
    if (b.id === self._lastSuccessfulSource) return 1;
    if (healthA.failures !== healthB.failures) return healthA.failures - healthB.failures;
    return (a.priority as number) - (b.priority as number);
  });
};

FallbackSourceManager.prototype._onSourceSuccess = function(source: Record<string, unknown>) {
  var health = this._sourceHealth.get(source.id);
  health.failures = 0;
  health.lastSuccess = Date.now();
  this._lastSuccessfulSource = source.id;
};

FallbackSourceManager.prototype._onSourceFailure = function(source: Record<string, unknown>, error: unknown) {
  var health = this._sourceHealth.get(source.id);
  health.failures++;
  health.lastFailure = Date.now();
  health.lastError = (error as Error).message;
};

FallbackSourceManager.prototype.enableSource = function(id: string) {
  var source = this.sources.find(function(s: Record<string, unknown>) { return s.id === id; });
  if (source) source.enabled = true;
};

FallbackSourceManager.prototype.disableSource = function(id: string) {
  var source = this.sources.find(function(s: Record<string, unknown>) { return s.id === id; });
  if (source) source.enabled = false;
};

FallbackSourceManager.prototype.resetSourceHealth = function(id?: string) {
  if (id) {
    var health = this._sourceHealth.get(id);
    if (health) { health.failures = 0; health.lastSuccess = null; health.lastFailure = null; }
  } else {
    this._sourceHealth.forEach(function(health: Record<string, unknown>) {
      health.failures = 0; health.lastSuccess = null; health.lastFailure = null;
    });
  }
};

FallbackSourceManager.prototype.getSourceStatus = function() {
  var self = this;
  return this.sources.map(function(source: Record<string, unknown>) {
    return Object.assign({}, source, {
      health: self._sourceHealth.get(source.id),
      isLastSuccessful: source.id === self._lastSuccessfulSource
    });
  });
};

FallbackSourceManager.prototype.healthCheck = function() {
  var logger = _getPort('logger');
  var enabledSources = this.sources.filter(function(s: Record<string, unknown>) { return s.enabled; });
  var self = this;
  var healthySources = enabledSources.filter(function(s: Record<string, unknown>) {
    var h = self._sourceHealth.get(s.id);
    return (h ? h.failures : 0) < 3;
  });
  var checks = {
    hasEnabledSources: enabledSources.length > 0,
    hasHealthySources: healthySources.length > 0,
    loggerReady: !!logger,
    portsInitialized: Ports.isInitialized()
  };
  var passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 4 ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed + '/4',
    enabledSources: enabledSources.length,
    healthySources: healthySources.length,
    lastSuccessfulSource: this._lastSuccessfulSource,
    checks: checks,
    metrics: Object.assign({}, this._metrics),
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized()
  };
};

FallbackSourceManager.prototype.info = function() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    sources: this.getSourceStatus(),
    metrics: Object.assign({}, this._metrics),
    portsInitialized: Ports.isInitialized()
  };
};

FallbackSourceManager.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};

export function getVersion() { return VERSION; }
export default FallbackSourceManager;
