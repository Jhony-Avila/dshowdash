const VERSION = "8.4.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-01.utils.formatters";
const numberFormatter = new Intl.NumberFormat("pt-BR");
function formatNumber(value) {
  if (value === null || value === void 0) return "--";
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return numberFormatter.format(num);
}
function formatPercent(value) {
  if (value === null || value === void 0) return "--";
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return `${Math.round(num)}%`;
}
function parseApiData(data) {
  if (!data) return { successRate: null, successCount: null, errorCount: null };
  const _data = data;
  const apiData = _data.data || _data;
  return {
    successRate: apiData.success_rate !== void 0 ? apiData.success_rate : apiData.successRate,
    successCount: apiData.sucesso !== void 0 ? apiData.sucesso : apiData.success,
    errorCount: apiData.erro !== void 0 ? apiData.erro : apiData.error !== void 0 ? apiData.error : apiData.errors
  };
}
function parseSparklineData(history) {
  if (!history || !Array.isArray(history) || history.length === 0) return [];
  return history.map((h) => Math.max(0, Math.min(100, Number(h && h.rate ? h.rate : 0))));
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["formatNumber", "formatPercent", "parseApiData", "parseSparklineData"],
    timestamp: Date.now()
  };
}
var formatters_default = { formatNumber, formatPercent, parseApiData, parseSparklineData };
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  formatNumber,
  formatPercent,
  healthCheck,
  info,
  parseApiData,
  parseSparklineData
};
