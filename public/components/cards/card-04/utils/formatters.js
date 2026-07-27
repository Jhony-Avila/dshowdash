const VERSION = "8.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-04.utils.formatters";
const formatHour = (value) => {
  if (value === null || value === void 0) return "--";
  return String(value);
};
const parseApiData = (data) => {
  if (!data) return { peakHour: null };
  const _d = data;
  const apiData = _d.data || _d;
  const hour = apiData.details?.peak_hour !== void 0 ? apiData.details.peak_hour : apiData.value ?? null;
  return { peakHour: hour };
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
  exports: ["formatHour", "parseApiData"],
  timestamp: Date.now()
});
var formatters_default = { formatHour, parseApiData };
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  formatHour,
  healthCheck,
  info,
  parseApiData
};
