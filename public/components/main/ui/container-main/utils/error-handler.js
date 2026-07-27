import { logFromErrorHandler, createLogger } from "./logger.js";
import { ERROR_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
import {
  VERSION,
  MODULE_ID,
  ERROR_SEVERITY,
  ERROR_CATEGORIES,
  RECOVERY_ACTIONS,
  createErrorStore,
  createMetricsTracker,
  createGlobalInstaller,
  createWrappers,
  createComponentBoundaryFactory
} from "./error-handler/index.js";
const _logger = createLogger(MODULE_ID);
let _eventBus = null;
const emitter = {
  emit(event, data) {
    if (_eventBus?.emit) {
      _eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }
};
const metricsTracker = createMetricsTracker();
const errorStore = createErrorStore({
  logCallback: (errorInfo) => {
    logFromErrorHandler(errorInfo);
    emitter.emit(ERROR_EVENT_NAMES.LOGGED, { errorInfo });
  }
});
const globalInstaller = createGlobalInstaller({
  errorStore,
  metricsTracker,
  emitter,
  logger: _logger
});
const wrappers = createWrappers({
  errorStore,
  metricsTracker,
  emitter,
  globalInstaller
});
const componentBoundaryFactory = createComponentBoundaryFactory({
  wrappers,
  errorStore,
  logger: _logger
});
function injectEventBus(eventBus) {
  _eventBus = eventBus;
}
function install(options = {}) {
  if (options.eventBus) _eventBus = options.eventBus;
  globalInstaller.install(options);
}
function withErrorBoundary(fn, options = {}) {
  return wrappers.withErrorBoundary(fn, options);
}
function withAsyncErrorBoundary(asyncFn, options = {}) {
  return wrappers.withAsyncErrorBoundary(asyncFn, options);
}
function tryCatch(fn, options = {}) {
  return wrappers.tryCatch(fn, options);
}
async function tryCatchAsync(asyncFn, options = {}) {
  return wrappers.tryCatchAsync(asyncFn, options);
}
function createComponentBoundary(componentId, options = {}) {
  return componentBoundaryFactory.create(componentId, options);
}
function createErrorHandler(moduleId) {
  return {
    handle: (error, context = {}) => {
      const errorInfo = errorStore.createErrorInfo(error, { ...context, moduleId });
      errorInfo.handled = true;
      metricsTracker.track(errorInfo);
      errorStore.log(errorInfo);
      return errorInfo;
    },
    wrap: (fn, opts = {}) => wrappers.withErrorBoundary(fn, { ...opts, moduleId }),
    wrapAsync: (fn, opts = {}) => wrappers.withAsyncErrorBoundary(fn, { ...opts, moduleId }),
    tryCatch: (fn, opts = {}) => wrappers.tryCatch(fn, { ...opts, context: { ...opts.context, moduleId } }),
    // @ts-expect-error TS migration - TS2345
    tryCatchAsync: (fn, opts = {}) => wrappers.tryCatchAsync(fn, { ...opts, context: { ...opts.context, moduleId } })
  };
}
function getErrorLog(options = {}) {
  return errorStore.getLog(options);
}
function clearErrorLog() {
  return errorStore.clear();
}
function getMetrics() {
  return metricsTracker.getMetrics();
}
function resetMetrics() {
  metricsTracker.reset();
}
function healthCheck() {
  const recentErrors = errorStore.getRecent(6e4).length;
  const criticalErrors = errorStore.getCritical(3e5, ERROR_SEVERITY.CRITICAL).length;
  const metrics = metricsTracker.getMetrics();
  let status = "HEALTHY";
  if (criticalErrors > 0) status = "CRITICAL";
  else if (recentErrors > 10) status = "WARNING";
  else if (metrics.unhandled > metrics.handled) status = "DEGRADED";
  return { status, version: VERSION, moduleId: MODULE_ID, modular: true, metrics, recentErrors, criticalErrors, logSize: errorStore.size() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, modular: true, categories: Object.keys(ERROR_CATEGORIES), severities: Object.keys(ERROR_SEVERITY), recoveryActions: Object.keys(RECOVERY_ACTIONS), metrics: metricsTracker.getMetrics() };
}
var error_handler_default = {
  VERSION,
  MODULE_ID,
  ERROR_SEVERITY,
  ERROR_CATEGORIES,
  RECOVERY_ACTIONS,
  install,
  injectEventBus,
  withErrorBoundary,
  withAsyncErrorBoundary,
  tryCatch,
  tryCatchAsync,
  createComponentBoundary,
  createErrorHandler,
  getErrorLog,
  clearErrorLog,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
export {
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
  MODULE_ID,
  RECOVERY_ACTIONS,
  VERSION,
  clearErrorLog,
  createComponentBoundary,
  createErrorHandler,
  error_handler_default as default,
  getErrorLog,
  getMetrics,
  healthCheck,
  info,
  injectEventBus,
  install,
  resetMetrics,
  tryCatch,
  tryCatchAsync,
  withAsyncErrorBoundary,
  withErrorBoundary
};
