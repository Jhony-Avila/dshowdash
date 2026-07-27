import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { errorStore } from "../state/store.js";
import { trackErrorEvent } from "../telemetry/tracker.js";
import { sanitizeError, categorizeError, shouldReportError, createErrorFingerprint, formatError } from "../utils/helpers.js";
const VERSION = "2.4.0-P2-ENTERPRISE";
const MODULE_ID = "components.error-boundary.core.catcher";
const ERROR_EVENTS = Object.freeze({
  CAPTURED: "error:captured"
});
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let globalErrorHandler = null;
let unhandledRejectionHandler = null;
const CONFIG = {
  rateLimitWindow: 6e4,
  rateLimitMax: 5,
  dedupeWindow: 6e4
};
const _fingerprints = /* @__PURE__ */ new Map();
const _metrics = {
  captured: 0,
  deduplicated: 0,
  rateLimited: 0,
  lastCapturedAt: null
};
function isRateLimited(fingerprint) {
  const now = Date.now();
  const entry = _fingerprints.get(fingerprint);
  if (!entry) return false;
  const inWindow = now - entry.firstAt < CONFIG.rateLimitWindow;
  if (!inWindow) {
    _fingerprints.delete(fingerprint);
    return false;
  }
  return entry.count >= CONFIG.rateLimitMax;
}
function recordFingerprint(fingerprint) {
  const now = Date.now();
  const entry = _fingerprints.get(fingerprint) || { count: 0, firstAt: now, lastAt: 0 };
  if (now - entry.firstAt >= CONFIG.rateLimitWindow) {
    entry.count = 1;
    entry.firstAt = now;
  } else {
    entry.count++;
  }
  entry.lastAt = now;
  _fingerprints.set(fingerprint, entry);
  if (_fingerprints.size > 500) {
    const entries = Array.from(_fingerprints.entries());
    entries.sort((a, b) => a[1].lastAt - b[1].lastAt);
    if (entries[0]) _fingerprints.delete(entries[0][0]);
  }
  return entry;
}
function emitErrorEvent(errorEntry) {
  const eb = _getPort("eventBus");
  if (!eb || !eb.emit) return;
  try {
    const formatted = formatError(errorEntry);
    eb.emit(ERROR_EVENTS.CAPTURED, {
      id: errorEntry.id,
      message: formatted.message,
      code: formatted.code || null,
      source: formatted.source || "unknown",
      severity: formatted.severity || "error",
      category: errorEntry.category,
      route: formatted.route || null,
      panel: formatted.panel || null,
      fingerprint: errorEntry.fingerprint,
      timestamp: Date.now()
    });
  } catch (e) {
  }
}
const ErrorCatcher = {
  startGlobalCapture(options = {}) {
    if (typeof window === "undefined") return;
    if (options.rateLimitWindow) CONFIG.rateLimitWindow = options.rateLimitWindow;
    if (options.rateLimitMax) CONFIG.rateLimitMax = options.rateLimitMax;
    globalErrorHandler = (event) => {
      this._handleGlobalError(event, options);
    };
    unhandledRejectionHandler = (event) => {
      this._handleUnhandledRejection(event, options);
    };
    window.addEventListener("error", globalErrorHandler);
    window.addEventListener("unhandledrejection", unhandledRejectionHandler);
    trackErrorEvent("error:catcher:started");
  },
  stopGlobalCapture() {
    if (typeof window === "undefined") return;
    if (globalErrorHandler) {
      window.removeEventListener("error", globalErrorHandler);
      globalErrorHandler = null;
    }
    if (unhandledRejectionHandler) {
      window.removeEventListener("unhandledrejection", unhandledRejectionHandler);
      unhandledRejectionHandler = null;
    }
    trackErrorEvent("error:catcher:stopped");
  },
  captureError(error, context = {}) {
    const sanitized = sanitizeError(error);
    const category = categorizeError(error);
    const fingerprint = createErrorFingerprint(error);
    if (isRateLimited(fingerprint)) {
      _metrics.rateLimited++;
      const fp = _fingerprints.get(fingerprint);
      trackErrorEvent("error:catcher:rate-limited", { fingerprint, count: fp ? fp.count : 0 });
      return null;
    }
    const entry = recordFingerprint(fingerprint);
    if (entry.count > 1) {
      _metrics.deduplicated++;
      trackErrorEvent("error:catcher:duplicate", { fingerprint, count: entry.count });
      return null;
    }
    const errorEntry = errorStore.addError({
      ...sanitized,
      source: context.source || "manual",
      category,
      fingerprint,
      metadata: context.metadata || {}
    });
    _metrics.captured++;
    _metrics.lastCapturedAt = Date.now();
    trackErrorEvent("error:catcher:captured", { type: sanitized.name, category, fingerprint });
    emitErrorEvent(errorEntry);
    return errorEntry;
  },
  _handleGlobalError(event, options) {
    const error = event.error || { message: event.message || "Unknown error", name: "Error" };
    error.source = "global";
    if (!shouldReportError(error, options)) return;
    this.captureError(error, {
      source: "window.onerror",
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  },
  _handleUnhandledRejection(event, options) {
    const reason = event.reason || new Error("Unhandled Promise Rejection");
    const rawError = reason instanceof Error ? reason : new Error(String(reason));
    const error = {
      message: rawError.message,
      name: rawError.name,
      stack: rawError.stack,
      source: "promise"
    };
    if (!shouldReportError(error, options)) return;
    this.captureError(error, {
      source: "unhandledrejection",
      metadata: { promiseRejection: true }
    });
  },
  clearFingerprints() {
    _fingerprints.clear();
    return true;
  },
  getMetrics() {
    return {
      fingerprintCount: _fingerprints.size,
      ..._metrics
    };
  },
  resetMetrics() {
    _metrics.captured = 0;
    _metrics.deduplicated = 0;
    _metrics.rateLimited = 0;
    _metrics.lastCapturedAt = null;
    return true;
  },
  configure(options = {}) {
    if (typeof options.rateLimitWindow === "number") CONFIG.rateLimitWindow = options.rateLimitWindow;
    if (typeof options.rateLimitMax === "number") CONFIG.rateLimitMax = options.rateLimitMax;
    return { ...CONFIG };
  },
  isCapturing() {
    return !!globalErrorHandler || !!unhandledRejectionHandler;
  },
  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const m = this.getMetrics();
    const checks = {
      capturing: this.isCapturing(),
      lowRateLimitHits: m.captured === 0 || m.rateLimited / m.captured < 0.3,
      fingerprintsNotOverflowing: m.fingerprintCount < 400,
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
      portsInitialized: portsSnapshot._initialized,
      metrics: m,
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  },
  info() {
    const portsSnapshot = Ports.snapshot();
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      capturing: this.isCapturing(),
      portsInitialized: portsSnapshot._initialized,
      config: { ...CONFIG },
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck(),
      timestamp: Date.now()
    };
  },
  ERROR_EVENTS,
  injectPorts,
  getPorts
};
function healthCheck() {
  return ErrorCatcher.healthCheck();
}
function info() {
  return ErrorCatcher.info();
}
var catcher_default = ErrorCatcher;
export {
  ERROR_EVENTS,
  ErrorCatcher,
  MODULE_ID,
  VERSION,
  catcher_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
