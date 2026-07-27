const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-footer-database/utils/formatters";
function date(d, locale = "pt-BR") {
  return new Date(d).toLocaleDateString(locale);
}
function time(d, locale = "pt-BR") {
  return new Date(d).toLocaleTimeString(locale);
}
function datetime(d, locale = "pt-BR") {
  return new Date(d).toLocaleString(locale);
}
function relative(d) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 6e4);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m atr\xE1s`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atr\xE1s`;
  const days = Math.floor(hours / 24);
  return `${days}d atr\xE1s`;
}
function number(n, locale = "pt-BR") {
  return new Intl.NumberFormat(locale).format(n);
}
function currency(n, currency2 = "BRL", locale = "pt-BR") {
  return new Intl.NumberFormat(locale, { style: "currency", currency: currency2 }).format(n);
}
function percent(n, decimals = 0) {
  return `${(n * 100).toFixed(decimals)}%`;
}
function bytes(n) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}
function healthCheck() {
  return { status: "healthy", version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() };
}
var formatters_default = { date, time, datetime, relative, number, currency, percent, bytes, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  bytes,
  currency,
  date,
  datetime,
  formatters_default as default,
  healthCheck,
  info,
  number,
  percent,
  relative,
  time
};
