// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.error-boundary.core.handler
// PURPOSE: Core error handler with catch, recover, retry, and wrap operations
// ───────────────────────────────────────────────────────────────
// @contract CATCH - catch(error, context) captures error and adds to store
// @contract RECOVER - recover(errorId) marks error as recovered
// @contract RETRY - retry(fn, maxAttempts, options) retries function with backoff
// @contract WRAP - wrap(fn, context) wraps sync function with error catching
// @contract WRAP_ASYNC - wrapAsync(fn, context) wraps async function with error catching
// @contract SET_DEBUG_MODE - setDebugMode(enabled) enables/disables debug mode
// @contract GET_DEBUG_MODE - getDebugMode() returns current debug mode
// @contract GET_METRICS - getMetrics() returns handler metrics
// @contract RESET_METRICS - resetMetrics() resets all metrics
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: errorStore from ../state/store.js
// IMPORTS: trackErrorEvent from ../telemetry/tracker.js
// IMPORTS: createErrorId, isRecoverable, sanitizeError from ../utils/helpers.js
// PROVIDES: ErrorHandler, injectPorts, getPorts, healthCheck, info,
//           VERSION, MODULE_ID
// @changelog v2.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.4.1-ENTERPRISE: ES5 conversion (Object.values/entries → for loops)
// @changelog P17WI: Ports via PortsFactory/PortsProfiles
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { errorStore } from '../state/store.js';
import { trackErrorEvent } from '../telemetry/tracker.js';
import { createErrorId, isRecoverable, sanitizeError } from '../utils/helpers.js';

export const VERSION = '2.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.error-boundary.core.handler';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => Ports.init();
const _getPort = (name: string): unknown => Ports.get(name);

export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _debugMode = false;

const _debugEnabled = (): boolean => {
  const cfg = _getPort('config') as { app?: { debug?: boolean } } | null;
  return (cfg && cfg.app && cfg.app.debug) ? true : _debugMode;
};

const _log = (level: string, ...args: unknown[]): void => {
  const logger = _getPort('logger') as { error?: (...a: unknown[]) => void; warn?: (...a: unknown[]) => void; debug?: (...a: unknown[]) => void } | null;
  if (!logger) return;
  if (level === 'error') {
    logger.error?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (level === 'warn') {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (_debugEnabled() && logger.debug) {
    logger.debug(`[${MODULE_ID}]`, ...args);
  }
};

const _metrics = {
  caught: 0,
  recovered: 0,
  retries: 0,
  wraps: 0,
  lastCaughtAt: null as number | null
};

export const ErrorHandler = {
  setDebugMode(enabled: boolean): boolean {
    _debugMode = Boolean(enabled);
    return _debugMode;
  },

  getDebugMode(): boolean {
    return _debugMode;
  },

  catch(error: Record<string, unknown>, context: Record<string, unknown> = {}) {
    const sanitized = sanitizeError(error);
    const errorEntry = {
      id: createErrorId(),
      ...sanitized,
      context,
      timestamp: Date.now(),
      recovered: false,
      recoverable: isRecoverable(error)
    };

    errorStore.addError(errorEntry);
    _metrics.caught++;
    _metrics.lastCaughtAt = Date.now();

    trackErrorEvent('error:caught', {
      errorId: errorEntry.id,
      message: sanitized.message,
      recoverable: errorEntry.recoverable
    });

    _log('error', 'Caught:', sanitized.message, context);
    return errorEntry;
  },

  recover(errorId: string | null = null) {
    const lastError = errorId
      ? errorStore.getErrors().find(e => e.id === errorId)
      : errorStore.getLastError();

    if (!lastError) {
      _log('warn', 'No error to recover');
      return null;
    }

    const updated = errorStore.updateError({
      ...lastError,
      recovered: true,
      recoveredAt: Date.now()
    });

    if (updated) {
      _metrics.recovered++;
      trackErrorEvent('error:recovered', { errorId: lastError.id });
    }

    return updated;
  },

  retry(fn: () => unknown, maxAttempts: number = 3, options: { delay?: number; backoff?: number; onRetry?: ((...args: unknown[]) => void) | null } = {}) {
    const delay = options.delay || 100;
    const backoff = options.backoff || 2;
    const onRetry = options.onRetry || null;

    let attempts = 0;
    let lastError: unknown = null;

    return new Promise((resolve, reject) => {
      const attempt = () => {
        attempts++;
        Promise.resolve()
          .then(() => fn())
          .then(resolve)
          .catch(error => {
            lastError = error;
            _metrics.retries++;

            if (attempts < maxAttempts) {
              const waitTime = delay * Math.pow(backoff, attempts - 1);
              trackErrorEvent('error:retry', { attempt: attempts, maxAttempts, waitTime });

              if (typeof onRetry === 'function') {
                try {
                  onRetry({ attempt: attempts, error, waitTime });
                } catch (e) { /* ignore */ }
              }

              setTimeout(attempt, waitTime);
            } else {
              trackErrorEvent('error:retry:exhausted', { attempts, maxAttempts });
              reject(lastError);
            }
          });
      };
      attempt();
    });
  },

  wrap(fn: (...args: unknown[]) => unknown, context: Record<string, unknown> = {}) {
    _metrics.wraps++;
    const self = this;

    return function(this: unknown, ...args: unknown[]) {
      try {
        return fn.apply(this, args);
      } catch (error) {
        self.catch(error as Record<string, unknown>, { ...context, args, type: 'sync-wrap' });
        throw error;
      }
    };
  },

  wrapAsync(fn: (...args: unknown[]) => unknown, context: Record<string, unknown> = {}) {
    _metrics.wraps++;
    const self = this;

    return function(this: unknown, ...args: unknown[]) {
      return Promise.resolve()
        .then(() => fn.apply(this, args))
        .catch(error => {
          self.catch(error as Record<string, unknown>, { ...context, args, type: 'async-wrap' });
          throw error;
        });
    };
  },

  getMetrics() {
    return { ..._metrics };
  },

  resetMetrics(): boolean {
    _metrics.caught = 0;
    _metrics.recovered = 0;
    _metrics.retries = 0;
    _metrics.wraps = 0;
    _metrics.lastCaughtAt = null;
    return true;
  },

  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const m = this.getMetrics();
    const storeHealth = errorStore.healthCheck ? errorStore.healthCheck() : { status: 'UNKNOWN' };

    const checks = {
      storeHealthy: storeHealth.status === 'HEALTHY' || storeHealth.status === 'DEGRADED',
      lowCaughtRate: m.caught < 100,
      hasRecoveries: m.caught === 0 || m.recovered > 0 || m.caught < 5,
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
      metrics: m,
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
      debugMode: _debugMode,
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck(),
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },

  injectPorts,
  getPorts
};

export function healthCheck() {
  return ErrorHandler.healthCheck();
}

export function info() {
  return ErrorHandler.info();
}

export default ErrorHandler;
