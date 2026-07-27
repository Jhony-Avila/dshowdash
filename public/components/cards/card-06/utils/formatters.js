const VERSION = "8.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-06.utils.formatters";
const numberFormatter = new Intl.NumberFormat("pt-BR");
const formatNumber = (value) => {
  if (value === null || value === void 0) return "--";
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return numberFormatter.format(num);
};
const parseApiData = (data) => {
  if (!data) return { failed: null };
  const _d = data;
  const apiData = _d.data || _d;
  const count = apiData.value !== void 0 ? parseInt(apiData.value) : 0;
  return { failed: count };
};
const healthCheck = () => ({
  status: "HEALTHY",
  moduleId: MODULE_ID,
  version: VERSION,
  timestamp: Date.now()
});
const info = () => ({
  moduleId: MODULE_ID,
  version: VERSION,
  exports: ["formatNumber", "parseApiData"],
  timestamp: Date.now()
});
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
