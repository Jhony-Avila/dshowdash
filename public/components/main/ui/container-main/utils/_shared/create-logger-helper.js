import { createLogger } from "/assets/js/core/logger-global/index.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils._shared.create-logger-helper";
function createLoggerHelper(MODULE_ID2, _listeners, incrementMetric) {
  const _logger = createLogger(MODULE_ID2);
  function _log(level, ...args) {
    const message = args.map((a) => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ");
    if (level === "error") _logger.error(message);
    else if (level === "warn") _logger.warn(message);
    else _logger.debug(message);
  }
  function _emit(event, data) {
    _listeners.forEach((listener) => {
      try {
        listener({ type: event, data, timestamp: Date.now() });
      } catch (e) {
        incrementMetric("errors");
      }
    });
  }
  return { _log, _emit };
}
export {
  MODULE_ID,
  VERSION,
  createLoggerHelper
};
