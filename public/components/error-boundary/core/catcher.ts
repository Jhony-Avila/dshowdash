// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.error-boundary.core.catcher
// PURPOSE: Global error catching with rate limiting and deduplication
// ───────────────────────────────────────────────────────────────
// @contract START_GLOBAL_CAPTURE - startGlobalCapture(options) starts global error listeners
// @contract STOP_GLOBAL_CAPTURE - stopGlobalCapture() stops global error listeners
// @contract CAPTURE_ERROR - captureError(error, context) captures and processes error
// @contract CLEAR_FINGERPRINTS - clearFingerprints() clears fingerprint cache
// @contract CONFIGURE - configure(options) configures rate limiting
// @contract IS_CAPTURING - isCapturing() returns capture status
// @contract GET_METRICS - getMetrics() returns catcher metrics
// @contract RESET_METRICS - resetMetrics() resets all metrics
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: errorStore from ../state/store.js
// IMPORTS: trackErrorEvent from ../telemetry/tracker.js
// IMPORTS: sanitizeError, categorizeError, shouldReportError,
//          createErrorFingerprint, formatError from ../utils/helpers.js
// PROVIDES: ErrorCatcher, ERROR_EVENTS, injectPorts, getPorts,
//           healthCheck, info, VERSION, MODULE_ID
// @changelog v2.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog P18EC: Events Contracts Migration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { errorStore } from '../state/store.js';
import { trackErrorEvent } from '../telemetry/tracker.js';
import { sanitizeError, categorizeError, shouldReportError, createErrorFingerprint, formatError } from '../utils/helpers.js';

export const VERSION = '2.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.error-boundary.core.catcher';

export const ERROR_EVENTS = Object.freeze({
  CAPTURED: 'error:captured'
});

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => Ports.init();
const _getPort = (name: string): unknown => Ports.get(name);

export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let globalErrorHandler: ((event: ErrorEvent) => void) | null = null;
let unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

const CONFIG = {
  rateLimitWindow: 60000,
  rateLimitMax: 5,
  dedupeWindow: 60000
};

const _fingerprints = new Map<string, { count: number; firstAt: number; lastAt: number }>();

const _metrics = {
  captured: 0,
  deduplicated: 0,
  rateLimited: 0,
  lastCapturedAt: null as number | null
};

function isRateLimited(fingerprint: string): boolean {
  const now = Date.now();
  const entry = _fingerprints.get(fingerprint);

  if (!entry) return false;

  const inWindow = (now - entry.firstAt) < CONFIG.rateLimitWindow;
  if (!inWindow) {
    _fingerprints.delete(fingerprint);
    return false;
  }

  return entry.count >= CONFIG.rateLimitMax;
}

function recordFingerprint(fingerprint: string): { count: number; firstAt: number; lastAt: number } {
  const now = Date.now();
  const entry = _fingerprints.get(fingerprint) || { count: 0, firstAt: now, lastAt: 0 };

  if ((now - entry.firstAt) >= CONFIG.rateLimitWindow) {
    entry.count = 1;
    entry.firstAt = now;
  } else {
    entry.count++;
  }

  entry.lastAt = now;
  _fingerprints.set(fingerprint, entry);

  // Cleanup old fingerprints
  if (_fingerprints.size > 500) {
    const entries = Array.from(_fingerprints.entries());
    entries.sort((a, b) => a[1].lastAt - b[1].lastAt);
    if (entries[0]) _fingerprints.delete(entries[0][0]);
  }

  return entry;
}

function emitErrorEvent(errorEntry: Record<string, unknown>): void {
  const eb = _getPort('eventBus') as { emit?: (event: string, data: Record<string, unknown>) => void } | null;
  if (!eb || !eb.emit) return;

  try {
    const formatted = formatError(errorEntry);
    eb.emit(ERROR_EVENTS.CAPTURED, {
      id: errorEntry.id,
      message: formatted.message,
      code: formatted.code || null,
      source: formatted.source || 'unknown',
      severity: formatted.severity || 'error',
      category: errorEntry.category,
      route: formatted.route || null,
      panel: formatted.panel || null,
      fingerprint: errorEntry.fingerprint,
      timestamp: Date.now()
    });
  } catch (e) { /* silent */ }
}

export const ErrorCatcher = {
  startGlobalCapture(options: { rateLimitWindow?: number; rateLimitMax?: number } = {}) {
    if (typeof window === 'undefined') return;

    if (options.rateLimitWindow) CONFIG.rateLimitWindow = options.rateLimitWindow;
    if (options.rateLimitMax) CONFIG.rateLimitMax = options.rateLimitMax;

    globalErrorHandler = (event: ErrorEvent) => {
      this._handleGlobalError(event, options);
    };

    unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      this._handleUnhandledRejection(event, options);
    };

    window.addEventListener('error', globalErrorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);

    trackErrorEvent('error:catcher:started');
  },

  stopGlobalCapture() {
    if (typeof window === 'undefined') return;

    if (globalErrorHandler) {
      window.removeEventListener('error', globalErrorHandler);
      globalErrorHandler = null;
    }

    if (unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
      unhandledRejectionHandler = null;
    }

    trackErrorEvent('error:catcher:stopped');
  },

  captureError(error: Record<string, unknown>, context: { source?: string; metadata?: Record<string, unknown> } = {}) {
    const sanitized = sanitizeError(error);
    const category = categorizeError(error);
    const fingerprint = createErrorFingerprint(error);

    if (isRateLimited(fingerprint)) {
      _metrics.rateLimited++;
      const fp = _fingerprints.get(fingerprint);
      trackErrorEvent('error:catcher:rate-limited', { fingerprint, count: fp ? fp.count : 0 });
      return null;
    }

    const entry = recordFingerprint(fingerprint);

    if (entry.count > 1) {
      _metrics.deduplicated++;
      trackErrorEvent('error:catcher:duplicate', { fingerprint, count: entry.count });
      return null;
    }

    const errorEntry = errorStore.addError({
      ...sanitized,
      source: context.source || 'manual',
      category,
      fingerprint,
      metadata: context.metadata || {}
    });

    _metrics.captured++;
    _metrics.lastCapturedAt = Date.now();

    trackErrorEvent('error:catcher:captured', { type: sanitized.name, category, fingerprint });
    emitErrorEvent(errorEntry);

    return errorEntry;
  },

  _handleGlobalError(event: ErrorEvent, options: { rateLimitWindow?: number; rateLimitMax?: number }) {
    const error: Record<string, unknown> = (event.error as Record<string, unknown>) || { message: event.message || 'Unknown error', name: 'Error' };
    error.source = 'global';

    if (!shouldReportError(error, options as Record<string, unknown>)) return;

    this.captureError(error, {
      source: 'window.onerror',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  },

  _handleUnhandledRejection(event: PromiseRejectionEvent, options: { rateLimitWindow?: number; rateLimitMax?: number }) {
    const reason = event.reason || new Error('Unhandled Promise Rejection');
    const rawError = reason instanceof Error ? reason : new Error(String(reason));
    const error: Record<string, unknown> = {
      message: rawError.message,
      name: rawError.name,
      stack: rawError.stack,
      source: 'promise'
    };

    if (!shouldReportError(error, options as Record<string, unknown>)) return;

    this.captureError(error, {
      source: 'unhandledrejection',
      metadata: { promiseRejection: true }
    });
  },

  clearFingerprints(): boolean {
    _fingerprints.clear();
    return true;
  },

  getMetrics() {
    return {
      fingerprintCount: _fingerprints.size,
      ..._metrics
    };
  },

  resetMetrics(): boolean {
    _metrics.captured = 0;
    _metrics.deduplicated = 0;
    _metrics.rateLimited = 0;
    _metrics.lastCapturedAt = null;
    return true;
  },

  configure(options: { rateLimitWindow?: number; rateLimitMax?: number } = {}) {
    if (typeof options.rateLimitWindow === 'number') CONFIG.rateLimitWindow = options.rateLimitWindow;
    if (typeof options.rateLimitMax === 'number') CONFIG.rateLimitMax = options.rateLimitMax;
    return { ...CONFIG };
  },

  isCapturing(): boolean {
    return !!globalErrorHandler || !!unhandledRejectionHandler;
  },

  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const m = this.getMetrics();

    const checks = {
      capturing: this.isCapturing(),
      lowRateLimitHits: m.captured === 0 || (m.rateLimited / m.captured) < 0.3,
      fingerprintsNotOverflowing: m.fingerprintCount < 400,
      portsInitialized: portsSnapshot._initialized
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const issues = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);

    return {
      status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
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

export function healthCheck() {
  return ErrorCatcher.healthCheck();
}

export function info() {
  return ErrorCatcher.info();
}

export default ErrorCatcher;
