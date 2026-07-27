import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.5.0-P2-ENTERPRISE";
const MODULE_ID = "preloader.core.logger";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _metrics = { logs: 0, debugSkipped: 0 };
const isDebugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (!isDebugEnabled() && level === "debug") {
    _metrics.debugSkipped++;
    return;
  }
  _metrics.logs++;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, [`[${MODULE_ID}]`].concat(args));
};
const getMetrics = () => ({ debugEnabled: isDebugEnabled(), logs: _metrics.logs, debugSkipped: _metrics.debugSkipped });
const info = () => ({ moduleId: MODULE_ID, version: VERSION, debugEnabled: isDebugEnabled(), portsInitialized: Ports.isInitialized(), metrics: getMetrics(), timestamp: Date.now() });
const healthCheck = () => {
  const loggerAvailable = !!_getPort("logger");
  const checks = { loggerAvailable, portsInitialized: Ports.isInitialized() };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  return { status: passed === checkKeys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${checkKeys.length}`, version: VERSION, moduleId: MODULE_ID, checks, portsInitialized: Ports.isInitialized(), metrics: getMetrics(), timestamp: Date.now() };
};
var logger_default = { VERSION, MODULE_ID, log, isDebugEnabled, getMetrics, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  logger_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isDebugEnabled,
  log
};
