const VERSION = "3.0.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-helpers";
let _metrics = { safeCalls: 0, errors: 0 };
function generateId(prefix) {
  prefix = prefix || "shell";
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function debounce(fn, delay) {
  delay = delay || 300;
  let timer = null;
  return function() {
    const args = arguments;
    const context = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}
function throttle(fn, limit) {
  limit = limit || 100;
  let inThrottle = false;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      fn.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
function isFunction(value) {
  return typeof value === "function";
}
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function safeCall(fn, context) {
  _metrics.safeCalls++;
  if (!isFunction(fn)) return null;
  try {
    const args = Array.prototype.slice.call(arguments, 2);
    return fn.apply(context, args);
  } catch (err) {
    _metrics.errors++;
    return null;
  }
}
function timestamp() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function noop() {
}
function getMetrics() {
  return { safeCalls: _metrics.safeCalls, errors: _metrics.errors };
}
function healthCheck() {
  const checks = {
    functionsAvailable: true,
    lowErrorRate: _metrics.safeCalls === 0 || _metrics.errors / _metrics.safeCalls < 0.1
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 2 ? "HEALTHY" : "DEGRADED",
    score: `${passed}/2`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    helpers: ["generateId", "debounce", "throttle", "isFunction", "isObject", "safeCall", "timestamp", "noop"],
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var helpers_default = {
  generateId,
  debounce,
  throttle,
  isFunction,
  isObject,
  safeCall,
  timestamp,
  noop,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  debounce,
  helpers_default as default,
  generateId,
  getMetrics,
  healthCheck,
  info,
  isFunction,
  isObject,
  noop,
  safeCall,
  throttle,
  timestamp
};
