const MODULE_ID = "panel-enterprise.utils.helpers";
const VERSION = "9.3.0-P2-ENTERPRISE";
function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
function throttle(fn, limit = 100) {
  let inThrottle = false;
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
function isEmpty(value) {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
var helpers_default = { debounce, throttle, deepClone, isEmpty };
export {
  MODULE_ID,
  VERSION,
  debounce,
  deepClone,
  helpers_default as default,
  isEmpty,
  throttle
};
