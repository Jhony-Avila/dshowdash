const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/formatters";
const escapeHtml = (text) => {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
};
const formatCurrency = (value) => {
  if (value === null || value === void 0) return "R$ 0,00";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};
const formatDate = (dateStr) => {
  if (!dateStr) return "--";
  try {
    const date = new Date(String(dateStr));
    if (isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch (e) {
    return "--";
  }
};
const formatDateTime = (dateStr) => {
  if (!dateStr) return "--";
  try {
    const date = new Date(String(dateStr));
    if (isNaN(date.getTime())) return "--";
    return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "--";
  }
};
const formatNumber = (num) => !num || isNaN(Number(num)) ? "0" : parseInt(String(num)).toLocaleString("pt-BR");
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
export {
  MODULE_ID,
  VERSION,
  escapeHtml,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  getVersion,
  healthCheck,
  info,
  truncate
};
