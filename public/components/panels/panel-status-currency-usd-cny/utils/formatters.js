const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-status-currency-usd-cny/utils/formatters";
const date = (d, locale = "pt-BR") => new Date(d).toLocaleDateString(locale);
const time = (d, locale = "pt-BR") => new Date(d).toLocaleTimeString(locale);
const datetime = (d, locale = "pt-BR") => new Date(d).toLocaleString(locale);
const relative = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 6e4);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m atr\xE1s`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atr\xE1s`;
  const days = Math.floor(hours / 24);
  return `${days}d atr\xE1s`;
};
const number = (n, locale = "pt-BR") => new Intl.NumberFormat(locale).format(n);
const currency = (n, curr = "BRL", locale = "pt-BR") => new Intl.NumberFormat(locale, { style: "currency", currency: curr }).format(n);
const percent = (n, decimals = 0) => `${(n * 100).toFixed(decimals)}%`;
const bytes = (n) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
};
const healthCheck = () => ({ status: "healthy", version: VERSION, moduleId: MODULE_ID });
const info = () => ({ version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() });
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
