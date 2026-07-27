import { createLogger } from "/assets/js/core/logger-global/index.js";
import { MODULE_ID } from "../constants.js";
import { _listeners, incrementMetric } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const _logger = createLogger(MODULE_ID);
function log(level, ...args) {
  const message = args.map((a) => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ");
  if (level === "error") _logger.error(message);
  else if (level === "warn") _logger.warn(message);
  else _logger.debug(message);
}
function emit(event, data) {
  _listeners.forEach((listener) => {
    try {
      listener({ type: event, data, timestamp: Date.now() });
    } catch (e) {
      incrementMetric("errors");
    }
  });
}
export {
  VERSION,
  emit,
  log
};
