// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.error-boundary.core.lifecycle
// PURPOSE: Error boundary lifecycle management (init, shutdown, reset)
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes error boundary lifecycle
// @contract SHUTDOWN - shutdown() shuts down and cleans up
// @contract RESET - reset() resets error state
// @contract DESTROY - destroy() alias for shutdown
// @contract IS_INITIALIZED - isInitialized() returns initialization status
// @contract IS_INITIALIZING - isInitializing() returns initializing status
// @contract GET_STATUS - getStatus() returns lifecycle status
// @contract GET_OPTIONS - getOptions() returns current options
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: errorStore from ../state/store.js
// IMPORTS: trackErrorEvent from ../telemetry/tracker.js
// IMPORTS: ErrorCatcher from ./catcher.js
// PROVIDES: ErrorLifecycle, injectPorts, getPorts, healthCheck, info,
//           VERSION, MODULE_ID
// @changelog v2.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.4.1-ENTERPRISE: ES5 conversion (Object.values/entries → for loops)
// @changelog P17WI: Migração para PortsFactory/PortsProfiles
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { errorStore } from '../state/store.js';
import { trackErrorEvent } from '../telemetry/tracker.js';
import { ErrorCatcher } from './catcher.js';

export const VERSION = '2.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.error-boundary.core.lifecycle';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => Ports.init();
const _getPort = (name: string): unknown => Ports.get(name);

export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debugEnabled = (): boolean => {
  const cfg = _getPort('config') as { app?: { debug?: boolean } } | null;
  return cfg?.app?.debug || false;
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

const _state = {
  initialized: false,
  initializing: false,
  initCount: 0,
  lastInitAt: null as number | null,
  lastShutdownAt: null as number | null,
  lastResetAt: null as number | null,
  lastError: null as string | null,
  options: {} as Record<string, unknown>
};

export const ErrorLifecycle = {
  init(options: { force?: boolean; rateLimitWindow?: number; rateLimitMax?: number } & Record<string, unknown> = {}) {
    if (_state.initialized && !options.force) {
      _log('warn', 'Already initialized, use force:true to reinit');
      trackErrorEvent('error:lifecycle:already-initialized', { initCount: _state.initCount });
      return Promise.resolve({ success: true, alreadyInitialized: true, initCount: _state.initCount });
    }

    if (_state.initializing) {
      _log('warn', 'Init already in progress');
      return Promise.resolve({ success: false, reason: 'initializing' });
    }

    _state.initializing = true;
    trackErrorEvent('error:lifecycle:init:start');

    return new Promise(resolve => {
      try {
        if (options.force && _state.initialized) {
          this.shutdown();
        }

        _state.options = { ...options };
        errorStore.reset();
        ErrorCatcher.startGlobalCapture(options);

        _state.initialized = true;
        _state.initializing = false;
        _state.initCount++;
        _state.lastInitAt = Date.now();
        _state.lastError = null;

        trackErrorEvent('error:lifecycle:init:complete', { initCount: _state.initCount });
        resolve({ success: true, initCount: _state.initCount });
      } catch (error) {
        _state.initializing = false;
        _state.lastError = (error as Error).message;
        _log('error', 'Init failed:', error);
        trackErrorEvent('error:lifecycle:init:failed', { error: (error as Error).message });
        resolve({ success: false, error: (error as Error).message });
      }
    });
  },

  shutdown() {
    if (!_state.initialized) {
      _log('warn', 'Not initialized, nothing to shutdown');
      return { success: true, wasInitialized: false };
    }

    trackErrorEvent('error:lifecycle:shutdown:start');

    try {
      ErrorCatcher.stopGlobalCapture();
      errorStore.reset();
      _state.initialized = false;
      _state.lastShutdownAt = Date.now();

      trackErrorEvent('error:lifecycle:shutdown:complete');
      return { success: true, wasInitialized: true };
    } catch (error) {
      _state.lastError = (error as Error).message;
      _log('error', 'Shutdown failed:', error);
      trackErrorEvent('error:lifecycle:shutdown:failed', { error: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  },

  reset() {
    trackErrorEvent('error:lifecycle:reset:start');

    try {
      errorStore.reset();
      ErrorCatcher.clearFingerprints();
      _state.lastResetAt = Date.now();
      _state.lastError = null;

      trackErrorEvent('error:lifecycle:reset:complete');
      return { success: true };
    } catch (error) {
      _state.lastError = (error as Error).message;
      _log('error', 'Reset failed:', error);
      trackErrorEvent('error:lifecycle:reset:failed', { error: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  },

  destroy() {
    return this.shutdown();
  },

  isInitialized(): boolean {
    return _state.initialized;
  },

  isInitializing(): boolean {
    return _state.initializing;
  },

  getStatus() {
    return {
      initialized: _state.initialized,
      initializing: _state.initializing,
      initCount: _state.initCount,
      lastInitAt: _state.lastInitAt,
      lastShutdownAt: _state.lastShutdownAt,
      lastResetAt: _state.lastResetAt,
      lastError: _state.lastError,
      errorCount: errorStore.getErrorCount(),
      hasError: errorStore.hasError ? errorStore.hasError() : errorStore.getErrorCount() > 0
    };
  },

  getOptions(): Record<string, unknown> {
    return { ..._state.options };
  },

  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const status = this.getStatus();

    const checks = {
      initialized: status.initialized,
      noInitError: !status.lastError,
      storeAvailable: !!errorStore,
      catcherAvailable: !!ErrorCatcher,
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
      initCount: status.initCount,
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
      healthCheck: this.healthCheck(),
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },

  injectPorts,
  getPorts
};

export function healthCheck() {
  return ErrorLifecycle.healthCheck();
}

export function info() {
  return ErrorLifecycle.info();
}

export default ErrorLifecycle;
