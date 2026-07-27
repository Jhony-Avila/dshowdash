import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-11:utils:logger";
const VERSION = "9.3.0-P2-ENTERPRISE";
const PANEL_NAME = "panel-11";
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
function log(message, data = {}) {
  const logger = _getLogger();
  if (logger && logger.debug) {
    logger.debug(`[${PANEL_NAME}] ${message}`, data);
  }
}
function warn(message, data = {}) {
  const logger = _getLogger();
  if (logger && logger.warn) {
    logger.warn(`[${PANEL_NAME}] ${message}`, data);
  }
}
function error(message, err = null) {
  const logger = _getLogger();
  if (logger && logger.error) {
    logger.error(`[${PANEL_NAME}] ${message}`, err);
  }
}
var logger_default = { log, warn, error, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  logger_default as default,
  error,
  getPorts,
  injectPorts,
  log,
  warn
};
