const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.audit-trail.config";
const ACTION_TYPES = Object.freeze({
  LOGIN: "auth.login",
  LOGOUT: "auth.logout",
  PERMISSION_CHANGE: "permission.change",
  FEATURE_FLAG_CHANGE: "feature_flag.change",
  PANEL_ACTION: "panel.action",
  JOB_ACTION: "job.action",
  EXPORT: "export",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete"
});
const RESOURCE_TYPES = Object.freeze({
  USER: "user",
  PANEL: "panel",
  JOB: "job",
  SETTING: "setting",
  FEATURE_FLAG: "feature_flag",
  PERMISSION: "permission",
  REPORT: "report",
  EXPORT: "export"
});
const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  maxEntries: 1e3,
  batchSize: 50,
  flushInterval: 3e4,
  endpoint: "/api/audit",
  retryAttempts: 3,
  retryDelay: 1e3
});
let _config = { ...DEFAULT_CONFIG };
function createDefaultConfig() {
  return { ...DEFAULT_CONFIG };
}
function createMetrics() {
  return {
    logged: 0,
    flushed: 0,
    errors: 0,
    flushCount: 0,
    lastActivity: null,
    lastFlush: null,
    lastError: null
  };
}
const logger = {
  info: (...args) => {
    if (typeof console !== "undefined" && console.info) {
      console.info("[audit-trail]", ...args);
    }
  },
  warn: (...args) => {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[audit-trail]", ...args);
    }
  },
  error: (...args) => {
    if (typeof console !== "undefined" && console.error) {
      console.error("[audit-trail]", ...args);
    }
  }
};
function getConfig() {
  return { ..._config };
}
function setConfig(newConfig) {
  _config = { ..._config, ...newConfig };
}
function reset() {
  _config = { ...DEFAULT_CONFIG };
}
function healthCheck() {
  const checks = {
    hasConfig: !!_config,
    hasEndpoint: !!_config.endpoint,
    validFlushInterval: _config.flushInterval > 0,
    validBatchSize: _config.batchSize > 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY";
  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: getConfig(),
    actionTypes: Object.keys(ACTION_TYPES),
    resourceTypes: Object.keys(RESOURCE_TYPES),
    timestamp: Date.now()
  };
}
var config_default = {
  ACTION_TYPES,
  RESOURCE_TYPES,
  DEFAULT_CONFIG,
  createDefaultConfig,
  createMetrics,
  logger,
  getConfig,
  setConfig,
  reset,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  ACTION_TYPES,
  DEFAULT_CONFIG,
  MODULE_ID,
  RESOURCE_TYPES,
  VERSION,
  createDefaultConfig,
  createMetrics,
  config_default as default,
  getConfig,
  healthCheck,
  info,
  logger,
  reset,
  setConfig
};
