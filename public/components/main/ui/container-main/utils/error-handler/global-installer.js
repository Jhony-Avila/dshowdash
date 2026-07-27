import { ERROR_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.error-handler.global-installer";
const IGNORED_ERROR_PATTERNS = [
  "ResizeObserver loop completed with undelivered notifications",
  "ResizeObserver loop limit exceeded"
];
function isBenignError(message) {
  if (!message) return false;
  return IGNORED_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}
function createGlobalInstaller(options = {}) {
  const { errorStore, metricsTracker, emitter, logger } = options;
  let _globalHandler = null;
  let _installed = false;
  return {
    install(installOptions = {}) {
      const { onError, captureUnhandled = true, captureRejections = true } = installOptions;
      _globalHandler = onError;
      if (typeof window === "undefined") return;
      if (_installed) return;
      if (captureUnhandled) {
        window.addEventListener("error", (event) => {
          const errorMessage = event.error?.message || event.message || "";
          if (isBenignError(errorMessage)) {
            return;
          }
          const errorInfo = errorStore.createErrorInfo(event.error || new Error(event.message), {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            type: "uncaught",
            operation: "global"
          });
          metricsTracker.incrementTotal();
          metricsTracker.incrementUnhandled();
          metricsTracker.trackCategory(errorInfo.category);
          metricsTracker.trackSeverity(errorInfo.severity);
          errorStore.log(errorInfo);
          _globalHandler?.(errorInfo);
          emitter?.emit(ERROR_EVENT_NAMES.UNHANDLED, { errorInfo });
        });
      }
      if (captureRejections) {
        window.addEventListener("unhandledrejection", (event) => {
          const rejectMessage = event.reason?.message || String(event.reason || "");
          if (isBenignError(rejectMessage)) {
            return;
          }
          const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
          const errorInfo = errorStore.createErrorInfo(error, {
            type: "unhandledrejection",
            operation: "promise"
          });
          metricsTracker.incrementTotal();
          metricsTracker.incrementUnhandled();
          metricsTracker.trackCategory(errorInfo.category);
          metricsTracker.trackSeverity(errorInfo.severity);
          errorStore.log(errorInfo);
          _globalHandler?.(errorInfo);
          emitter?.emit(ERROR_EVENT_NAMES.REJECTION, { errorInfo });
        });
      }
      _installed = true;
      logger?.debug("Error handler installed", { captureUnhandled, captureRejections });
    },
    getGlobalHandler() {
      return _globalHandler;
    },
    setGlobalHandler(handler) {
      _globalHandler = handler;
    },
    isInstalled() {
      return _installed;
    }
  };
}
var global_installer_default = { createGlobalInstaller };
export {
  MODULE_ID,
  VERSION,
  createGlobalInstaller,
  global_installer_default as default
};
