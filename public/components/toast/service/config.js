const VERSION = "1.2.0-P2-ENTERPRISE";
const MODULE_ID = "toast.service.config";
const CONFIG = {
  maxVisible: 3,
  stackGap: 12,
  position: "bottom-right",
  zIndex: 10003,
  durations: {
    success: 3e3,
    info: 4e3,
    warning: 5e3,
    error: 7e3,
    critical: 0
  },
  colors: {
    success: { accent: "#22c55e", rgb: "34, 197, 94" },
    info: { accent: "#3b82f6", rgb: "59, 130, 246" },
    warning: { accent: "#f59e0b", rgb: "245, 158, 11" },
    error: { accent: "#ef4444", rgb: "239, 68, 68" },
    critical: { accent: "#dc2626", rgb: "220, 38, 38" }
  },
  badges: {
    success: "SUCESSO",
    info: "INFO",
    warning: "ATEN\xC7\xC3O",
    error: "ERRO",
    critical: "CR\xCDTICO"
  }
};
function getConfig() {
  return Object.assign({}, CONFIG);
}
function updateConfig(options) {
  if (!options) options = {};
  Object.assign(CONFIG, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, config: getConfig(), timestamp: Date.now() };
}
function healthCheck() {
  const checks = { configValid: typeof CONFIG === "object", hasDurations: typeof CONFIG.durations === "object", hasColors: typeof CONFIG.colors === "object" };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  return { status: passed === checkKeys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${checkKeys.length}`, moduleId: MODULE_ID, version: VERSION, checks, timestamp: Date.now() };
}
var config_default = { CONFIG, getConfig, updateConfig, VERSION, MODULE_ID, info, healthCheck };
export {
  CONFIG,
  MODULE_ID,
  VERSION,
  config_default as default,
  getConfig,
  healthCheck,
  info,
  updateConfig
};
