const VERSION = "8.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-03.utils.formatters";
const formatScore = (value) => {
  if (value === null || value === void 0) return "--";
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return Math.round(num).toString();
};
const parseApiData = (data) => {
  if (!data) return { score: null };
  const apiData = data.data || data;
  const score = apiData.score !== void 0 ? apiData.score : apiData.value || 0;
  return { score: parseFloat(score) };
};
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() });
const info = () => ({ moduleId: MODULE_ID, version: VERSION, exports: ["formatScore", "parseApiData"], timestamp: Date.now() });
var formatters_default = { formatScore, parseApiData };
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  formatScore,
  healthCheck,
  info,
  parseApiData
};
