const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap.helpers.utils";
function createUtilsHelpers(refs) {
  const r = refs;
  return {
    // Sanitizer
    sanitize(type, input) {
      return r.sanitizer?.[type]?.(input) || input;
    },
    escapeHtml(input) {
      return r.sanitizer?.escapeHtml(input) || input;
    },
    isSafe(input) {
      return r.sanitizer?.isSafe(input) ?? true;
    },
    // RateLimiter
    checkRateLimit(key) {
      return r.rateLimiter?.check(key);
    },
    withRateLimit(fn, key) {
      return r.rateLimiter?.attempt(fn, key);
    },
    // Workers
    runInWorker(type, payload, fn, opts) {
      return r.workerManager?.execute(type, payload, fn, opts);
    },
    // Fallback
    withFallback(primaryFn, fallbackFn, opts) {
      return r.fallbackSystem?.withFallback(primaryFn, fallbackFn, opts);
    },
    registerFallbackChain(operationId, chain) {
      return r.fallbackSystem?.register(operationId, chain);
    },
    executeFallback(operationId, context) {
      return r.fallbackSystem?.execute(operationId, context);
    },
    // Request Queue
    queueRequest(url, options) {
      return r.requestQueue?.add(url, options);
    },
    // Cache
    cacheGet(key, defaultValue) {
      return r.cacheManager?.get(key, defaultValue);
    },
    cacheSet(key, value, options) {
      return r.cacheManager?.set(key, value, options);
    },
    // Event Recorder
    startRecording() {
      return r.eventRecorder?.start();
    },
    stopRecording() {
      return r.eventRecorder?.stop();
    }
  };
}
var utils_default = { createUtilsHelpers };
export {
  MODULE_ID,
  VERSION,
  createUtilsHelpers,
  utils_default as default
};
