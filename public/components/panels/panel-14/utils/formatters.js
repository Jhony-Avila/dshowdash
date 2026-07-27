const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-14/utils/formatters";
function formatDuration(seconds) {
  if (!seconds || seconds === "--") return "--";
  const num = parseFloat(String(seconds));
  if (isNaN(num)) return "--";
  if (num < 1) return `${(num * 1e3).toFixed(0)}ms`;
  if (num < 60) return `${num.toFixed(1)}s`;
  const minutes = Math.floor(num / 60);
  const secs = Math.round(num % 60);
  return `${minutes}m ${secs}s`;
}
function formatDateTime(dateString, options) {
  if (!options) options = {};
  if (!dateString || dateString === "--") return "--";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "--";
    const defaultOptions = Object.assign({ day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }, options);
    return date.toLocaleString("pt-BR", defaultOptions);
  } catch (e) {
    return "--";
  }
}
function formatDateTimeFull(dateString) {
  return formatDateTime(dateString, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function escapeHtml(text) {
  if (text === null || text === void 0) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}
function formatNumber(num) {
  if (num === null || num === void 0) return "--";
  const parsed = typeof num === "number" ? num : parseInt(String(num));
  if (isNaN(parsed)) return "--";
  return parsed.toLocaleString("pt-BR");
}
function formatPercent(value, decimals) {
  if (decimals === void 0) decimals = 1;
  if (value === null || value === void 0) return "--";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "--";
  return `${num.toFixed(decimals)}%`;
}
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
function getRateClass(rate, threshold) {
  if (threshold === void 0) threshold = 95;
  const num = parseFloat(String(rate));
  if (isNaN(num)) return "";
  if (num >= threshold) return "high";
  if (num >= 80) return "medium";
  return "low";
}
function getHealthClass(health) {
  const map = { "healthy": "status-active", "warning": "status-warning", "critical": "status-error", "inactive": "status-inactive" };
  return map[health] || "status-inactive";
}
function getHealthText(health) {
  const map = { "healthy": "Saud\xE1vel", "warning": "Aten\xE7\xE3o", "critical": "Cr\xEDtico", "inactive": "Inativo" };
  return map[health] || "Inativo";
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { formattersReady: true }, timestamp: Date.now() };
}
function getVersion() {
  return VERSION;
}
var formatters_default = { formatDuration, formatDateTime, formatDateTimeFull, escapeHtml, formatNumber, formatPercent, formatBytes, getRateClass, getHealthClass, getHealthText, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  escapeHtml,
  formatBytes,
  formatDateTime,
  formatDateTimeFull,
  formatDuration,
  formatNumber,
  formatPercent,
  getHealthClass,
  getHealthText,
  getRateClass,
  getVersion,
  healthCheck,
  info
};
