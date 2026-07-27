const VERSION = "9.3.0-P2-ENTERPRISE";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "panel-09/utils/logger";
const PANEL_NAME = "panel-09";
let _injectedLogger = null;
function injectLogger(logger) {
  _injectedLogger = logger;
}
function _getLogger() {
  if (_injectedLogger) return _injectedLogger;
  if (typeof window === "undefined") return null;
  const strictMode = isStrict();
  if (window.Core?.windowAdapter?.get) {
    const wl = window.Core.windowAdapter.get("Logger");
    if (wl) return wl;
  }
  if (strictMode) return null;
  return null;
}
function log(message, data = {}) {
  const logger = _getLogger();
  if (logger) {
    logger.debug(`[${PANEL_NAME}] ${message}`, data);
  } else {
    console.log(`[${PANEL_NAME}] ${message}`, data);
  }
}
function warn(message, data = {}) {
  const logger = _getLogger();
  if (logger) {
    logger.warn(`[${PANEL_NAME}] ${message}`, data);
  } else {
    console.warn(`[${PANEL_NAME}] ${message}`, data);
  }
}
function error(message, err = null) {
  const logger = _getLogger();
  if (logger) {
    logger.error(`[${PANEL_NAME}] ${message}`, err);
  } else {
    console.error(`[${PANEL_NAME}] ${message}`, err);
  }
}
var logger_default = { log, warn, error, injectLogger };
export {
  MODULE_ID,
  VERSION,
  logger_default as default,
  error,
  injectLogger,
  log,
  warn
};
