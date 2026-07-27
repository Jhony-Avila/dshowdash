const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-17:ui:formatters";
const formatNumber = (value) => {
  if (value == null) return "--";
  const num = parseFloat(String(value));
  if (isNaN(num)) return String(value);
  return num.toLocaleString("pt-BR");
};
const formatPercent = (value) => {
  if (value == null) return "--";
  const num = parseFloat(String(value));
  if (isNaN(num)) return String(value);
  return `${num.toFixed(1)}%`;
};
const formatDateTime = (date) => {
  if (!date) return "--";
  try {
    return new Date(date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return date;
  }
};
const formatDuration = (seconds) => {
  if (seconds == null) return "--";
  const num = parseFloat(String(seconds));
  if (isNaN(num)) return String(seconds);
  if (num < 1) return `${(num * 1e3).toFixed(0)}ms`;
  if (num < 60) return `${num.toFixed(2)}s`;
  return `${(num / 60).toFixed(1)}min`;
};
const escape = (str) => {
  if (!str) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(str).replace(/[&<>"']/g, (m) => map[m]);
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
var formatters_default = { formatNumber, formatPercent, formatDateTime, formatDuration, escape };
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  escape,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPercent,
  info
};
