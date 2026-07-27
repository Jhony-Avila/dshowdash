const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-17/utils/formatters";
const escapeHtml = (text) => {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
};
const formatDatetime = (datetime) => {
  if (!datetime) return "--";
  try {
    const date = new Date(datetime);
    if (isNaN(date.getTime())) return "--";
    return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "--";
  }
};
const formatDuration = (seconds) => {
  if (!seconds || isNaN(Number(seconds))) return "--";
  const num = parseFloat(String(seconds));
  if (num < 60) return `${num.toFixed(2)}s`;
  return `${Math.floor(num / 60)}m ${Math.floor(num % 60)}s`;
};
const formatPercentage = (value, decimals = 2) => `${(parseFloat(String(value)) || 0).toFixed(decimals)}%`;
const formatNumber = (num) => !num || isNaN(Number(num)) ? "0" : parseInt(String(num)).toLocaleString("pt-BR");
const normalizeText = (text) => text ? String(text).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "") : "";
const truncate = (text, maxLength = 50, suffix = "...") => {
  if (!text) return "";
  const str = String(text);
  return str.length <= maxLength ? str : str.substring(0, maxLength - suffix.length) + suffix;
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { formattersReady: true }, timestamp: Date.now() });
function getVersion() {
  return VERSION;
}
const formatDateTime = formatDatetime;
const getHealthClass = (health) => {
  const h = String(health || "").toLowerCase();
  if (h === "active" || h === "healthy" || h === "ok") return "status-active";
  if (h === "warning" || h === "degraded") return "status-warning";
  if (h === "error" || h === "unhealthy" || h === "critical") return "status-error";
  return "status-inactive";
};
const getHealthText = (health) => {
  const h = String(health || "").toLowerCase();
  if (h === "active" || h === "healthy" || h === "ok") return "Ativo";
  if (h === "warning" || h === "degraded") return "Alerta";
  if (h === "error" || h === "unhealthy" || h === "critical") return "Erro";
  return "Inativo";
};
const getRateClass = (rate) => {
  const r = parseFloat(String(rate)) || 0;
  if (r >= 95) return "high";
  if (r >= 80) return "medium";
  return "low";
};
export {
  MODULE_ID,
  VERSION,
  escapeHtml,
  formatDateTime,
  formatDatetime,
  formatDuration,
  formatNumber,
  formatPercentage,
  getHealthClass,
  getHealthText,
  getRateClass,
  getVersion,
  healthCheck,
  info,
  normalizeText,
  truncate
};
