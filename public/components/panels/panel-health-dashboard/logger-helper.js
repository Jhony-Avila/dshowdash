import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "panel-health-dashboard:logger-helper";
const VERSION = "9.3.0-P2-ENTERPRISE";
const PANEL_NAME = "panel-health-dashboard";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
  const portLogger = _getPort("logger");
  if (portLogger) return portLogger;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger) return waLogger;
  }
  return null;
}
function debug(message, data = {}) {
  const logger = _getLogger();
  if (logger?.debug) {
    logger.debug(`[${PANEL_NAME}] ${message}`, data);
  } else if (!isStrict()) {
    console.log(`[${PANEL_NAME}] ${message}`, data);
  }
}
function info(message, data = {}) {
  const logger = _getLogger();
  if (logger?.info) {
    logger.info(`[${PANEL_NAME}] ${message}`, data);
  } else if (!isStrict()) {
    console.info(`[${PANEL_NAME}] ${message}`, data);
  }
}
function warn(message, data = {}) {
  const logger = _getLogger();
  if (logger?.warn) {
    logger.warn(`[${PANEL_NAME}] ${message}`, data);
  } else if (!isStrict()) {
    console.warn(`[${PANEL_NAME}] ${message}`, data);
  }
}
function error(message, err = null) {
  const logger = _getLogger();
  if (logger?.error) {
    logger.error(`[${PANEL_NAME}] ${message}`, err);
  } else if (!isStrict()) {
    console.error(`[${PANEL_NAME}] ${message}`, err);
  }
}
function healthCheck() {
  return {
    status: _getLogger() ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    strictMode: isStrict(),
    timestamp: Date.now()
  };
}
function createLogger(namespace) {
  const prefix = namespace ? `[${namespace}]` : `[${PANEL_NAME}]`;
  return {
    debug: (msg, data = {}) => {
      const logger = _getLogger();
      if (logger?.debug) {
        logger.debug(`${prefix} ${msg}`, data);
      } else if (!isStrict()) {
        console.log(`${prefix} ${msg}`, data);
      }
    },
    info: (msg, data = {}) => {
      const logger = _getLogger();
      if (logger?.info) {
        logger.info(`${prefix} ${msg}`, data);
      } else if (!isStrict()) {
        console.info(`${prefix} ${msg}`, data);
      }
    },
    warn: (msg, data = {}) => {
      const logger = _getLogger();
      if (logger?.warn) {
        logger.warn(`${prefix} ${msg}`, data);
      } else if (!isStrict()) {
        console.warn(`${prefix} ${msg}`, data);
      }
    },
    error: (msg, err = null) => {
      const logger = _getLogger();
      if (logger?.error) {
        logger.error(`${prefix} ${msg}`, err);
      } else if (!isStrict()) {
        console.error(`${prefix} ${msg}`, err);
      }
    }
  };
}
var logger_helper_default = { debug, info, warn, error, healthCheck, injectPorts, getPorts, createLogger, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createLogger,
  debug,
  logger_helper_default as default,
  error,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  warn
};
