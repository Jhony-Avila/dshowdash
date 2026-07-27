const VERSION = "9.3.0-P2-ENTERPRISE";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "panel-files/telemetry/logger";
const PANEL_NAME = "panel-files";
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
function logDebug(message, data = {}) {
  const logger = _getLogger();
  if (logger) {
    logger.debug(`[${PANEL_NAME}] ${message}`, data);
  }
}
function logInfo(message, data = {}) {
  const logger = _getLogger();
  if (logger) {
    logger.info(`[${PANEL_NAME}] ${message}`, data);
  }
}
function logWarn(message, data = {}) {
  const logger = _getLogger();
  if (logger) {
    logger.warn(`[${PANEL_NAME}] ${message}`, data);
  }
}
function logError(message, error = null) {
  const logger = _getLogger();
  if (logger) {
    logger.error(`[${PANEL_NAME}] ${message}`, error);
  }
}
var logger_default = { logDebug, logInfo, logWarn, logError, injectLogger };
const Logger = { logDebug, logInfo, logWarn, logError, injectLogger };
export {
  Logger,
  MODULE_ID,
  VERSION,
  logger_default as default,
  injectLogger,
  logDebug,
  logError,
  logInfo,
  logWarn
};
