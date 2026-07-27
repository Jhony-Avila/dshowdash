function debounce(fn, delay = 300) {
  let timeoutId = null;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}
function throttle(fn, limit = 300) {
  let inThrottle = false;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, deepClone(v)]));
}
function deepMerge(target, source) {
  if (!source) return target;
  const result = deepClone(target);
  const src = source;
  for (const key of Object.keys(src)) {
    if (src[key] && typeof src[key] === "object" && !Array.isArray(src[key])) {
      result[key] = deepMerge(result[key] || {}, src[key]);
    } else {
      result[key] = src[key];
    }
  }
  return result;
}
var helpers_default = { debounce, throttle, deepClone, deepMerge };
const MODULE_ID = "panel-05:utils:helpers";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  debounce,
  deepClone,
  deepMerge,
  helpers_default as default,
  healthCheck,
  info,
  throttle
};
