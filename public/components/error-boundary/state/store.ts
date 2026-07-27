// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.6.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.error-boundary.state.store
// PURPOSE: In-memory error store with subscriptions and metrics
// ───────────────────────────────────────────────────────────────
// @contract GET - get(key) returns store data
// @contract SET - set(key, value) sets store value
// @contract ADD_ERROR - addError(error) adds error entry to store
// @contract UPDATE_ERROR - updateError(errorOrId) updates existing error
// @contract GET_ERRORS - getErrors() returns all errors
// @contract GET_LAST_ERROR - getLastError() returns most recent error
// @contract GET_ERROR_COUNT - getErrorCount() returns total error count
// @contract HAS_ERROR - hasError() checks if errors exist
// @contract CLEAR_ERRORS - clearErrors() clears all errors
// @contract SET_FATAL_ERROR - setFatalError(isFatal) sets fatal error state
// @contract IS_FATAL - isFatal() returns fatal error status
// @contract SUBSCRIBE - subscribe(listener) subscribes to store changes
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES: errorStore, injectPorts, getPorts, healthCheck, info,
//           VERSION, MODULE_ID
// @changelog v2.6.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.5.1-P18EC: Fixed duplicate export of injectPorts/getPorts
// @changelog P17WI: Ports via PortsFactory/PortsProfiles
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '2.6.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.error-boundary.state.store';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => Ports.init();
const _getPort = (name: string): unknown => Ports.get(name);

export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debug = (): boolean => {
  const cfg = _getPort('config') as { app?: { debug?: boolean } } | null;
  return cfg?.app?.debug || false;
};

const _log = (level: string, ...args: unknown[]): void => {
  const logger = _getPort('logger') as { error?: (...a: unknown[]) => void; warn?: (...a: unknown[]) => void; debug?: (...a: unknown[]) => void } | null;
  if (!logger) return;
  if (level === 'error') {
    logger.error?.(`[${MODULE_ID}]`, ...args);
  } else if (level === 'warn') {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
  } else if (_debug()) {
    logger.debug?.(`[${MODULE_ID}]`, ...args);
  }
};

interface ErrorEntry {
  id: string;
  timestamp: number;
  message: string;
  stack: string | null;
  type: string;
  source: string;
  category: string;
  fingerprint: string | null;
  componentStack: string | null;
  metadata: Record<string, unknown>;
  recovered: boolean;
  [key: string]: unknown;
}

interface ErrorData {
  errors: ErrorEntry[];
  lastError: ErrorEntry | null;
  errorCount: number;
  fatalError: boolean;
  recoveryAttempts: number;
  maxErrors: number;
  lastUpdatedAt: number | null;
}

const errorData: ErrorData = {
  errors: [],
  lastError: null,
  errorCount: 0,
  fatalError: false,
  recoveryAttempts: 0,
  maxErrors: 100,
  lastUpdatedAt: null
};

type StoreListener = (event: { action: string; key: string | null; newValue: unknown; oldValue: unknown; state: ErrorData; error: unknown }) => void;

const storeListeners: Set<StoreListener> = new Set();

const _generateErrorId = (): string => {
  return `err-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

export const errorStore = {
  get(key: keyof ErrorData): unknown {
    if (key) return errorData[key];
    return { ...errorData };
  },

  set(key: keyof ErrorData, value: unknown): boolean {
    const oldValue = errorData[key];
    (errorData as unknown as Record<string, unknown>)[key] = value;
    errorData.lastUpdatedAt = Date.now();
    this._notify('set', key, value, oldValue);
    return true;
  },

  addError(error: Record<string, unknown>): ErrorEntry {
    const errorEntry: ErrorEntry = {
      id: (error.id as string) || _generateErrorId(),
      timestamp: Date.now(),
      message: (error.message as string) || String(error),
      stack: (error.stack as string | null) || null,
      type: (error.type as string) || (error.name as string) || 'Error',
      source: (error.source as string) || 'unknown',
      category: (error.category as string) || 'general',
      fingerprint: (error.fingerprint as string | null) || null,
      componentStack: (error.componentStack as string | null) || null,
      metadata: (error.metadata as Record<string, unknown>) || {},
      recovered: false
    };

    errorData.errors.push(errorEntry);
    errorData.lastError = errorEntry;
    errorData.errorCount++;
    errorData.lastUpdatedAt = Date.now();

    if (errorData.errors.length > errorData.maxErrors) {
      errorData.errors.shift();
    }

    this._notify('error-added', 'errors', errorEntry, null);
    return errorEntry;
  },

  updateError(errorOrId: string | Record<string, unknown>): ErrorEntry | null {
    const id = typeof errorOrId === 'string' ? errorOrId : (errorOrId as Record<string, unknown>)?.id as string;
    if (!id) return null;

    const index = errorData.errors.findIndex(e => e.id === id);
    if (index === -1) return null;

    if (typeof errorOrId === 'object') {
      errorData.errors[index] = { ...errorData.errors[index], ...errorOrId } as ErrorEntry;
    }

    errorData.lastUpdatedAt = Date.now();
    this._notify('error-updated', 'errors', errorData.errors[index], null);
    return errorData.errors[index];
  },

  getErrors(): ErrorEntry[] {
    return errorData.errors.slice();
  },

  getLastError(): ErrorEntry | null {
    return errorData.lastError;
  },

  getErrorCount(): number {
    return errorData.errorCount;
  },

  hasError(): boolean {
    return errorData.errorCount > 0 || errorData.fatalError;
  },

  clearErrors(): boolean {
    errorData.errors = [];
    errorData.lastError = null;
    errorData.errorCount = 0;
    errorData.fatalError = false;
    errorData.recoveryAttempts = 0;
    errorData.lastUpdatedAt = Date.now();
    this._notify('errors-cleared', null, null, null);
    return true;
  },

  setFatalError(isFatal: boolean): boolean {
    errorData.fatalError = isFatal;
    errorData.lastUpdatedAt = Date.now();
    this._notify('fatal-error', 'fatalError', isFatal, null);
    return true;
  },

  isFatal(): boolean {
    return errorData.fatalError;
  },

  incrementRecoveryAttempts(): number {
    errorData.recoveryAttempts++;
    return errorData.recoveryAttempts;
  },

  getRecoveryAttempts(): number {
    return errorData.recoveryAttempts;
  },

  subscribe(listener: StoreListener): () => boolean {
    if (typeof listener !== 'function') return () => false;
    storeListeners.add(listener);
    return () => storeListeners.delete(listener);
  },

  _notify(action: string, key: string | null, newValue: unknown, oldValue: unknown): void {
    for (const listener of storeListeners) {
      try {
        listener({ action, key, newValue, oldValue, state: this.get(null as unknown as keyof ErrorData) as ErrorData, error: newValue });
      } catch (err) {
        _log('error', 'Listener error:', err);
      }
    }
  },

  reset(): boolean {
    return this.clearErrors();
  },

  toJSON(): ErrorData {
    return { ...errorData };
  },

  getStatus() {
    return {
      errorCount: errorData.errorCount,
      hasError: this.hasError(),
      isFatal: errorData.fatalError,
      recoveryAttempts: errorData.recoveryAttempts,
      lastUpdatedAt: errorData.lastUpdatedAt
    };
  },

  getMetrics() {
    return {
      errorCount: errorData.errorCount,
      fatalError: errorData.fatalError,
      recoveryAttempts: errorData.recoveryAttempts,
      listenerCount: storeListeners.size,
      lastUpdatedAt: errorData.lastUpdatedAt
    };
  },

  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const checks = {
      notOverflowing: errorData.errors.length < errorData.maxErrors,
      notFatal: !errorData.fatalError,
      lowErrorCount: errorData.errorCount < 50,
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
      errorCount: errorData.errorCount,
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
      status: this.getStatus(),
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
  return errorStore.healthCheck();
}

export function info() {
  return errorStore.info();
}

export default errorStore;
