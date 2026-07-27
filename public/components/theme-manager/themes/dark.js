const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "theme-manager-dark";
const THEME_NAME = "dark";
const THEME_CONFIG = Object.freeze({ name: "dark", label: "Escuro", background: "#0f172a", text: "#f1f5f9", primary: "#60a5fa", secondary: "#94a3b8" });
function getConfig() {
  return { ...THEME_CONFIG };
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { configValid: true }, themeName: THEME_NAME, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, themeName: THEME_NAME, config: THEME_CONFIG, timestamp: Date.now() };
}
var dark_default = { THEME_NAME, THEME_CONFIG, getConfig, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  THEME_CONFIG,
  THEME_NAME,
  VERSION,
  dark_default as default,
  getConfig,
  healthCheck,
  info
};
