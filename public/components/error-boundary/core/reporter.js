import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { trackErrorEvent } from "../telemetry/tracker.js";
const VERSION = "2.6.0-P2-ENTERPRISE";
const MODULE_ID = "components.error-boundary.core.reporter";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _getCurrentUrl = () => {
  _initPorts();
  const r = _getPort("router");
  if (r && r.getCurrentRoute) {
    try {
      const route = r.getCurrentRoute();
      if (route && (route.url || route.href)) return route.url || route.href;
    } catch (e) {
    }
  }
  if (typeof window !== "undefined" && window.location) {
    return window.location.href;
  }
  return "unknown";
};
const CONFIG = {
  endpoint: null,
  batchSize: 10,
  flushInterval: 3e4,
  maxQueueSize: 100
};
const _queue = [];
let _flushTimer = null;
const _metrics = {
  reported: 0,
  flushed: 0,
  failed: 0,
  lastFlushAt: null
};
const ErrorReporter = {
  configure(options = {}) {
    if (options.endpoint) CONFIG.endpoint = options.endpoint;
    if (typeof options.batchSize === "number") CONFIG.batchSize = options.batchSize;
    if (typeof options.flushInterval === "number") CONFIG.flushInterval = options.flushInterval;
    if (typeof options.maxQueueSize === "number") CONFIG.maxQueueSize = options.maxQueueSize;
    trackErrorEvent("error:reporter:configured", {
      hasEndpoint: !!CONFIG.endpoint,
      batchSize: CONFIG.batchSize
    });
    return { ...CONFIG };
  },
  getConfig() {
    return { ...CONFIG };
  },
  isConfigured() {
    return !!CONFIG.endpoint;
  },
  report(error, metadata = {}) {
    if (!CONFIG.endpoint) {
      trackErrorEvent("error:reporter:no-endpoint");
      return false;
    }
    if (_queue.length >= CONFIG.maxQueueSize) {
      trackErrorEvent("error:reporter:queue-full", { queueSize: _queue.length });
      _queue.shift();
    }
    _queue.push({
      ...error,
      metadata,
      reportedAt: Date.now(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      url: _getCurrentUrl()
    });
    _metrics.reported++;
    if (_queue.length >= CONFIG.batchSize) {
      this.flush();
    }
    return true;
  },
  flush() {
    if (_queue.length === 0) {
      return Promise.resolve({ success: true, count: 0 });
    }
    if (!CONFIG.endpoint) {
      return Promise.resolve({ success: false, reason: "no-endpoint" });
    }
    const batch = _queue.splice(0, CONFIG.batchSize);
    trackErrorEvent("error:reporter:flush:start", { count: batch.length });
    return fetch(CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ errors: batch, timestamp: Date.now() })
    }).then((response) => {
      if (response.ok) {
        _metrics.flushed += batch.length;
        _metrics.lastFlushAt = Date.now();
        trackErrorEvent("error:reporter:flush:success", { count: batch.length });
        return { success: true, count: batch.length };
      } else {
        _queue.unshift(...batch);
        _metrics.failed += batch.length;
        trackErrorEvent("error:reporter:flush:failed", { status: response.status });
        return { success: false, status: response.status };
      }
    }).catch((err) => {
      _queue.unshift(...batch);
      _metrics.failed += batch.length;
      trackErrorEvent("error:reporter:flush:error", { error: err.message });
      return { success: false, error: err.message };
    });
  },
  startAutoFlush() {
    if (_flushTimer) return false;
    _flushTimer = setInterval(() => {
      this.flush();
    }, CONFIG.flushInterval);
    trackErrorEvent("error:reporter:auto-flush:started");
    return true;
  },
  stopAutoFlush() {
    if (!_flushTimer) return false;
    clearInterval(_flushTimer);
    _flushTimer = null;
    trackErrorEvent("error:reporter:auto-flush:stopped");
    return true;
  },
  isAutoFlushing() {
    return !!_flushTimer;
  },
  getQueueSize() {
    return _queue.length;
  },
  clearQueue() {
    const count = _queue.length;
    _queue.length = 0;
    return count;
  },
  getMetrics() {
    return {
      ..._metrics,
      queueSize: _queue.length
    };
  },
  resetMetrics() {
    _metrics.reported = 0;
    _metrics.flushed = 0;
    _metrics.failed = 0;
    _metrics.lastFlushAt = null;
    return true;
  },
  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const m = this.getMetrics();
    const checks = {
      endpointConfigured: !!CONFIG.endpoint,
      queueNotFull: m.queueSize < CONFIG.maxQueueSize * 0.8,
      lowFailureRate: m.reported === 0 || m.failed / m.reported < 0.3,
      portsInitialized: portsSnapshot._initialized
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const issues = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
    return {
      status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      issues: issues.length > 0 ? issues : null,
      metrics: m,
      autoFlushing: this.isAutoFlushing(),
      configured: this.isConfigured(),
      version: VERSION,
      moduleId: MODULE_ID,
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },
  info() {
    const portsSnapshot = Ports.snapshot();
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      configured: this.isConfigured(),
      config: {
        endpoint: CONFIG.endpoint ? "[configured]" : null,
        batchSize: CONFIG.batchSize,
        flushInterval: CONFIG.flushInterval,
        maxQueueSize: CONFIG.maxQueueSize
      },
      metrics: this.getMetrics(),
      autoFlushing: this.isAutoFlushing(),
      healthCheck: this.healthCheck(),
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },
  injectPorts,
  getPorts
};
function healthCheck() {
  return ErrorReporter.healthCheck();
}
function info() {
  return ErrorReporter.info();
}
var reporter_default = ErrorReporter;
export {
  ErrorReporter,
  MODULE_ID,
  VERSION,
  reporter_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
