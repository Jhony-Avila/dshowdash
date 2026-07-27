const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-03/utils/formatters";
const formatDuration = (seconds) => {
  if (!seconds || seconds === "--") return "--";
  const num = parseFloat(String(seconds));
  if (isNaN(num)) return "--";
  if (num < 1) return `${(num * 1e3).toFixed(0)}ms`;
  if (num < 60) return `${num.toFixed(1)}s`;
  const minutes = Math.floor(num / 60);
  const secs = Math.round(num % 60);
  return `${minutes}m ${secs}s`;
};
const formatDateTime = (dateString, options = {}) => {
  if (!dateString || dateString === "--") return "--";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "--";
    const defaultOptions = { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" };
    Object.keys(options).forEach((k) => {
      defaultOptions[k] = options[k];
    });
    return date.toLocaleString("pt-BR", defaultOptions);
  } catch (e) {
    return "--";
  }
};
const formatDateTimeFull = (dateString) => formatDateTime(dateString, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const escapeHtml = (text) => {
  if (text === null || text === void 0) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
};
const formatNumber = (num) => {
  if (num === null || num === void 0) return "--";
  const parsed = typeof num === "number" ? num : parseInt(String(num));
  if (isNaN(parsed)) return "--";
  return parsed.toLocaleString("pt-BR");
};
const formatPercent = (value, decimals = 1) => {
  if (value === null || value === void 0) return "--";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "--";
  return `${num.toFixed(decimals)}%`;
};
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
const getRateClass = (rate, threshold = 95) => {
  const num = parseFloat(String(rate));
  if (isNaN(num)) return "";
  if (num >= threshold) return "high";
  if (num >= 80) return "medium";
  return "low";
};
const getHealthClass = (health) => {
  const map = { "healthy": "status-active", "warning": "status-warning", "critical": "status-error", "inactive": "status-inactive" };
  return map[health] || "status-inactive";
};
const getHealthText = (health) => {
  const map = { "healthy": "Saud\xE1vel", "warning": "Aten\xE7\xE3o", "critical": "Cr\xEDtico", "inactive": "Inativo" };
  return map[health] || "Inativo";
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { formattersReady: typeof formatDuration === "function" } });
var formatters_default = { formatDuration, formatDateTime, formatDateTimeFull, escapeHtml, formatNumber, formatPercent, formatBytes, getRateClass, getHealthClass, getHealthText, info, healthCheck };
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
  healthCheck,
  info
};
