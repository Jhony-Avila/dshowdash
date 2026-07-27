const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-observability/utils/formatters";
function formatNumber(value) {
  if (value === null || value === void 0) return "0";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "0";
  return num.toLocaleString("pt-BR");
}
function formatPercent(value, decimals = 1) {
  if (value === null || value === void 0) return "0%";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "0%";
  return `${num.toFixed(decimals)}%`;
}
function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
function formatMs(ms) {
  if (!ms) return "0ms";
  if (ms < 1e3) return `${Math.round(ms)}ms`;
  return `${(ms / 1e3).toFixed(2)}s`;
}
function formatUptime(ms) {
  if (!ms) return "0s";
  const s = Math.floor(ms / 1e3);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
function formatDateTime(ts) {
  if (!ts) return "--";
  const d = new Date(ts);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
}
function formatRelative(ts) {
  if (!ts) return "--";
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 6e4) return "agora";
  if (diff < 36e5) return `${Math.floor(diff / 6e4)} min`;
  if (diff < 864e5) return `${Math.floor(diff / 36e5)}h`;
  return `${Math.floor(diff / 864e5)}d`;
}
function formatHealthStatus(status) {
  const map = { HEALTHY: "\u{1F7E2} Saud\xE1vel", DEGRADED: "\u{1F7E1} Degradado", UNHEALTHY: "\u{1F534} Cr\xEDtico", unknown: "\u26AA Desconhecido" };
  return map[status] || status || "--";
}
function formatHealthBadge(status) {
  const colors = { HEALTHY: "#28a745", DEGRADED: "#ffc107", UNHEALTHY: "#dc3545", unknown: "#6c757d" };
  return `<span class="health-badge" style="background:${colors[status] || "#6c757d"}">${status || "unknown"}</span>`;
}
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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
var formatters_default = { formatNumber, formatPercent, formatBytes, formatMs, formatUptime, formatDateTime, formatRelative, formatHealthStatus, formatHealthBadge, escapeHtml, debounce };
export {
  MODULE_ID,
  VERSION,
  debounce,
  formatters_default as default,
  escapeHtml,
  formatBytes,
  formatDateTime,
  formatHealthBadge,
  formatHealthStatus,
  formatMs,
  formatNumber,
  formatPercent,
  formatRelative,
  formatUptime,
  healthCheck,
  info
};
