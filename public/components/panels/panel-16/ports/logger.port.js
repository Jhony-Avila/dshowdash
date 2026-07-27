const VERSION = "9.3.0-P2-ENTERPRISE";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "panel-16/ports/logger.port";
const PANEL_NAME = "panel-16";
let loggerInstance = null;
function setLogger(logger) {
  loggerInstance = logger;
}
function getLogger() {
  if (loggerInstance) return loggerInstance;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const logger = window.Core.windowAdapter.get("Logger");
    if (logger) return logger;
  }
  const strictMode = isStrict();
  if (strictMode) return null;
  return null;
}
function debug(message, data = {}) {
  const logger = getLogger();
  if (logger?.debug) logger.debug(`[${PANEL_NAME}] ${message}`, data);
}
function info(message, data = {}) {
  const logger = getLogger();
  if (logger?.info) logger.info(`[${PANEL_NAME}] ${message}`, data);
}
function warn(message, data = {}) {
  const logger = getLogger();
  if (logger?.warn) logger.warn(`[${PANEL_NAME}] ${message}`, data);
}
function error(message, err = null) {
  const logger = getLogger();
  if (logger?.error) logger.error(`[${PANEL_NAME}] ${message}`, err);
}
var logger_port_default = { setLogger, getLogger, debug, info, warn, error };
const LoggerPort = { setLogger, getLogger, debug, info, warn, error };
export {
  LoggerPort,
  MODULE_ID,
  VERSION,
  debug,
  logger_port_default as default,
  error,
  getLogger,
  info,
  setLogger,
  warn
};
