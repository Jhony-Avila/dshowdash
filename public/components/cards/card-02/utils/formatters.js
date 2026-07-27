const VERSION = "8.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-02.utils.formatters";
const formatPercent = (value) => {
  if (value === null || value === void 0) return "--";
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return `${Math.round(num)}%`;
};
const parseApiData = (data) => {
  if (!data) return { successRate: null };
  const _d = data;
  const apiData = _d.data || _d;
  const rate = apiData.success_rate !== void 0 ? apiData.success_rate : apiData.rate || 0;
  return { successRate: parseFloat(rate) };
};
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() });
const info = () => ({ moduleId: MODULE_ID, version: VERSION, exports: ["formatPercent", "parseApiData"], timestamp: Date.now() });
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
