import { DEFAULT_TIMEOUTS } from "./constants.js";
import { createAbortController } from "./abort-controller.js";
import { incrementTotal, incrementCompleted, incrementTimedOut, updateDurationMetrics } from "./metrics.js";
const VERSION = "2.0.0-MODULAR";
const MODULE_ID = "container-main:async-helpers:fetch";
async function fetchWithTimeout(url, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUTS.FETCH,
    abortKey = null,
    onTimeout = null,
    ...fetchOptions
  } = options;
  const { controller, signal, cleanup } = createAbortController(abortKey || `fetch-${url}`);
  const startTime = performance.now();
  incrementTotal();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Fetch timeout after ${timeout}ms: ${url}`));
  }, timeout);
  try {
    const response = await fetch(url, { ...fetchOptions, signal });
    clearTimeout(timeoutId);
    cleanup();
    incrementCompleted();
    updateDurationMetrics(performance.now() - startTime);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    cleanup();
    if (error.name === "AbortError") {
      incrementTimedOut();
      const timeoutError = new Error(`Request timeout: ${url}`);
      timeoutError.name = "TimeoutError";
      timeoutError.url = url;
      onTimeout?.(timeoutError);
      throw timeoutError;
    }
    throw error;
  }
}
const fetchWithAbort = fetchWithTimeout;
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["fetchWithTimeout", "fetchWithAbort"]
  };
}
function destroy() {
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var fetch_default = {
  VERSION,
  MODULE_ID,
  fetchWithTimeout,
  fetchWithAbort,
  info
};
export {
  MODULE_ID,
  VERSION,
  fetch_default as default,
  fetchWithAbort,
  fetchWithTimeout,
  healthCheck,
  info
};
