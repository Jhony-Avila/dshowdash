import { VERSION } from "/core/version.js";
const MODULE_ID = "header/components/panel-adwords/utils/helpers";
function debounce(fn, delay = 300) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}
function throttle(fn, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      target[key] = target[key] || {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
function isObject(val) {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}
function isEmpty(val) {
  if (val == null) return true;
  if (Array.isArray(val) || typeof val === "string") return val.length === 0;
  if (isObject(val)) return Object.keys(val).length === 0;
  return false;
}
function generateId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function retry(fn, attempts = 3, delay = 1e3) {
  return fn().catch((err) => attempts > 1 ? sleep(delay).then(() => retry(fn, attempts - 1, delay * 2)) : Promise.reject(err));
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { ready: true } };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID };
}
var helpers_default = { debounce, throttle, deepClone, deepMerge, isObject, isEmpty, generateId, sleep, retry };
export {
  MODULE_ID,
  VERSION,
  debounce,
  deepClone,
  deepMerge,
  helpers_default as default,
  generateId,
  healthCheck,
  info,
  isEmpty,
  isObject,
  retry,
  sleep,
  throttle
};
