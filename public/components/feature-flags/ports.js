import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "components.feature-flags.ports";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function initPorts() {
  Ports.init();
}
function getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function isInitialized() {
  return Ports.isInitialized();
}
function isDebug() {
  const cfg = getPort("config");
  const app = cfg?.app;
  return app?.debug || false;
}
function log(level, ...args) {
  const logger = getPort("logger");
  if (!logger) return;
  const prefix = "[feature-flags]";
  if (level === "error") {
    logger.error?.(`${prefix}`, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(`${prefix}`, ...args);
    return;
  }
  if (isDebug() && logger.debug) {
    logger.debug(`${prefix}`, ...args);
  }
}
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const checks = {
    portsInitialized: portsSnapshot._initialized,
    loggerAvailable: !!getPort("logger")
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: portsSnapshot._initialized,
    timestamp: Date.now()
  };
}
function info() {
  const portsSnapshot = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: portsSnapshot._initialized,
    loggerAvailable: !!getPort("logger"),
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var ports_default = {
  initPorts,
  getPort,
  injectPorts,
  getPorts,
  isInitialized,
  isDebug,
  log,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  ports_default as default,
  getPort,
  getPorts,
  healthCheck,
  info,
  initPorts,
  injectPorts,
  isDebug,
  isInitialized,
  log
};
