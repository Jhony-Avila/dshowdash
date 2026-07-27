const MODULE_ID = "panel-08-formatters";
const VERSION = "9.3.0-P2-ENTERPRISE";
function formatRelativeTime(dateStr) {
  if (!dateStr) return "--";
  try {
    const date = new Date(dateStr);
    const now = /* @__PURE__ */ new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMs / 36e5);
    const diffDays = Math.floor(diffMs / 864e5);
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}min atr\xE1s`;
    if (diffHours < 24) return `${diffHours}h atr\xE1s`;
    if (diffDays < 7) return `${diffDays}d atr\xE1s`;
    return date.toLocaleDateString("pt-BR");
  } catch (e) {
    return dateStr;
  }
}
function formatDateTime(dateStr) {
  if (!dateStr) return "--";
  try {
    return new Date(dateStr).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch (e) {
    return dateStr;
  }
}
function formatSeverity(severity) {
  const map = { critical: "Cr\xEDtico", high: "Alto", medium: "M\xE9dio", low: "Baixo" };
  const key = severity ? severity.toLowerCase() : "";
  return map[key] || severity || "--";
}
function formatAlertType(type) {
  const map = { ERROR: "Erro", WARNING: "Aviso", INFO: "Info", SUCCESS: "Sucesso" };
  return map[type] || type || "--";
}
function formatNumber(value) {
  if (value == null) return "--";
  const num = parseFloat(String(value));
  return isNaN(num) ? String(value) : num.toLocaleString("pt-BR");
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
function getVersion() {
  return VERSION;
}
var formatters_default = { MODULE_ID, VERSION, formatRelativeTime, formatDateTime, formatSeverity, formatAlertType, formatNumber, getVersion, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  formatAlertType,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
  formatSeverity,
  getVersion,
  healthCheck,
  info
};
