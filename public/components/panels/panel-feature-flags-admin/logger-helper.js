import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isDebug } from "./ports.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-feature-flags-admin:logger-helper";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const log = (level, ...args) => {
  if (!isDebug() && level === "debug") return;
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, ["[Panel-Feature-Flags-Admin]", ...args]);
};
const createLogger = () => ({ debug: (...args) => {
  log("debug", ...args);
}, info: (...args) => {
  log("info", ...args);
}, warn: (...args) => {
  log("warn", ...args);
}, error: (...args) => {
  log("error", ...args);
} });
const info = () => {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized };
};
var logger_helper_default = { log, createLogger };
export {
  MODULE_ID,
  VERSION,
  createLogger,
  logger_helper_default as default,
  getPorts,
  info,
  injectPorts,
  log
};
