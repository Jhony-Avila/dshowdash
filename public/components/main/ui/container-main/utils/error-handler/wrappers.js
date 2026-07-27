import { ERROR_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.error-handler.wrappers";
function createWrappers(options = {}) {
  const { errorStore, metricsTracker, emitter, globalInstaller } = options;
  function processError(error, processOptions = {}) {
    const { context: contextOpt = {}, onError, fallback, recover = false, rethrow = true } = processOptions;
    const errorInfo = errorStore.createErrorInfo(error, contextOpt);
    errorInfo.handled = true;
    metricsTracker.incrementTotal();
    metricsTracker.incrementHandled();
    metricsTracker.trackCategory(errorInfo.category);
    metricsTracker.trackSeverity(errorInfo.severity);
    errorStore.log(errorInfo);
    onError?.(errorInfo);
    globalInstaller?.getGlobalHandler()?.(errorInfo);
    if (recover && fallback !== void 0) {
      errorInfo.recovered = true;
      errorInfo.recoveryAttempts++;
      metricsTracker.incrementRecovered();
      emitter?.emit(ERROR_EVENT_NAMES.RECOVERED, { errorInfo });
      return typeof fallback === "function" ? fallback(error, errorInfo) : fallback;
    }
    if (rethrow) throw error;
    return void 0;
  }
  return {
    withErrorBoundary(fn, wrapperOptions = {}) {
      const { onError, fallback, recover = false, context: contextOpt2 = {}, moduleId } = wrapperOptions;
      return function(...args) {
        try {
          const result = fn.apply(this, args);
          if (result instanceof Promise) {
            return result.catch((error) => processError(error, { context: { ...contextOpt2, moduleId }, onError, fallback, recover, rethrow: !recover }));
          }
          return result;
        } catch (error) {
          return processError(error, { context: { ...contextOpt2, moduleId }, onError, fallback, recover, rethrow: !recover });
        }
      };
    },
    withAsyncErrorBoundary(asyncFn, wrapperOptions = {}) {
      return this.withErrorBoundary(asyncFn, wrapperOptions);
    },
    tryCatch(fn, tryCatchOptions = {}) {
      const { onError, defaultValue = void 0, rethrow = false, context: contextOpt3 = {} } = tryCatchOptions;
      try {
        return fn();
      } catch (error) {
        const errorInfo = errorStore.createErrorInfo(error, contextOpt3);
        errorInfo.handled = true;
        metricsTracker.incrementTotal();
        metricsTracker.incrementHandled();
        metricsTracker.trackCategory(errorInfo.category);
        metricsTracker.trackSeverity(errorInfo.severity);
        errorStore.log(errorInfo);
        onError?.(errorInfo);
        if (rethrow) throw error;
        return defaultValue;
      }
    },
    async tryCatchAsync(asyncFn, tryCatchOptions = {}) {
      const { onError, defaultValue = void 0, rethrow = false, context: contextOpt4 = {}, timeout = 0 } = tryCatchOptions;
      try {
        if (timeout > 0) {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout);
          });
          return await Promise.race([asyncFn(), timeoutPromise]);
        }
        return await asyncFn();
      } catch (error) {
        const errorInfo = errorStore.createErrorInfo(error, { ...contextOpt4, timeout });
        errorInfo.handled = true;
        metricsTracker.incrementTotal();
        metricsTracker.incrementHandled();
        metricsTracker.trackCategory(errorInfo.category);
        metricsTracker.trackSeverity(errorInfo.severity);
        errorStore.log(errorInfo);
        onError?.(errorInfo);
        if (rethrow) throw error;
        return defaultValue;
      }
    }
  };
}
var wrappers_default = { createWrappers };
export {
  MODULE_ID,
  VERSION,
  createWrappers,
  wrappers_default as default
};
