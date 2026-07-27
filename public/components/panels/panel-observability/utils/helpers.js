const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-observability/utils/helpers";
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function deepClone(obj) {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
}
function isEmpty(obj) {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === "object") return Object.keys(obj).length === 0;
  return false;
}
function calculateHealthScore(modules) {
  if (!modules || isEmpty(modules)) return 0;
  const entries = Object.entries(modules);
  const healthy = entries.filter(([, m]) => m?.status === "HEALTHY").length;
  return Math.round(healthy / entries.length * 100);
}
function determineOverallHealth(modules) {
  if (!modules || isEmpty(modules)) return "unknown";
  const entries = Object.values(modules);
  const unhealthy = entries.filter((m) => m?.status === "UNHEALTHY").length;
  const degraded = entries.filter((m) => m?.status === "DEGRADED").length;
  if (unhealthy > 0) return "UNHEALTHY";
  if (degraded > 0) return "DEGRADED";
  return "HEALTHY";
}
function groupModulesByStatus(modules) {
  if (!modules) return { HEALTHY: [], DEGRADED: [], UNHEALTHY: [], unknown: [] };
  return Object.entries(modules).reduce((acc, [name, data]) => {
    const status = data?.status || "unknown";
    if (!acc[status]) acc[status] = [];
    acc[status].push({ name, ...data });
    return acc;
  }, { HEALTHY: [], DEGRADED: [], UNHEALTHY: [], unknown: [] });
}
function sortModulesByHealth(modules) {
  const order = { UNHEALTHY: 0, DEGRADED: 1, unknown: 2, HEALTHY: 3 };
  return Object.entries(modules).sort((a, b) => (order[a[1]?.status || "unknown"] ?? 2) - (order[b[1]?.status || "unknown"] ?? 2));
}
function filterRecentErrors(errors, minutes = 60) {
  const cutoff = Date.now() - minutes * 60 * 1e3;
  return errors.filter((e) => e.timestamp > cutoff);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var helpers_default = { generateId, sleep, deepClone, isEmpty, calculateHealthScore, determineOverallHealth, groupModulesByStatus, sortModulesByHealth, filterRecentErrors };
export {
  MODULE_ID,
  VERSION,
  calculateHealthScore,
  deepClone,
  helpers_default as default,
  determineOverallHealth,
  filterRecentErrors,
  generateId,
  groupModulesByStatus,
  healthCheck,
  info,
  isEmpty,
  sleep,
  sortModulesByHealth
};
