// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE2)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.debounced-request
// PURPOSE: Debounced Request — Debounce com AbortController para chamadas API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   injectPorts(), getPorts()
//   DebouncedRequest — exported class
//   createDebouncedFetch() — helper factory
//   debounce() — simple debounce utility
//   info(), healthCheck()
//
// @origin Adapted from panel-01/utils/performance/debounce.js for nav-admin
// @changelog
//   10.1.0-MIGRATION-PHASE2: Initial creation — FASE 2 C.4
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.1.0-MIGRATION-PHASE2';
export const MODULE_ID = 'panel-nav-admin.data.debounced-request';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = '[DebouncedRequest]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * DebouncedRequest — Agrupar chamadas repetidas com cancelamento automático.
 * Ideal para busca em tempo real, auto-save e validações assíncronas.
 */
export class DebouncedRequest {
  [key: string]: any;
  /**
   * @param {Function} fn — Async function to debounce. Receives (args, { signal })
   * @param {Object} [options]
   * @param {number} [options.delay=400] — Debounce delay in ms
   * @param {boolean} [options.leading=false] — Execute on leading edge
   */
  constructor(fn: (...args: unknown[]) => Promise<unknown>, options: Record<string, unknown> = {}) {
    this._fn = fn;
    this._delay = options.delay || 400;
    this._leading = options.leading || false;
    this._timer = null;
    this._abortController = null;
    this._pending = false;
    this._lastArgs = null;
    this._callCount = 0;
    this._cancelCount = 0;
  }

  /**
   * Schedule execution. Cancels any pending call and previous in-flight request.
   * @param {...*} args — Arguments to pass to the debounced function
   * @returns {Promise<*>} Resolves with the function result
   */
  call(...args: unknown[]) {
    this._lastArgs = args;

    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }

    if (this._abortController) {
      this._abortController.abort();
      this._cancelCount++;
    }

    if (this._leading && !this._pending) {
      return this._execute(args);
    }

    return new Promise((resolve, reject) => {
      this._timer = setTimeout(() => {
        this._timer = null;
        this._execute(args).then(resolve).catch(reject);
      }, this._delay);
    });
  }

  /** @private Execute the wrapped function with abort signal */
  async _execute(args: unknown[]) {
    this._pending = true;
    this._abortController = new AbortController();
    this._callCount++;

    try {
      const result = await this._fn(...args, { signal: this._abortController.signal });
      this._pending = false;
      return result;
    } catch (error: unknown) {
      this._pending = false;
      if ((error as Error).name === 'AbortError') {
        _log('debug', 'Request aborted');
        return undefined;
      }
      throw error;
    }
  }

  /** Cancel pending timer and abort in-flight request. */
  cancel() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
      this._cancelCount++;
    }
    this._pending = false;
  }

  /** Execute immediately with last args, skipping the delay. */
  flush() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    if (this._lastArgs) {
      return this._execute(this._lastArgs);
    }
    return Promise.resolve(undefined);
  }

  /** @returns {boolean} Whether a call is pending or in-flight */
  isPending() { return this._pending || this._timer !== null; }

  /** @returns {Object} Usage metrics */
  getMetrics() {
    return {
      callCount: this._callCount,
      cancelCount: this._cancelCount,
      pending: this.isPending()
    };
  }

  /** Cleanup — cancel and remove references. */
  destroy() {
    this.cancel();
    this._fn = null;
    this._lastArgs = null;
  }
}

/**
 * Create a debounced fetch wrapper.
 * @param {Function} fetchFn — Async function (receives ...args, { signal })
 * @param {number} [delay=400]
 * @returns {DebouncedRequest}
 */
export function createDebouncedFetch(fetchFn: (...args: unknown[]) => Promise<unknown>, delay = 400) {
  return new DebouncedRequest(fetchFn, { delay });
}

/**
 * Simple debounce utility (no AbortController).
 * @param {Function} fn
 * @param {number} [delay=300]
 * @returns {{ call: Function, cancel: Function, flush: Function }}
 */
export function debounce(fn: (...args: unknown[]) => void, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: unknown[] | null = null;

  const call = (...args: unknown[]) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };

  const cancel = () => {
    if (timer) { clearTimeout(timer); timer = null; }
  };

  const flush = () => {
    cancel();
    if (lastArgs) fn(...lastArgs);
  };

  return { call, cancel, flush };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default { DebouncedRequest, createDebouncedFetch, debounce, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
