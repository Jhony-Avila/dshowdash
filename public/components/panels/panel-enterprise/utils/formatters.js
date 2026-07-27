const MODULE_ID = "panel-enterprise.utils.formatters";
const VERSION = "9.3.0-P2-ENTERPRISE";
function formatCurrency(value, locale = "pt-BR", currency = "BRL") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}
function formatDate(date, locale = "pt-BR") {
  return new Intl.DateTimeFormat(locale).format(new Date(date));
}
function formatPercentage(value, decimals = 2) {
  return `${(value * 100).toFixed(decimals)}%`;
}
function formatNumber(value, locale = "pt-BR") {
  return new Intl.NumberFormat(locale).format(value);
}
export {
  MODULE_ID,
  VERSION,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercentage
};
