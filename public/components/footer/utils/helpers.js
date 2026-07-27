const VERSION = "6.2.0-ENTERPRISE";
const MODULE_ID = "footer-utils-helpers";
const _metrics = { formatCalls: 0, idGenerated: 0 };
function formatTime(timestamp, locale) {
  locale = locale || "pt-BR";
  _metrics.formatCalls++;
  const date = new Date(timestamp);
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}
function formatDate(timestamp, locale) {
  locale = locale || "pt-BR";
  _metrics.formatCalls++;
  const date = new Date(timestamp);
  return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDuration(ms) {
  _metrics.formatCalls++;
  const seconds = Math.floor(ms / 1e3);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
function debounce(fn, delay) {
  delay = delay || 300;
  let timeoutId;
  return function() {
    const args = arguments;
    const self = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(self, args);
    }, delay);
  };
}
function throttle(fn, limit) {
  limit = limit || 300;
  let inThrottle;
  return function() {
    const args = arguments;
    const self = this;
    if (!inThrottle) {
      fn.apply(self, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
function generateId(prefix) {
  prefix = prefix || "footer";
  _metrics.idGenerated++;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function safeJsonParse(str, fallback) {
  fallback = fallback === void 0 ? null : fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}
function getMetrics() {
  return { formatCalls: _metrics.formatCalls, idGenerated: _metrics.idGenerated };
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { helpersReady: true }, metrics: getMetrics() };
}
var helpers_default = { formatTime, formatDate, formatDuration, debounce, throttle, generateId, safeJsonParse, getMetrics, getVersion, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  debounce,
  helpers_default as default,
  formatDate,
  formatDuration,
  formatTime,
  generateId,
  getMetrics,
  getVersion,
  healthCheck,
  info,
  safeJsonParse,
  throttle
};
