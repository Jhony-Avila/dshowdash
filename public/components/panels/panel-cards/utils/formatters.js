const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-cards/utils/formatters";
function formatCurrency(value) {
  if (value === null || value === void 0) return "R$ 0,00";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatNumber(value) {
  if (value === null || value === void 0) return "0";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "0";
  return num.toLocaleString("pt-BR");
}
function formatCompact(value) {
  if (value === null || value === void 0) return "0";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "0";
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString("pt-BR");
}
function formatPercent(value, decimals = 1) {
  if (value === null || value === void 0) return "0%";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "0%";
  return `${num.toFixed(decimals)}%`;
}
function formatDate(dateStr) {
  if (!dateStr) return "--";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("pt-BR");
  } catch {
    return "--";
  }
}
function formatTime(dateStr) {
  if (!dateStr) return "--";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "--";
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--";
  }
}
function formatRelative(dateStr) {
  if (!dateStr) return "--";
  const now = Date.now();
  const ts = new Date(dateStr).getTime();
  const diff = now - ts;
  if (diff < 6e4) return "agora";
  if (diff < 36e5) return `${Math.floor(diff / 6e4)} min`;
  if (diff < 864e5) return `${Math.floor(diff / 36e5)}h`;
  return `${Math.floor(diff / 864e5)}d`;
}
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function truncate(text, max = 50) {
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max)}...`;
}
function debounce(fn, delay = 300) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), delay);
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var formatters_default = { formatCurrency, formatNumber, formatCompact, formatPercent, formatDate, formatTime, formatRelative, escapeHtml, truncate, debounce };
export {
  MODULE_ID,
  VERSION,
  debounce,
  formatters_default as default,
  escapeHtml,
  formatCompact,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelative,
  formatTime,
  healthCheck,
  info,
  truncate
};
