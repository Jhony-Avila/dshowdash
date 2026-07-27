function getStatusColor(status) {
  const colors = {
    ativo: "#22C55E",
    inativo: "#6B7280",
    pendente: "#F59E0B",
    cancelado: "#EF4444",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
    neutral: "#6B7280"
  };
  return colors[String(status || "").toLowerCase()] || colors.neutral;
}
function getRiscoColor(risco) {
  const colors = { baixo: "#22C55E", medio: "#F59E0B", alto: "#EF4444", critico: "#DC2626" };
  return colors[String(risco || "").toLowerCase()] || "#6B7280";
}
function getTrendColor(value) {
  const num = Number(value);
  if (num > 0) return "var(--p05-success)";
  if (num < 0) return "var(--p05-danger)";
  return "var(--p05-text-muted)";
}
function hexToRgba(hex, alpha = 1) {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return hex;
  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
var colors_default = { getStatusColor, getRiscoColor, getTrendColor, hexToRgba };
const MODULE_ID = "panel-05:utils:colors";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { colorsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  colors_default as default,
  getRiscoColor,
  getStatusColor,
  getTrendColor,
  healthCheck,
  hexToRgba,
  info
};
