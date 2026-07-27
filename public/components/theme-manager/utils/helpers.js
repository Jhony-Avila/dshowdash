const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "theme-manager-helpers";
function getSystemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function applyThemeClass(theme) {
  document.documentElement.classList.remove("theme-light", "theme-dark");
  document.documentElement.classList.add(`theme-${theme}`);
}
function saveThemePreference(theme) {
  try {
    localStorage.setItem("theme-preference", theme);
  } catch (e) {
  }
}
function loadThemePreference() {
  try {
    return localStorage.getItem("theme-preference");
  } catch (e) {
    return null;
  }
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { available: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, helpers: ["getSystemTheme", "applyThemeClass", "saveThemePreference", "loadThemePreference"], timestamp: Date.now() };
}
function createThemeVariables(theme) {
  return { "--theme-name": theme };
}
var helpers_default = { getSystemTheme, applyThemeClass, saveThemePreference, loadThemePreference, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  applyThemeClass,
  createThemeVariables,
  helpers_default as default,
  getSystemTheme,
  healthCheck,
  info,
  loadThemePreference,
  saveThemePreference
};
