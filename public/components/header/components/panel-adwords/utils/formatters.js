import { VERSION } from "/core/version.js";
const MODULE_ID = "header/components/panel-adwords/utils/formatters";
function formatCurrency(value, locale = "pt-BR", currency = "BRL") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}
function formatNumber(value, locale = "pt-BR", options = {}) {
  return new Intl.NumberFormat(locale, options).format(value);
}
function formatDate(date, locale = "pt-BR", options = {}) {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}
function formatTime(date, locale = "pt-BR") {
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(date));
}
function formatPercentage(value, decimals = 2) {
  return `${(value * 100).toFixed(decimals)}%`;
}
function truncate(str, length = 50, suffix = "...") {
  if (!str || str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
}
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
}
function slugify(str) {
  return str ? str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "";
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { ready: true } };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID };
}
var formatters_default = { formatCurrency, formatNumber, formatDate, formatTime, formatPercentage, truncate, capitalize, slugify };
export {
  MODULE_ID,
  VERSION,
  capitalize,
  formatters_default as default,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercentage,
  formatTime,
  healthCheck,
  info,
  slugify,
  truncate
};
