import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-charts:telemetry:logger";
const VERSION = "9.3.0-P2-ENTERPRISE";
const PANEL_NAME = "panel-charts";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _getLogger() {
  const lg = _getPort("logger");
  if (lg) return lg;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const wab = window.Core.windowAdapter.get("Logger");
    if (wab) return wab;
  }
  return null;
}
function logDebug(message, data = {}) {
  const logger = _getLogger();
  if (logger && logger.debug) {
    logger.debug(`[${PANEL_NAME}] ${message}`, data);
  }
}
function logInfo(message, data = {}) {
  const logger = _getLogger();
  if (logger && logger.info) {
    logger.info(`[${PANEL_NAME}] ${message}`, data);
  }
}
function logWarn(message, data = {}) {
  const logger = _getLogger();
  if (logger && logger.warn) {
    logger.warn(`[${PANEL_NAME}] ${message}`, data);
  }
}
function logError(message, error = null) {
  const logger = _getLogger();
  if (logger && logger.error) {
    logger.error(`[${PANEL_NAME}] ${message}`, error);
  }
}
var logger_default = { logDebug, logInfo, logWarn, logError, injectPorts, getPorts, VERSION, MODULE_ID };
const Logger = { logDebug, logInfo, logWarn, logError, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  Logger,
  MODULE_ID,
  VERSION,
  logger_default as default,
  getPorts,
  injectPorts,
  logDebug,
  logError,
  logInfo,
  logWarn
};
