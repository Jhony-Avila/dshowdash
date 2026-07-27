import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { MODULE_ID as CONTROLLER_MODULE_ID, PRESET_DAYS } from "./constants.js";
import { TABS } from "./contracts.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-audit-trail.core.helpers";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
_initPorts();
const log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${CONTROLLER_MODULE_ID}]`;
  if (level === "error" && logger.error) {
    logger.error(prefix, ...args);
    return;
  }
  if (level === "warn" && logger.warn) {
    logger.warn(prefix, ...args);
    return;
  }
  if (logger.debug) logger.debug(prefix, ...args);
};
const checkAuth = () => {
  try {
    const gs = _getPort("globalState");
    if (gs && typeof gs.isAuthenticated === "function") return Promise.resolve(gs.isAuthenticated());
    return Promise.resolve(true);
  } catch (e) {
    return Promise.resolve(true);
  }
};
const getCurrentLogs = (state) => {
  const logMap = { [TABS.AUDIT]: state.auditLogs, [TABS.PERMISSIONS]: state.permissionLogs, [TABS.FRONTEND]: state.frontendLogs, [TABS.SECURITY]: state.securityLogs };
  return logMap[state.activeTab] || state.auditLogs;
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const formatDateFilename = () => {
  const now = /* @__PURE__ */ new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${now.getFullYear() + m + d}_${h}${min}`;
};
const getPresetDays = (preset) => PRESET_DAYS[preset] || 30;
const buildInlineFilters = (filters) => {
  const inlineFilters = {};
  const keys = Object.keys(filters);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key.indexOf("inline_") === 0 && filters[key]) {
      inlineFilters[key.replace("inline_", "")] = filters[key];
    }
  }
  return inlineFilters;
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() });
const healthCheck = () => {
  const logger = _getPort("logger");
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true, loggerReady: !!logger }, timestamp: Date.now() };
};
var helpers_default = { VERSION, MODULE_ID, log, checkAuth, getCurrentLogs, delay, formatDateFilename, getPresetDays, buildInlineFilters, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  buildInlineFilters,
  checkAuth,
  helpers_default as default,
  delay,
  formatDateFilename,
  getCurrentLogs,
  getPorts,
  getPresetDays,
  healthCheck,
  info,
  injectPorts,
  log
};
