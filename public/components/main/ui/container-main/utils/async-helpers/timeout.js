import { DEFAULT_TIMEOUTS } from "./constants.js";
import { incrementTotal, incrementCompleted, incrementTimedOut, updateDurationMetrics } from "./metrics.js";
const VERSION = "2.0.0-MODULAR";
const MODULE_ID = "container-main:async-helpers:timeout";
function withTimeout(promise, timeoutMs = DEFAULT_TIMEOUTS.MEDIUM, options = {}) {
  const {
    timeoutError = null,
    onTimeout = null,
    operation = "async operation"
  } = options;
  if (!(promise instanceof Promise)) {
    return Promise.resolve(promise);
  }
  incrementTotal();
  const startTime = performance.now();
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        incrementTimedOut();
        const error = timeoutError || new Error(`Timeout: ${operation} exceeded ${timeoutMs}ms`);
        error.name = "TimeoutError";
        error.timeout = timeoutMs;
        error.operation = operation;
        onTimeout?.(error);
        reject(error);
      }
    }, timeoutMs);
    promise.then((result) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        incrementCompleted();
        updateDurationMetrics(performance.now() - startTime);
        resolve(result);
      }
    }).catch((error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  });
}
async function executeWithTimeout(asyncFn, timeoutMs = DEFAULT_TIMEOUTS.MEDIUM, options = {}) {
  const { args = [], context = null, operation = "function execution" } = options;
  return withTimeout(
    asyncFn.apply(context, args),
    timeoutMs,
    { ...options, operation }
  );
}
async function withAbortAndTimeout(asyncFn, options = {}) {
  const {
    key = null,
    timeoutMs = DEFAULT_TIMEOUTS.MEDIUM,
    onAbort = null,
    onTimeout = null,
    operation = "async operation",
    createAbortController
  } = options;
  if (!createAbortController) {
    throw new Error("createAbortController is required");
  }
  const { controller, signal, cleanup } = createAbortController(key);
  const startTime = performance.now();
  incrementTotal();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Timeout after ${timeoutMs}ms`));
  }, timeoutMs);
  try {
    const result = await asyncFn(signal);
    clearTimeout(timeoutId);
    cleanup();
    incrementCompleted();
    updateDurationMetrics(performance.now() - startTime);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    cleanup();
    if (error.name === "AbortError" || signal.aborted) {
      if (error.message?.includes("Timeout")) {
        incrementTimedOut();
        onTimeout?.(error);
      } else {
        onAbort?.(error);
      }
      return null;
    }
    throw error;
  }
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["withTimeout", "executeWithTimeout", "withAbortAndTimeout"]
  };
}
var timeout_default = {
  VERSION,
  MODULE_ID,
  withTimeout,
  executeWithTimeout,
  withAbortAndTimeout,
  info
};
export {
  MODULE_ID,
  VERSION,
  timeout_default as default,
  executeWithTimeout,
  info,
  withAbortAndTimeout,
  withTimeout
};
