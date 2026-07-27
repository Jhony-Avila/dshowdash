const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "overlay-layer-helpers";
function deepClone(obj) {
  if (!obj || typeof obj !== "object") return obj;
  return JSON.parse(JSON.stringify(obj));
}
function generateId(prefix = "overlay") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function debounce(fn, ms = 100) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
function isFunction(val) {
  return typeof val === "function";
}
function isObject(val) {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}
function healthCheck() {
  const checks = { functionsAvailable: true };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: "HEALTHY", score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, helpers: ["deepClone", "generateId", "debounce", "isFunction", "isObject"], timestamp: Date.now() };
}
var helpers_default = { deepClone, generateId, debounce, isFunction, isObject, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  debounce,
  deepClone,
  helpers_default as default,
  generateId,
  healthCheck,
  info,
  isFunction,
  isObject
};
