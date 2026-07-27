const VERSION = "8.4.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-12.utils.formatters";
function formatPercent(value) {
  if (value === null || value === void 0) return "--";
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return `${num.toFixed(1)}%`;
}
function parseApiData(data) {
  if (!data) return { cacheHitRate: null };
  const _d = data;
  const apiData = _d.data || _d;
  const value = apiData.hit_rate !== void 0 ? parseFloat(apiData.hit_rate) : apiData.value !== void 0 ? parseFloat(apiData.value) : 0;
  return { cacheHitRate: value };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ["formatPercent", "parseApiData"], timestamp: Date.now() };
}
var formatters_default = { formatPercent, parseApiData };
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  formatPercent,
  healthCheck,
  info,
  parseApiData
};
