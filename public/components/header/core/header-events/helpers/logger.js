import { MODULE_ID } from "../constants.js";
import { getPort } from "../ports.js";
const VERSION = "1.1.0-ES6";
function debugEnabled() {
  const cfg = getPort("config");
  return cfg && cfg.app && cfg.app.debug;
}
function log(level, msg, data) {
  const logger = getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  try {
    if (level === "error" && logger.error) {
      logger.error(prefix, msg, data);
      return;
    }
    if (level === "warn" && logger.warn) {
      logger.warn(prefix, msg, data);
      return;
    }
    if (level === "info" && logger.info) {
      logger.info(prefix, msg, data);
      return;
    }
    if (debugEnabled() && logger.debug) {
      logger.debug(prefix, msg, data);
    }
  } catch (e) {
  }
}
export {
  VERSION,
  debugEnabled,
  log
};
