import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-12.utils.logger";
const VERSION = "9.3.0-P2-ENTERPRISE";
const COMPONENT_ID = "painel-12";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
_initPorts();
const log = {
  info: (action, details) => {
    const logger = _getPort("logger");
    if (logger?.info) logger.info(action, { component: COMPONENT_ID, ...details });
  },
  warn: (action, details) => {
    const logger = _getPort("logger");
    if (logger?.warn) logger.warn(action, { component: COMPONENT_ID, ...details });
  },
  error: (action, details) => {
    const logger = _getPort("logger");
    if (logger?.error) logger.error(action, { component: COMPONENT_ID, ...details });
  },
  debug: (action, details) => {
    const logger = _getPort("logger");
    if (logger?.debug) logger.debug(action, { component: COMPONENT_ID, ...details });
  }
};
const setLogLevel = (level) => {
  const logger = _getPort("logger");
  if (logger?.setLevel) logger.setLevel(level);
};
const debug = (action, details = {}) => {
  log.debug(action, details);
};
const logInfo = (action, details = {}) => {
  log.info(action, details);
};
const warn = (action, details = {}) => {
  log.warn(action, details);
};
const error = (action, details = {}) => {
  log.error(action, details);
};
const logAction = (action, details = {}) => {
  log.info(action, details);
};
const measurePerformance = (action, startTime) => {
  const duration = performance.now() - startTime;
  log.info(action, { duration: `${duration.toFixed(2)}ms` });
  return duration;
};
const startTimer = (action) => {
  const startTime = performance.now();
  return { end: (details = {}) => {
    const duration = performance.now() - startTime;
    log.info(action, { ...details, duration: `${duration.toFixed(2)}ms` });
    return duration;
  } };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { loggerReady: true } });
var logger_default = { MODULE_ID, VERSION, log, setLogLevel, debug, logInfo, warn, error, logAction, measurePerformance, startTimer, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  debug,
  logger_default as default,
  error,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  logAction,
  logInfo,
  measurePerformance,
  setLogLevel,
  startTimer,
  warn
};
