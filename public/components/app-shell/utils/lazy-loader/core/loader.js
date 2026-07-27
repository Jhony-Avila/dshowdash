import { cache, pending, incrementMetric, getConfig } from "../state.js";
import { LOAD_STATES } from "../constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.lazy-loader.core.loader";
function loadWithTimeout(url, timeout) {
  return new Promise((resolve, reject) => {
    let timeoutId = null;
    let settled = false;
    function settle(result, isError) {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (isError) reject(result);
      else resolve(result);
    }
    timeoutId = setTimeout(() => {
      settle(new Error(`Load timeout: ${url}`), true);
    }, timeout);
    import(url).then((module) => {
      settle(module, false);
    }).catch((error) => {
      settle(error, true);
    });
  });
}
function loadWithRetry(url, options) {
  options = options || {};
  const maxRetries = options.retries || getConfig().retryCount;
  const retryDelay = options.retryDelay || getConfig().retryDelay;
  const timeout = options.timeout || getConfig().timeout;
  let attempt = 0;
  function tryLoad() {
    attempt++;
    return loadWithTimeout(url, timeout).catch((error) => {
      if (attempt < maxRetries) {
        return new Promise((resolve) => {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          setTimeout(() => {
            resolve(tryLoad());
          }, delay);
        });
      }
      throw error;
    });
  }
  return tryLoad();
}
function load(url, options) {
  options = options || {};
  const useCache = options.cache !== false;
  const forceReload = options.force === true;
  if (useCache && !forceReload && cache.has(url)) {
    const cached = cache.get(url);
    if (cached.state === LOAD_STATES.LOADED) {
      incrementMetric("cachedHits");
      return Promise.resolve(cached.module);
    }
  }
  if (pending.has(url)) {
    return pending.get(url);
  }
  const startTime = Date.now();
  incrementMetric("totalLoads");
  cache.set(url, { state: LOAD_STATES.LOADING, module: null, error: null });
  const loadPromise = loadWithRetry(url, options).then((module) => {
    const duration = Date.now() - startTime;
    cache.set(url, {
      state: LOAD_STATES.LOADED,
      module,
      error: null,
      loadedAt: Date.now(),
      duration
    });
    pending.delete(url);
    incrementMetric("successfulLoads");
    incrementMetric("totalLoadTime", duration);
    return module;
  }).catch((error) => {
    cache.set(url, {
      state: LOAD_STATES.ERROR,
      module: null,
      error: error.message,
      failedAt: Date.now()
    });
    pending.delete(url);
    incrementMetric("failedLoads");
    throw error;
  });
  pending.set(url, loadPromise);
  return loadPromise;
}
var loader_default = {
  loadWithTimeout,
  loadWithRetry,
  load
};
export {
  MODULE_ID,
  VERSION,
  loader_default as default,
  load,
  loadWithRetry,
  loadWithTimeout
};
