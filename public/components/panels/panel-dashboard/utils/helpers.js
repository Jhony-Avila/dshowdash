const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-dashboard/utils/helpers";
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
function pick(obj, keys) {
  if (!obj) return {};
  return keys.reduce((a, k) => {
    if (k in obj) a[k] = obj[k];
    return a;
  }, {});
}
function omit(obj, keys) {
  if (!obj) return {};
  return Object.keys(obj).reduce((a, k) => {
    if (!keys.includes(k)) a[k] = obj[k];
    return a;
  }, {});
}
function merge(target, source) {
  return Object.assign({}, target, source);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var helpers_default = { generateId, sleep, deepClone, isEmpty, pick, omit, merge };
export {
  MODULE_ID,
  VERSION,
  deepClone,
  helpers_default as default,
  generateId,
  healthCheck,
  info,
  isEmpty,
  merge,
  omit,
  pick,
  sleep
};
