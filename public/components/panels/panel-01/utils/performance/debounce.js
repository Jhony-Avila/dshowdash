const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/performance/debounce";
class DebouncedRequest {
  constructor(fn, delay = 400) {
    this._fn = fn;
    this._delay = delay;
    this._timer = null;
    this._abortController = null;
    this._pending = null;
  }
  call(...args) {
    this.cancel();
    return new Promise((resolve, reject) => {
      this._timer = setTimeout(async () => {
        this._abortController = new AbortController();
        this._pending = { resolve, reject };
        try {
          const result = await this._fn(...args, this._abortController.signal);
          if (!this._abortController.signal.aborted) resolve(result);
        } catch (error) {
          if (error.name !== "AbortError") reject(error);
        } finally {
          this._pending = null;
          this._abortController = null;
        }
      }, this._delay);
    });
  }
  cancel() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    if (this._pending) {
      this._pending = null;
    }
  }
  isPending() {
    return this._timer !== null || this._pending !== null;
  }
  destroy() {
    this.cancel();
  }
}
function createDebouncedFetch(fetchFn, delay = 400) {
  const debounced = new DebouncedRequest(fetchFn, delay);
  const wrapper = (...args) => debounced.call(...args);
  wrapper.cancel = () => debounced.cancel();
  wrapper.isPending = () => debounced.isPending();
  wrapper.destroy = () => debounced.destroy();
  return wrapper;
}
function debounceWithCancel(fn, delay = 300) {
  let timer = null;
  let lastArgs = null;
  const debounced = (...args) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    return new Promise((resolve) => {
      timer = setTimeout(() => {
        timer = null;
        resolve(fn(...lastArgs));
      }, delay);
    });
  };
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  debounced.flush = () => {
    if (timer && lastArgs) {
      clearTimeout(timer);
      timer = null;
      return fn(...lastArgs);
    }
    return null;
  };
  return debounced;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var debounce_default = { DebouncedRequest, createDebouncedFetch, debounceWithCancel };
export {
  DebouncedRequest,
  MODULE_ID,
  VERSION,
  createDebouncedFetch,
  debounceWithCancel,
  debounce_default as default,
  healthCheck,
  info
};
