const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-status/utils/helpers";
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const deepClone = (obj) => {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
};
const isEmpty = (obj) => {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === "object") return Object.keys(obj).length === 0;
  return false;
};
const determineLevel = (value, thresholds) => {
  if (!thresholds) return "unknown";
  if (value >= (thresholds.error || 90)) return "error";
  if (value >= (thresholds.warning || 70)) return "warning";
  return "ok";
};
const aggregateStatuses = (statuses) => {
  const values = Object.values(statuses || {});
  if (values.length === 0) return { total: 0, ok: 0, warning: 0, error: 0, unknown: 0, level: "unknown" };
  const counts = { total: values.length, ok: 0, warning: 0, error: 0, unknown: 0 };
  values.forEach((s) => {
    const lvl = s.level || "unknown";
    counts[lvl] = (counts[lvl] || 0) + 1;
  });
  const level = counts.error > 0 ? "error" : counts.warning > 0 ? "warning" : counts.ok > 0 ? "ok" : "unknown";
  return { ...counts, level };
};
const sortStatusesByLevel = (statuses) => {
  const order = { error: 0, warning: 1, unknown: 2, ok: 3 };
  return Object.entries(statuses).sort((a, b) => (order[a[1].level] ?? 2) - (order[b[1].level] ?? 2));
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION });
var helpers_default = { generateId, sleep, deepClone, isEmpty, determineLevel, aggregateStatuses, sortStatusesByLevel };
export {
  MODULE_ID,
  VERSION,
  aggregateStatuses,
  deepClone,
  helpers_default as default,
  determineLevel,
  generateId,
  healthCheck,
  info,
  isEmpty,
  sleep,
  sortStatusesByLevel
};
