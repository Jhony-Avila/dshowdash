const VERSION = "8.4.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-07.utils.formatters";
const numberFormatter = new Intl.NumberFormat("pt-BR");
function formatNumber(value) {
  if (value === null || value === void 0) return "--";
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return numberFormatter.format(num);
}
function parseApiData(data) {
  if (!data) return { running: null };
  const _d = data;
  const apiData = _d.data || _d;
  const count = apiData.value !== void 0 ? parseInt(apiData.value) : 0;
  return { running: count };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ["formatNumber", "parseApiData"], timestamp: Date.now() };
}
var formatters_default = { formatNumber, parseApiData };
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  formatNumber,
  healthCheck,
  info,
  parseApiData
};
