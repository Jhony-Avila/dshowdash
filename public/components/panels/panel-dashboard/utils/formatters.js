const MODULE_ID = "panel-dashboard.utils.formatters";
const VERSION = "9.3.0-P2-ENTERPRISE";
function formatMetricValue(value, type = "number") {
  if (value == null) return "-";
  switch (type) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    case "percentage":
      return `${(value * 100).toFixed(1)}%`;
    case "duration":
      return formatDuration(value);
    default:
      return new Intl.NumberFormat("pt-BR").format(value);
  }
}
function formatDuration(ms) {
  if (ms < 1e3) return `${ms}ms`;
  if (ms < 6e4) return `${(ms / 1e3).toFixed(1)}s`;
  return `${Math.floor(ms / 6e4)}m ${Math.floor(ms % 6e4 / 1e3)}s`;
}
function formatTimestamp(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date(date));
}
export {
  MODULE_ID,
  VERSION,
  formatDuration,
  formatMetricValue,
  formatTimestamp
};
