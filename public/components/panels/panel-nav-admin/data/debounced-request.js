import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE2";
const MODULE_ID = "panel-nav-admin.data.debounced-request";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[DebouncedRequest]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
class DebouncedRequest {
  /**
   * @param {Function} fn — Async function to debounce. Receives (args, { signal })
   * @param {Object} [options]
   * @param {number} [options.delay=400] — Debounce delay in ms
   * @param {boolean} [options.leading=false] — Execute on leading edge
   */
  constructor(fn, options = {}) {
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
  call(...args) {
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
  async _execute(args) {
    this._pending = true;
    this._abortController = new AbortController();
    this._callCount++;
    try {
      const result = await this._fn(...args, { signal: this._abortController.signal });
      this._pending = false;
      return result;
    } catch (error) {
      this._pending = false;
      if (error.name === "AbortError") {
        _log("debug", "Request aborted");
        return void 0;
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
    return Promise.resolve(void 0);
  }
  /** @returns {boolean} Whether a call is pending or in-flight */
  isPending() {
    return this._pending || this._timer !== null;
  }
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
function createDebouncedFetch(fetchFn, delay = 400) {
  return new DebouncedRequest(fetchFn, { delay });
}
function debounce(fn, delay = 300) {
  let timer = null;
  let lastArgs = null;
  const call = (...args) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };
  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  const flush = () => {
    cancel();
    if (lastArgs) fn(...lastArgs);
  };
  return { call, cancel, flush };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var debounced_request_default = { DebouncedRequest, createDebouncedFetch, debounce, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  DebouncedRequest,
  MODULE_ID,
  VERSION,
  createDebouncedFetch,
  debounce,
  debounced_request_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
