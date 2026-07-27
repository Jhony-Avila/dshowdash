const MODULE_ID = "panel-status.utils.formatters";
const VERSION = "9.3.0-P2-ENTERPRISE";
function formatStatus(status) {
  const statusMap = {
    online: { label: "Online", class: "status-online", icon: "fa-check-circle" },
    offline: { label: "Offline", class: "status-offline", icon: "fa-times-circle" },
    warning: { label: "Alerta", class: "status-warning", icon: "fa-exclamation-triangle" },
    error: { label: "Erro", class: "status-error", icon: "fa-exclamation-circle" },
    unknown: { label: "Desconhecido", class: "status-unknown", icon: "fa-question-circle" }
  };
  return statusMap[status] || statusMap.unknown;
}
function formatUptime(seconds) {
  if (!seconds || seconds < 0) return "0s";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  return parts.join(" ") || "< 1m";
}
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
export {
  MODULE_ID,
  VERSION,
  formatBytes,
  formatStatus,
  formatUptime
};
