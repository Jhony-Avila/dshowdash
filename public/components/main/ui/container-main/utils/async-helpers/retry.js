import { DEFAULT_TIMEOUTS } from "./constants.js";
import { createAbortController } from "./abort-controller.js";
import { withTimeout } from "./timeout.js";
import { incrementRetried } from "./metrics.js";
const VERSION = "2.0.0-MODULAR";
const MODULE_ID = "container-main:async-helpers:retry";
async function retryWithBackoff(asyncFn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1e3,
    maxDelay = 3e4,
    factor = 2,
    timeoutPerAttempt = DEFAULT_TIMEOUTS.MEDIUM,
    key = null,
    shouldRetry = (error, attempt) => attempt < maxRetries,
    onRetry = null
  } = options;
  const { signal, cleanup } = createAbortController(key);
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal.aborted) {
      cleanup();
      throw new Error("Operation aborted");
    }
    try {
      const result = await withTimeout(
        asyncFn(signal, attempt),
        timeoutPerAttempt,
        { operation: `retry attempt ${attempt + 1}/${maxRetries + 1}` }
      );
      cleanup();
      return result;
    } catch (error) {
      lastError = error;
      if (signal.aborted || !shouldRetry(error, attempt)) {
        cleanup();
        throw error;
      }
      if (attempt < maxRetries) {
        incrementRetried();
        const delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);
        const jitter = delay * 0.1 * Math.random();
        onRetry?.(error, attempt + 1, delay + jitter);
        await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      }
    }
  }
  cleanup();
  throw lastError;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["retryWithBackoff"]
  };
}
var retry_default = {
  VERSION,
  MODULE_ID,
  retryWithBackoff,
  info
};
export {
  MODULE_ID,
  VERSION,
  retry_default as default,
  info,
  retryWithBackoff
};
