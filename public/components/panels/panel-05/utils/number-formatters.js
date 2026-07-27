function formatCompact(value, options = {}) {
  const { prefix = "", suffix = "", decimals = 1 } = options;
  if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
  const num = Number(value);
  const absNum = Math.abs(num);
  let formatted;
  if (absNum >= 1e9) formatted = `${(num / 1e9).toFixed(Number(decimals))}B`;
  else if (absNum >= 1e6) formatted = `${(num / 1e6).toFixed(Number(decimals))}M`;
  else if (absNum >= 1e3) formatted = `${(num / 1e3).toFixed(Number(decimals))}K`;
  else formatted = num.toFixed(Number(decimals));
  return `${prefix}${formatted}${suffix}`;
}
function formatCurrency(value, options = {}) {
  const { currency = "BRL", compact = false, decimals = 2 } = options;
  if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
  const num = Number(value);
  if (compact && Math.abs(num) >= 1e3) return formatCompact(num, { prefix: "R$ ", decimals: 1 });
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency, minimumFractionDigits: Number(decimals), maximumFractionDigits: Number(decimals) }).format(num);
}
function formatNumber(value, options = {}) {
  const { decimals = 0, compact = false } = options;
  if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
  const num = Number(value);
  if (compact && Math.abs(num) >= 1e3) return formatCompact(num, { decimals: 1 });
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: Number(decimals), maximumFractionDigits: Number(decimals) }).format(num);
}
function formatPercent(value, options = {}) {
  const { decimals = 1, showSign = false } = options;
  if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
  const num = Number(value);
  const sign = showSign && num > 0 ? "+" : "";
  return `${sign}${num.toFixed(Number(decimals))}%`;
}
function formatDelta(value, options = {}) {
  const { decimals = 1, type = "percent" } = options;
  if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
  const num = Number(value);
  const sign = num > 0 ? "+" : "";
  const suffix = type === "percent" ? "%" : "";
  return `${sign}${num.toFixed(Number(decimals))}${suffix}`;
}
var number_formatters_default = { formatCurrency, formatNumber, formatCompact, formatPercent, formatDelta };
const MODULE_ID = "panel-05:utils:number-formatters";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  MODULE_ID,
  VERSION,
  number_formatters_default as default,
  formatCompact,
  formatCurrency,
  formatDelta,
  formatNumber,
  formatPercent,
  healthCheck,
  info
};
