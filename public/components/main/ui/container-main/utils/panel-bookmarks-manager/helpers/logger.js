import { MODULE_ID } from "../constants.js";
import { _listeners, incrementMetric } from "../state.js";
import { createLogger } from "../../logger.js";
const VERSION = "15.2.0-MODULAR";
const logger = createLogger(MODULE_ID);
function log(level, ...args) {
  const message = args[0];
  const data = args.length > 1 ? args.slice(1) : void 0;
  if (level === "error") logger.error(message, data);
  else if (level === "warn") logger.warn(message, data);
  else if (level === "debug") logger.debug(message, data);
  else logger.info(message, data);
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
function generateId() {
  return `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
export {
  VERSION,
  emit,
  generateId,
  log
};
