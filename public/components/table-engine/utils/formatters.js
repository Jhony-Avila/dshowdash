const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "table-engine:formatters";
function formatCurrency(value, locale = "pt-BR", currency = "BRL") {
  if (value == null || isNaN(Number(value))) return "R$ 0,00";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(value));
}
function formatNumber(value, locale = "pt-BR", decimals = 2) {
  if (value == null || isNaN(Number(value))) return "0";
  return new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(value));
}
function formatPercent(value, locale = "pt-BR", decimals = 1) {
  if (value == null || isNaN(Number(value))) return "0%";
  return new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(value) / 100);
}
function formatDate(value, locale = "pt-BR") {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(locale);
}
function formatDateTime(value, locale = "pt-BR") {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString(locale);
}
function formatTime(value, locale = "pt-BR") {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}
function formatCNPJ(value) {
  if (!value) return "-";
  const clean = String(value).replace(/\D/g, "").padStart(14, "0");
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
function formatCPF(value) {
  if (!value) return "-";
  const clean = String(value).replace(/\D/g, "").padStart(11, "0");
  return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}
function formatPhone(value) {
  if (!value) return "-";
  const clean = String(value).replace(/\D/g, "");
  if (clean.length === 11) return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (clean.length === 10) return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return value;
}
function formatCEP(value) {
  if (!value) return "-";
  const clean = String(value).replace(/\D/g, "").padStart(8, "0");
  return clean.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}
function formatBoolean(value, trueLabel = "Sim", falseLabel = "N\xE3o") {
  return value ? trueLabel : falseLabel;
}
function formatStatus(value, statusMap = {}) {
  return statusMap[value] || value || "-";
}
function truncate(value, maxLength = 50, suffix = "...") {
  if (!value) return "";
  const str = String(value);
  return str.length > maxLength ? str.slice(0, maxLength - suffix.length) + suffix : str;
}
function escapeHtml(str) {
  if (!str) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
}
var formatters_default = { formatCurrency, formatNumber, formatPercent, formatDate, formatDateTime, formatTime, formatCNPJ, formatCPF, formatPhone, formatCEP, formatBoolean, formatStatus, truncate, escapeHtml, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  escapeHtml,
  formatBoolean,
  formatCEP,
  formatCNPJ,
  formatCPF,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatPhone,
  formatStatus,
  formatTime,
  truncate
};
