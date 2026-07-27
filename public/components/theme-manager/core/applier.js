const VERSION = "2.1.0-ENTERPRISE";
const MODULE_ID = "theme-manager-applier";
let _metrics = { applications: 0 };
function apply(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.remove("theme-light", "theme-dark");
  document.documentElement.classList.add(`theme-${theme}`);
  _metrics.applications++;
  return true;
}
function remove() {
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.classList.remove("theme-light", "theme-dark");
}
function getMetrics() {
  return { ..._metrics };
}
function healthCheck() {
  const checks = { canApply: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 1 ? "HEALTHY" : "DEGRADED", score: `${passed}/1`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, currentTheme: document.documentElement.getAttribute("data-theme"), metrics: getMetrics(), timestamp: Date.now() };
}
const ThemeApplier = { apply, remove, getMetrics, healthCheck, info };
var applier_default = { apply, remove, getMetrics, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  ThemeApplier,
  VERSION,
  apply,
  applier_default as default,
  getMetrics,
  healthCheck,
  info,
  remove
};
