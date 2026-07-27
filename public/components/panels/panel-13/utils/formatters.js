const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-13:utils:formatters";
const formatCurrency = (value, currency = "BRL") => {
  if (value == null) return "--";
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);
  return num.toLocaleString("pt-BR", { style: "currency", currency });
};
const formatNumber = (value) => {
  if (value == null) return "--";
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);
  return num.toLocaleString("pt-BR");
};
const formatPercent = (value, decimals = 1) => {
  if (value == null) return "--";
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);
  return `${num.toFixed(decimals)}%`;
};
const formatDate = (date) => {
  if (!date) return "--";
  try {
    return new Date(date).toLocaleDateString("pt-BR");
  } catch (e) {
    return date;
  }
};
const formatDateTime = (date) => {
  if (!date) return "--";
  try {
    return new Date(date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return date;
  }
};
const escape = (str) => {
  if (!str) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(str).replace(/[&<>"']/g, (m) => map[m]);
};
const truncate = (str, maxLength = 50) => {
  if (!str) return "";
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION });
const formatDuration = (seconds) => {
  if (seconds == null || isNaN(Number(seconds))) return "--";
  const total = Math.floor(Number(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor(total % 3600 / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};
const getHealthClass = (status) => {
  if (!status) return "health-unknown";
  const normalized = String(status).toUpperCase();
  if (normalized === "HEALTHY" || normalized === "OK" || normalized === "UP") return "health-ok";
  if (normalized === "DEGRADED" || normalized === "WARN" || normalized === "WARNING") return "health-warn";
  if (normalized === "CRITICAL" || normalized === "ERROR" || normalized === "DOWN") return "health-critical";
  return "health-unknown";
};
const getHealthText = (status) => {
  if (!status) return "Desconhecido";
  const normalized = String(status).toUpperCase();
  if (normalized === "HEALTHY" || normalized === "OK" || normalized === "UP") return "Saud\xE1vel";
  if (normalized === "DEGRADED" || normalized === "WARN" || normalized === "WARNING") return "Degradado";
  if (normalized === "CRITICAL" || normalized === "ERROR" || normalized === "DOWN") return "Cr\xEDtico";
  return String(status);
};
const getRateClass = (rate, warnThreshold = 75, criticalThreshold = 90) => {
  if (rate == null || isNaN(Number(rate))) return "rate-unknown";
  const n = Number(rate);
  if (n >= criticalThreshold) return "rate-critical";
  if (n >= warnThreshold) return "rate-warn";
  return "rate-ok";
};
var formatters_default = { formatCurrency, formatNumber, formatPercent, formatDate, formatDateTime, formatDuration, getHealthClass, getHealthText, getRateClass, escape, truncate, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  escape,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPercent,
  getHealthClass,
  getHealthText,
  getRateClass,
  healthCheck,
  info,
  truncate
};
