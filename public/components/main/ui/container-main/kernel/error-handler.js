import { MODULE_ID } from "./constants.js";
import { METRIC_TYPES } from "../resources/metrics-persistence.js";
import { KERNEL_UI_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "10.0.0-INTEGRATED";
function createErrorHandler(options = {}) {
  const { metricsManager, eventBridge, onError } = options;
  const _errorMetrics = {
    totalErrors: 0,
    lastError: null
  };
  return {
    handle(error, context = "") {
      _errorMetrics.totalErrors++;
      _errorMetrics.lastError = {
        error: error?.message || error,
        context,
        timestamp: Date.now()
      };
      metricsManager?.record(MODULE_ID, "error", 1, {
        type: METRIC_TYPES.COUNTER,
        tags: { context }
      });
      onError?.(error, context);
      eventBridge?.emit(KERNEL_UI_EVENT_NAMES.ERROR, { error: error?.message, context });
    },
    getMetrics() {
      return { ..._errorMetrics };
    },
    clearErrors() {
      _errorMetrics.totalErrors = 0;
      _errorMetrics.lastError = null;
    },
    getTotalErrors() {
      return _errorMetrics.totalErrors;
    },
    getLastError() {
      return _errorMetrics.lastError;
    }
  };
}
var error_handler_default = { createErrorHandler };
export {
  VERSION,
  createErrorHandler,
  error_handler_default as default
};
