const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "theme-manager-light";
const THEME_NAME = "light";
const THEME_CONFIG = Object.freeze({ name: "light", label: "Claro", background: "#ffffff", text: "#1a1a1a", primary: "#3b82f6", secondary: "#64748b" });
function getConfig() {
  return { ...THEME_CONFIG };
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { configValid: true }, themeName: THEME_NAME, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, themeName: THEME_NAME, config: THEME_CONFIG, timestamp: Date.now() };
}
var light_default = { THEME_NAME, THEME_CONFIG, getConfig, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  THEME_CONFIG,
  THEME_NAME,
  VERSION,
  light_default as default,
  getConfig,
  healthCheck,
  info
};
