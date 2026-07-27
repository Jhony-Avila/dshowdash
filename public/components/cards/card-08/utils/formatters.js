const VERSION = "8.4.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-08.utils.formatters";
const decimalFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
function formatDecimal(value) {
  if (value === null || value === void 0) return "--";
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return "--";
  return decimalFormatter.format(num);
}
function parseApiData(data) {
  if (!data) return { averagePerHour: null };
  const _d = data;
  const apiData = _d.data || _d;
  const value = apiData.value !== void 0 ? parseFloat(apiData.value) : 0;
  return { averagePerHour: value };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ["formatDecimal", "parseApiData"], timestamp: Date.now() };
}
var formatters_default = { formatDecimal, parseApiData };
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  formatDecimal,
  healthCheck,
  info,
  parseApiData
};
