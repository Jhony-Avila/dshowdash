import { createUiPorts } from "/core/runtime/ports-profiles.js";
var VERSION = "1.3.0-TIMEOUT-TUNING";
var MODULE_ID = "ticker.api.fallback-sources";
var hasWindow = typeof window !== "undefined";
var Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
var _log = function(level, ...extraArgs) {
  var args = Array.prototype.slice.call(arguments, 1);
  var logger = _getPort("logger");
  if (logger && typeof logger[level] === "function") {
    logger[level].apply(logger, ["[" + MODULE_ID + "]"].concat(args));
  }
};
var SOURCES = [
  { id: "primary", name: "DShowDash API", url: "/api/news/get_ticker_data.php", priority: 1, timeout: 15e3, enabled: true },
  { id: "news-only", name: "News Only API", url: "/api/news/get_news.php", priority: 2, timeout: 1e4, enabled: true },
  { id: "cached", name: "Cached Data", url: "/api/news/cached.json", priority: 3, timeout: 5e3, enabled: true },
  { id: "static", name: "Static Fallback", url: "/components/ticker/data/fallback.json", priority: 4, timeout: 2e3, enabled: true }
];
function FallbackSourceManager(options) {
  if (options === void 0) options = {};
  this.sources = options.sources || SOURCES.map(function(s) {
    return Object.assign({}, s);
  });
  this.maxRetries = options.maxRetries || 2;
  this.retryDelay = options.retryDelay || 1e3;
  this._lastSuccessfulSource = null;
  this._sourceHealth = /* @__PURE__ */ new Map();
  this._metrics = { attempts: 0, successes: 0, failures: 0, fallbacks: 0 };
  var self = this;
  this.sources.forEach(function(s) {
    self._sourceHealth.set(s.id, { failures: 0, lastSuccess: null, lastFailure: null });
  });
}
FallbackSourceManager.prototype.fetch = function(signal) {
  var self = this;
  self._metrics.attempts++;
  var sortedSources = self._getSortedSources();
  return function tryNext(index) {
    if (index >= sortedSources.length) {
      self._metrics.failures++;
      return Promise.reject(new Error("All sources failed"));
    }
    var source = sortedSources[index];
    if (!source.enabled) return tryNext(index + 1);
    return self._fetchFromSource(source, signal || null).then(function(result) {
      self._onSourceSuccess(source);
      self._metrics.successes++;
      if (source.priority > 1) self._metrics.fallbacks++;
      return { data: result, source: source.id, isFallback: source.priority > 1 };
    }).catch(function(error) {
      self._onSourceFailure(source, error);
      _log("warn", "Source failed: " + source.name, { error: error.message });
      if (signal && signal.aborted) return Promise.reject(error);
      return tryNext(index + 1);
    });
  }(0);
};
FallbackSourceManager.prototype._fetchFromSource = function(source, signal) {
  var controller = new AbortController();
  var timeoutId = setTimeout(function() {
    controller.abort();
  }, source.timeout);
  var combinedSignal = signal ? this._combineSignals(signal, controller.signal) : controller.signal;
  return fetch(source.url, {
    signal: combinedSignal,
    headers: { "Content-Type": "application/json" }
  }).then(function(response) {
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  }).then(function(data) {
    if (data.ok === false) throw new Error(data.error || "Invalid response");
    return Array.isArray(data) ? data : data.data || data.items || [];
  }).catch(function(error) {
    clearTimeout(timeoutId);
    throw error;
  });
};
FallbackSourceManager.prototype._combineSignals = function(signal1, signal2) {
  var controller = new AbortController();
  var abort = function() {
    controller.abort();
  };
  if (signal1.aborted || signal2.aborted) {
    controller.abort();
    return controller.signal;
  }
  signal1.addEventListener("abort", abort, { once: true });
  signal2.addEventListener("abort", abort, { once: true });
  return controller.signal;
};
FallbackSourceManager.prototype._getSortedSources = function() {
  var self = this;
  return this.sources.slice().sort(function(a, b) {
    var healthA = self._sourceHealth.get(a.id);
    var healthB = self._sourceHealth.get(b.id);
    if (a.id === self._lastSuccessfulSource) return -1;
    if (b.id === self._lastSuccessfulSource) return 1;
    if (healthA.failures !== healthB.failures) return healthA.failures - healthB.failures;
    return a.priority - b.priority;
  });
};
FallbackSourceManager.prototype._onSourceSuccess = function(source) {
  var health = this._sourceHealth.get(source.id);
  health.failures = 0;
  health.lastSuccess = Date.now();
  this._lastSuccessfulSource = source.id;
};
FallbackSourceManager.prototype._onSourceFailure = function(source, error) {
  var health = this._sourceHealth.get(source.id);
  health.failures++;
  health.lastFailure = Date.now();
  health.lastError = error.message;
};
FallbackSourceManager.prototype.enableSource = function(id) {
  var source = this.sources.find(function(s) {
    return s.id === id;
  });
  if (source) source.enabled = true;
};
FallbackSourceManager.prototype.disableSource = function(id) {
  var source = this.sources.find(function(s) {
    return s.id === id;
  });
  if (source) source.enabled = false;
};
FallbackSourceManager.prototype.resetSourceHealth = function(id) {
  if (id) {
    var health = this._sourceHealth.get(id);
    if (health) {
      health.failures = 0;
      health.lastSuccess = null;
      health.lastFailure = null;
    }
  } else {
    this._sourceHealth.forEach(function(health2) {
      health2.failures = 0;
      health2.lastSuccess = null;
      health2.lastFailure = null;
    });
  }
};
FallbackSourceManager.prototype.getSourceStatus = function() {
  var self = this;
  return this.sources.map(function(source) {
    return Object.assign({}, source, {
      health: self._sourceHealth.get(source.id),
      isLastSuccessful: source.id === self._lastSuccessfulSource
    });
  });
};
FallbackSourceManager.prototype.healthCheck = function() {
  var logger = _getPort("logger");
  var enabledSources = this.sources.filter(function(s) {
    return s.enabled;
  });
  var self = this;
  var healthySources = enabledSources.filter(function(s) {
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
    status: passed === 4 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: passed + "/4",
    enabledSources: enabledSources.length,
    healthySources: healthySources.length,
    lastSuccessfulSource: this._lastSuccessfulSource,
    checks,
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
function getVersion() {
  return VERSION;
}
var fallback_sources_default = FallbackSourceManager;
export {
  FallbackSourceManager,
  MODULE_ID,
  VERSION,
  fallback_sources_default as default,
  getPorts,
  getVersion,
  injectPorts
};
